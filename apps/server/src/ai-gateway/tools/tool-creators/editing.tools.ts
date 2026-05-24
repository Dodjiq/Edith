import { Tool } from 'ai';
import type {
  EditorRealtimePayload,
  EditorRemoveSilencesPayload,
  EditorSetCaptionsPayload,
  RemoveSilencesDetections,
} from 'api-types';
import { editorToolNames, realtimeMessageTypes } from 'api-types';
import { z } from 'zod';
import { stripUrlsFromProjectState, mapToolResultStatus, extractErrorDetail } from './utils';
import type {
  ToolsContext,
  ActionToolDependencies,
  ToolDependencies,
  RemoveSilencesInput,
  RemoveSilencesResult,
  SetCaptionsInput,
  SetCaptionsResult,
} from './types';

const DEFAULT_NOISE_THRESHOLD = -28;
const DEFAULT_MIN_DURATION = 0.35;
const DEFAULT_PADDING = 0.2;

export function createRemoveSilencesTool(
  deps: ActionToolDependencies,
  context?: ToolsContext,
): Tool<RemoveSilencesInput, RemoveSilencesResult> {
  const description = [
    'Remove silences from one selected audio-capable timeline item (video or audio only).',
    'Use after selecting exactly one valid item; do not batch across multiple timeline items.',
    'Optionally pass noise threshold, minimum duration, and padding seconds to customize detection.',
    'Prefer using default expect if you have a specific reason for customizing.',
    'If many items, you must use the tools on each item individually.',
    'Only apply on item that have an audio track and a transcription.',
  ].join(' ');

  const inputSchema = z.object({
    itemId: z.string().trim().min(1, 'Provide the single target item ID').optional(),
    noiseThresholdInDecibels: z.number().optional(),
    minDurationInSeconds: z.number().optional(),
    paddingInSeconds: z.number().optional(),
    reason: z.string().trim().max(200).optional(),
  });

  const resolveDetectionTargets = (targetItemId?: string) => {
    const state = context?.projectState;
    if (!state) return [] as { itemId: string; assetUrl: string }[];

    const itemsById = new Map(state.projectItemsInfo.map((item) => [item.itemId, item]));
    const candidateIds =
      targetItemId && targetItemId.trim().length > 0
        ? [targetItemId.trim()]
        : state.selectedItemsInfo.length > 0
          ? state.selectedItemsInfo
          : [];

    return candidateIds
      .map((id) => itemsById.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => {
        const remoteUrl = typeof item.remoteUrl === 'string' ? item.remoteUrl.trim() : '';
        return { item, remoteUrl };
      })
      .filter(({ item, remoteUrl }) => item.hasAudioTrack && remoteUrl.length > 0)
      .map(({ item, remoteUrl }) => ({ itemId: item.itemId, assetUrl: remoteUrl }));
  };

  const detectSilencesForTargets = async ({
    targets,
    noiseThreshold,
    minDuration,
  }: {
    targets: { itemId: string; assetUrl: string }[];
    noiseThreshold: number;
    minDuration: number;
  }): Promise<RemoveSilencesDetections> => {
    const detections: RemoveSilencesDetections = {};

    for (const target of targets) {
      try {
        const detection = await deps.audioService.detectSilence({
          assetUrl: target.assetUrl,
          noiseThresholdInDecibels: noiseThreshold,
          minDurationInSeconds: minDuration,
        });
        detections[target.itemId] = detection;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        deps.logger.warn(`Silence detection failed for item ${target.itemId}: ${message}`);
      }
    }

    return detections;
  };

  return {
    description,
    inputSchema,
    execute: async (
      {
        itemId,
        noiseThresholdInDecibels,
        minDurationInSeconds,
        paddingInSeconds,
        reason,
      }: RemoveSilencesInput,
      { toolCallId }: { toolCallId?: string },
    ) => {
      const trimmedItemId = itemId?.trim();
      const resolvedNoiseThreshold = noiseThresholdInDecibels ?? DEFAULT_NOISE_THRESHOLD;
      const resolvedMinDuration = minDurationInSeconds ?? DEFAULT_MIN_DURATION;
      const resolvedPadding = paddingInSeconds ?? DEFAULT_PADDING;
      const resolvedToolCallId = toolCallId ?? `remove-silences-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(resolvedToolCallId);

      const detectionTargets = resolveDetectionTargets(trimmedItemId);
      const detectionsByItemId =
        detectionTargets.length > 0
          ? await detectSilencesForTargets({
              targets: detectionTargets,
              noiseThreshold: resolvedNoiseThreshold,
              minDuration: resolvedMinDuration,
            })
          : undefined;

      const params: EditorRemoveSilencesPayload['params'] = {
        targetItemId: trimmedItemId && trimmedItemId.length > 0 ? trimmedItemId : undefined,
        noiseThresholdInDecibels: resolvedNoiseThreshold,
        minDurationInSeconds: resolvedMinDuration,
        paddingInSeconds: resolvedPadding,
        detectionsByItemId:
          detectionsByItemId && Object.keys(detectionsByItemId).length > 0 ? detectionsByItemId : undefined,
      };

      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: {
          tool_name: editorToolNames.removeSilences,
          params,
          toolCallId: resolvedToolCallId,
          messageId: context?.messageId,
          requestedAt: new Date().toISOString(),
        } satisfies EditorRealtimePayload,
        timestamp: new Date().toISOString(),
      });

      const result = await waitForResult;
      if ('status' in result && result.status === 'timeout') {
        return {
          status: 'timeout',
          targetItemId: params.targetItemId,
          note: 'No response received from editor.',
        };
      }

      const mappedStatus = mapToolResultStatus(result.status, {
        success: 'completed' as const,
        skipped: 'skipped' as const,
        error: 'error' as const,
      });
      const errorDetail = extractErrorDetail(result);

      const {
        removedSegments,
        projectState: rawProjectState,
        ...mergedOutputBase
      } = (result.output ?? {}) as Record<string, unknown>;
      const mergedOutput: Record<string, unknown> =
        mappedStatus === 'error' && errorDetail
          ? { ...mergedOutputBase, error: errorDetail }
          : { ...mergedOutputBase };

      deps.logger.debug(`Project state after remove-silences:`, rawProjectState);

      return {
        status: mappedStatus,
        targetItemId: params.targetItemId,
        note:
          mappedStatus === 'error'
            ? (errorDetail ?? 'Remove-silences request failed without details from the editor.')
            : (reason ??
              'Remove-silences request finished. Ensure a single audio or video item is selected before applying.'),
        output: Object.keys(mergedOutput).length > 0 ? mergedOutput : undefined,
        error: errorDetail,
        projectState: rawProjectState
          ? stripUrlsFromProjectState(rawProjectState as Record<string, unknown>)
          : undefined,
      };
    },
  } as unknown as Tool<RemoveSilencesInput, RemoveSilencesResult>;
}

export function createSetCaptionsTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<SetCaptionsInput, SetCaptionsResult> {
  const description = [
    'Create, update, restyle, or edit text of captions/subtitles on the timeline.',
    'RIGHT TOOL for user wording like: add subtitles, add captions, dynamic subtitles, nice subtitles, TikTok-style captions, spoken words on video, transcription captions, closed captions.',
    'Generates captions from real cached/generated transcription. Do not create random subtitle text with static text tools.',
    'MULTI-ITEM SUPPORT: Pass multiple video/audio item IDs via itemIds array to generate captions from all items.',
    'Accepts target types: (1) video/audio item IDs to generate NEW captions, (2) caption item ID to UPDATE STYLE or EDIT TEXT.',
    'For new subtitles, target video/audio item IDs from project state or selection. Only target a caption item ID when restyling/editing existing captions.',
    'TEXT EDITING: Use captionEdits array to modify specific captions by index. First call get_items_data to see current captions.',
    'Each edit object: {index: number, text?: string, startMs?: number, endMs?: number}.',
    'Style overrides: left, top, width, height, opacity, rotation, fontFamily, fontStyle{variant, weight}, fontSize, lineHeight, letterSpacing, align, color, highlightColor, direction, pageDurationInMilliseconds, captionStartInSeconds, strokeWidth, strokeColor, maxLines, fadeInDurationInSeconds, fadeOutDurationInSeconds.',
    'Good dynamic subtitle defaults for 1920x1080: left=240 top=760 width=1440 height=220 fontFamily=Roboto fontStyle.weight="700" fontSize=64 lineHeight=1.08 align=center color=#ffffff strokeWidth=8 strokeColor=#000000 maxLines=2 pageDurationInMilliseconds=1200 fadeInDurationInSeconds=0.08 fadeOutDurationInSeconds=0.08.',
    'IMPORTANT for fontStyle: weight must be a STRING like "400" or "700". Common weights: "400"=normal, "700"=bold.',
    'Set replaceExisting=false to keep current captions when generating new ones.',
  ].join(' ');

  const inputSchema = z.object({
    itemIds: z.array(z.string().trim().min(1, 'Item ID is required')).optional(),
    replaceExisting: z.boolean().optional(),
    style: z
      .object({
        left: z.number().optional(),
        top: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        opacity: z.number().optional(),
        rotation: z.number().optional(),
        fontFamily: z.string().optional(),
        fontStyle: z.object({ variant: z.string().optional(), weight: z.string().optional() }).optional(),
        lineHeight: z.number().optional(),
        letterSpacing: z.number().optional(),
        fontSize: z.number().optional(),
        align: z.enum(['left', 'center', 'right']).optional(),
        color: z.string().optional(),
        highlightColor: z.string().nullable().optional(),
        direction: z.enum(['ltr', 'rtl']).optional(),
        pageDurationInMilliseconds: z.number().optional(),
        captionStartInSeconds: z.number().optional(),
        strokeWidth: z.number().optional(),
        strokeColor: z.string().optional(),
        maxLines: z.number().optional(),
        fadeInDurationInSeconds: z.number().optional(),
        fadeOutDurationInSeconds: z.number().optional(),
      })
      .optional(),
    captionEdits: z
      .array(
        z.object({
          index: z.number().int().min(0, 'Caption index must be non-negative'),
          text: z.string().optional(),
          startMs: z.number().optional(),
          endMs: z.number().optional(),
        }),
      )
      .optional(),
    reason: z.string().trim().max(200).optional(),
  });

  return {
    description,
    inputSchema,
    execute: async (
      { itemIds, replaceExisting, style, captionEdits, reason }: SetCaptionsInput,
      { toolCallId }: { toolCallId?: string },
    ) => {
      const resolvedToolCallId = toolCallId ?? `set-captions-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(resolvedToolCallId);

      const normalizedItemIds = itemIds
        ? Array.from(new Set(itemIds.map((id) => id.trim()).filter((id) => id.length > 0)))
        : undefined;

      const params: EditorSetCaptionsPayload['params'] = {
        targetItemIds: normalizedItemIds && normalizedItemIds.length > 0 ? normalizedItemIds : undefined,
        replaceExisting: replaceExisting ?? true,
        style: style
          ? { ...style, fontStyle: style.fontStyle ? { ...style.fontStyle } : undefined }
          : undefined,
        captionEdits: captionEdits && captionEdits.length > 0 ? captionEdits : undefined,
      };

      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: {
          tool_name: editorToolNames.setCaptions,
          params,
          toolCallId: resolvedToolCallId,
          messageId: context?.messageId,
          requestedAt: new Date().toISOString(),
        } satisfies EditorRealtimePayload,
        timestamp: new Date().toISOString(),
      });

      const result = await waitForResult;
      if ('status' in result && result.status === 'timeout') {
        return {
          status: 'timeout',
          targetItemIds: params.targetItemIds,
          note: 'No response received from editor.',
        };
      }

      const mappedStatus = mapToolResultStatus(result.status, {
        success: 'completed' as const,
        skipped: 'skipped' as const,
        error: 'error' as const,
      });
      const errorDetail = extractErrorDetail(result);

      const mergedOutputBase = result.output ?? {};
      const outputWithStyle: Record<string, unknown> = params.style
        ? { ...mergedOutputBase, requestedStyle: params.style }
        : { ...mergedOutputBase };

      const rawProjectState = outputWithStyle.projectState as Record<string, unknown> | undefined;
      delete outputWithStyle.projectState;

      return {
        status: mappedStatus,
        targetItemIds: params.targetItemIds,
        note:
          mappedStatus === 'error'
            ? (errorDetail ?? 'Set-captions request failed without details from the editor.')
            : (reason ?? 'Set-captions request finished.'),
        output: Object.keys(outputWithStyle).length > 0 ? outputWithStyle : undefined,
        error: errorDetail,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<SetCaptionsInput, SetCaptionsResult>;
}
