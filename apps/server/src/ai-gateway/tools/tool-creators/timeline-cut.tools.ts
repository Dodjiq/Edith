import { Tool } from 'ai';
import type { EditorCutFrameRangePayload } from 'api-types';
import { editorToolNames, realtimeMessageTypes } from 'api-types';
import { z } from 'zod';
import { extractErrorDetail, mapToolResultStatus, stripUrlsFromProjectState } from './utils';
import type {
  CutFrameRangeInput,
  CutFrameRangeResult,
  CutTimeRangesInput,
  CutTimeRangesResult,
  FrameRangeInput,
  TimeRangeInput,
  ToolDependencies,
  ToolsContext,
} from './types';

const frameRangeSchema = z.object({
  startFrame: z.number().int().min(0),
  endFrame: z.number().int().min(1),
});

const timeRangeSchema = z.object({
  startTimeInSeconds: z.number().min(0),
  endTimeInSeconds: z.number().min(0),
});

const normalizeFrameRanges = (ranges: FrameRangeInput[]): FrameRangeInput[] => {
  const sortedRanges = [...ranges].sort((a, b) => a.startFrame - b.startFrame);
  const normalizedRanges: FrameRangeInput[] = [];

  for (const range of sortedRanges) {
    const lastRange = normalizedRanges[normalizedRanges.length - 1];
    if (!lastRange || range.startFrame > lastRange.endFrame) {
      normalizedRanges.push({ ...range });
      continue;
    }

    lastRange.endFrame = Math.max(lastRange.endFrame, range.endFrame);
  }

  return normalizedRanges;
};

const getRemovedFrames = (ranges: FrameRangeInput[]) => {
  return ranges.reduce((sum, range) => sum + (range.endFrame - range.startFrame), 0);
};

const convertTimeRangesToFrameRanges = (ranges: TimeRangeInput[], fps: number): FrameRangeInput[] => {
  return normalizeFrameRanges(
    ranges.map((range) => {
      const startFrame = Math.max(0, Math.floor(range.startTimeInSeconds * fps));
      const endFrame = Math.max(startFrame + 1, Math.ceil(range.endTimeInSeconds * fps));

      return {
        startFrame,
        endFrame,
      };
    }),
  );
};

const dispatchCutFrameRange = async ({
  deps,
  context,
  toolCallId,
  trackId,
  ranges,
}: {
  deps: ToolDependencies;
  context?: ToolsContext;
  toolCallId?: string;
  trackId: string;
  ranges: FrameRangeInput[];
}) => {
  const resolvedToolCallId = toolCallId ?? `cut-frame-range-${Date.now()}`;
  const waitForResult = deps.waitForToolResult(resolvedToolCallId);
  const params: EditorCutFrameRangePayload['params'] = {
    trackId: trackId.trim(),
    ranges,
  };

  deps.realtimeService.dispatchMessage({
    type: realtimeMessageTypes.editor,
    payload: {
      tool_name: editorToolNames.cutFrameRange,
      params,
      toolCallId: resolvedToolCallId,
      messageId: context?.messageId,
      requestedAt: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  });

  return {
    params,
    result: await waitForResult,
  };
};

export function createCutFrameRangeTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<CutFrameRangeInput, CutFrameRangeResult> {
  const description = [
    'Cut/remove content from a specific track at one or more frame ranges with ripple delete.',
    'Provide an array of ranges, each with startFrame (inclusive) and endFrame (exclusive).',
    'Prefer batching all cuts for the same track in one call instead of repeated single-range calls.',
    'Items fully inside a range are deleted. Items partially overlapping are trimmed.',
    'All items after each cut range are shifted backward to close the gap.',
    'In a batched call, all ranges must be absolute coordinates from the same pre-cut timeline state; do not pre-adjust ranges for ripple deletion.',
    'For item-level requests like cutting clips in half, prefer trim_timeline_items.',
  ].join(' ');

  return {
    description,
    inputSchema: z.object({
      trackId: z.string().trim().min(1, 'Track ID is required'),
      ranges: z.array(frameRangeSchema).nonempty('At least one frame range is required'),
      reason: z.string().trim().max(500).optional(),
    }),
    execute: async ({ trackId, ranges, reason }: CutFrameRangeInput, { toolCallId }: { toolCallId?: string }) => {
      const invalidRanges = ranges.filter((range) => range.startFrame >= range.endFrame);
      if (invalidRanges.length > 0) {
        return { status: 'skipped', trackId, ranges, note: 'Invalid range(s): startFrame must be less than endFrame.' };
      }

      const normalizedRanges = normalizeFrameRanges(ranges);
      const { params, result } = await dispatchCutFrameRange({
        deps,
        context,
        toolCallId,
        trackId,
        ranges: normalizedRanges,
      });

      if ('status' in result && result.status === 'timeout') {
        return { status: 'timeout', trackId: params.trackId, ranges: params.ranges, note: 'No response received from editor.' };
      }

      const mappedStatus = mapToolResultStatus(result.status, {
        success: 'completed' as const,
        skipped: 'skipped' as const,
        error: 'error' as const,
      });
      const errorDetail = extractErrorDetail(result);

      if (mappedStatus === 'error') {
        return {
          status: 'error',
          trackId: params.trackId,
          ranges: params.ranges,
          note: errorDetail ?? 'Failed to cut frame range.',
          error: errorDetail,
        };
      }

      const outputWithState = { ...(result.output ?? {}) };
      const rawProjectState = outputWithState.projectState as Record<string, unknown> | undefined;
      delete outputWithState.projectState;
      const totalRemovedFrames = getRemovedFrames(params.ranges);

      return {
        status: mappedStatus,
        trackId: params.trackId,
        ranges: params.ranges,
        removedFrames: totalRemovedFrames,
        note: reason ?? `Cut ${totalRemovedFrames} frames across ${params.ranges.length} range(s), ripple-deleted gaps.`,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<CutFrameRangeInput, CutFrameRangeResult>;
}

export function createCutTimeRangesTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<CutTimeRangesInput, CutTimeRangesResult> {
  const description = [
    'Cut/remove content from a specific track using one or more time ranges in seconds.',
    'Use this when you already have startTimeInSeconds and endTimeInSeconds from transcript analysis.',
    'Provide all cuts for the same track in one call. Overlapping or touching ranges are merged automatically.',
    'The tool converts seconds to frames and performs a single ripple-delete operation in the editor.',
    'If you need exact frame math yourself, use cut_frame_range instead.',
  ].join(' ');

  return {
    description,
    inputSchema: z.object({
      trackId: z.string().trim().min(1, 'Track ID is required'),
      ranges: z.array(timeRangeSchema).nonempty('At least one time range is required'),
      reason: z.string().trim().max(500).optional(),
    }),
    execute: async ({ trackId, ranges, reason }: CutTimeRangesInput, { toolCallId }: { toolCallId?: string }) => {
      const fps = Number(context?.projectState?.fpsInfo);
      if (!Number.isFinite(fps) || fps <= 0) {
        return {
          status: 'skipped',
          trackId: trackId.trim(),
          ranges,
          note: 'FPS info is required to convert time ranges. Call get_project_state before cut_time_ranges.',
        };
      }

      const invalidRanges = ranges.filter((range) => range.startTimeInSeconds >= range.endTimeInSeconds);
      if (invalidRanges.length > 0) {
        return {
          status: 'skipped',
          trackId,
          ranges,
          note: 'Invalid range(s): startTimeInSeconds must be less than endTimeInSeconds.',
        };
      }

      const frameRanges = convertTimeRangesToFrameRanges(ranges, fps);
      const { params, result } = await dispatchCutFrameRange({
        deps,
        context,
        toolCallId,
        trackId,
        ranges: frameRanges,
      });

      if ('status' in result && result.status === 'timeout') {
        return {
          status: 'timeout',
          trackId: params.trackId,
          ranges,
          appliedFrameRanges: params.ranges,
          note: 'No response received from editor.',
        };
      }

      const mappedStatus = mapToolResultStatus(result.status, {
        success: 'completed' as const,
        skipped: 'skipped' as const,
        error: 'error' as const,
      });
      const errorDetail = extractErrorDetail(result);

      if (mappedStatus === 'error') {
        return {
          status: 'error',
          trackId: params.trackId,
          ranges,
          appliedFrameRanges: params.ranges,
          note: errorDetail ?? 'Failed to cut time ranges.',
          error: errorDetail,
        };
      }

      const removedFrames = getRemovedFrames(params.ranges);
      const removedSeconds = Number((removedFrames / fps).toFixed(3));
      const mergedSummary = params.ranges.length === ranges.length
        ? `${ranges.length} range(s)`
        : `${ranges.length} requested range(s) merged into ${params.ranges.length} cut(s)`;

      return {
        status: mappedStatus,
        trackId: params.trackId,
        ranges,
        appliedFrameRanges: params.ranges,
        removedFrames,
        removedSeconds,
        note: reason ?? `Cut ${removedSeconds.toFixed(2)}s on the timeline using ${mergedSummary}.`,
      };
    },
  } as unknown as Tool<CutTimeRangesInput, CutTimeRangesResult>;
}
