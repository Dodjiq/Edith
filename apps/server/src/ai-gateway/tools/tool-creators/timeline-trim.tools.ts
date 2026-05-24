import { Tool } from 'ai';
import type { EditorTrimTimelineItemsPayload, TimelineTrimMode } from 'api-types';
import { editorToolNames, realtimeMessageTypes } from 'api-types';
import { z } from 'zod';
import { extractErrorDetail, mapToolResultStatus, stripUrlsFromProjectState } from './utils';
import type { ToolDependencies, ToolsContext, TrimTimelineItemsInput, TrimTimelineItemsResult } from './types';

const trimModeSchema = z.enum(['first_half', 'duration']);

const getTrimMode = (mode?: TimelineTrimMode): TimelineTrimMode => mode ?? 'first_half';

export function createTrimTimelineItemsTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<TrimTimelineItemsInput, TrimTimelineItemsResult> {
  const description = [
    'Trim existing timeline items by keeping the beginning of each item and ripple-closing the gaps on their tracks.',
    'Use this instead of cut_frame_range when the user asks to cut clips in half, keep the first half, or shorten clips to a duration.',
    'The editor computes item-specific frame ranges, so you do not need to calculate ripple-adjusted cuts.',
    'For "cut them in half", use mode first_half with all target item IDs in one call.',
  ].join(' ');

  return {
    description,
    inputSchema: z.object({
      itemIds: z
        .array(z.string().trim().min(1))
        .nonempty('Provide at least one timeline item ID')
        .describe('Existing timeline item IDs to trim. Use IDs returned by placement tools or project state.'),
      mode: trimModeSchema.optional().describe('Use first_half for cutting clips in half; use duration for a fixed kept duration.'),
      durationInFrames: z.number().int().min(1).optional(),
      durationInSeconds: z.number().min(0).optional(),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async (
      { itemIds, mode, durationInFrames, durationInSeconds, reason }: TrimTimelineItemsInput,
      { toolCallId }: { toolCallId?: string },
    ) => {
      const resolvedMode = getTrimMode(mode);
      if (resolvedMode === 'duration' && durationInFrames === undefined && durationInSeconds === undefined) {
        return {
          status: 'skipped',
          requestedItemIds: itemIds,
          mode: resolvedMode,
          note: 'duration mode requires durationInFrames or durationInSeconds.',
        };
      }

      const normalizedIds = Array.from(new Set(itemIds.map((id) => id.trim()).filter(Boolean)));
      if (normalizedIds.length === 0) {
        return { status: 'skipped', requestedItemIds: [], mode: resolvedMode, note: 'No valid item IDs provided.' };
      }

      const resolvedToolCallId = toolCallId ?? `trim-timeline-items-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(resolvedToolCallId);
      const params: EditorTrimTimelineItemsPayload['params'] = {
        itemIds: normalizedIds,
        mode: resolvedMode,
        durationInFrames,
        durationInSeconds,
      };

      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: {
          tool_name: editorToolNames.trimTimelineItems,
          params,
          toolCallId: resolvedToolCallId,
          messageId: context?.messageId,
          requestedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      const result = await waitForResult;
      if ('status' in result && result.status === 'timeout') {
        return { status: 'timeout', requestedItemIds: normalizedIds, mode: resolvedMode, note: 'No response received from editor.' };
      }

      const mappedStatus = mapToolResultStatus(result.status, {
        success: 'completed' as const,
        skipped: 'skipped' as const,
        error: 'error' as const,
      });
      const errorDetail = extractErrorDetail(result);
      const rawProjectState = result.output?.projectState as Record<string, unknown> | undefined;

      return {
        status: mappedStatus,
        requestedItemIds: normalizedIds,
        mode: resolvedMode,
        trimmedItems: result.output?.trimmedItems as TrimTimelineItemsResult['trimmedItems'],
        skippedItemIds: result.output?.skippedItemIds as string[] | undefined,
        note: reason ?? (mappedStatus === 'completed' ? 'Timeline item(s) trimmed.' : undefined),
        error: mappedStatus === 'error' ? errorDetail : undefined,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<TrimTimelineItemsInput, TrimTimelineItemsResult>;
}
