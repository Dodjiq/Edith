import { Tool } from 'ai';
import type {
  EditorRealtimePayload,
  EditorPlaceLibraryAssetsOnTimelinePayload,
  EditorPlaceTimelineItemsPayload,
  EditorDeleteItemsPayload,
} from 'api-types';
import { editorToolNames, realtimeMessageTypes } from 'api-types';
import { z } from 'zod';
import { stripUrlsFromProjectState, mapToolResultStatus, extractErrorDetail } from './utils';
import { normalizeTimelineAnchor, timelineAnchorSchemaFields } from './timeline-anchor';
import type {
  ToolsContext,
  ToolDependencies,
  SelectTimelineItemsInput,
  SelectTimelineItemsResult,
  PlaceLibraryAssetsOnTimelineInput,
  PlaceLibraryAssetsOnTimelineResult,
  PlaceTimelineItemsInput,
  PlaceTimelineItemsResult,
  DeleteItemsInput,
  DeleteItemsResult,
} from './types';

export function createSelectTimelineItemsTool(deps: ToolDependencies): Tool<SelectTimelineItemsInput, SelectTimelineItemsResult> {
  const description = `
  Select one or more timeline items in the editor.
  Only call this when the project has timeline items and not all items are already selected.
  `;

  return {
    description,
    inputSchema: z.object({
      itemIds: z.array(z.string().trim().min(1)).nonempty('Provide at least one item ID'),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async ({ itemIds, reason }: SelectTimelineItemsInput, { toolCallId }: { toolCallId?: string }) => {
      const normalizedIds = Array.from(new Set(itemIds.map((id) => id.trim()).filter((id) => id.length > 0)));
      if (normalizedIds.length === 0) {
        return { status: 'skipped', requestedItemIds: [], note: 'No valid item IDs provided.' };
      }

      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: { tool_name: editorToolNames.selectTimelineItems, params: { itemIds: normalizedIds }, toolCallId, requestedAt: new Date().toISOString() } satisfies EditorRealtimePayload,
        timestamp: new Date().toISOString(),
      });

      return { status: 'dispatched', requestedItemIds: normalizedIds, note: reason ?? 'Sent selection request to editor.' };
    },
  } as unknown as Tool<SelectTimelineItemsInput, SelectTimelineItemsResult>;
}

export function createPlaceLibraryAssetsOnTimelineTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<PlaceLibraryAssetsOnTimelineInput, PlaceLibraryAssetsOnTimelineResult> {
  const description = [
    'Place one or more library assets onto the timeline as new timeline items.',
    'Provide libraryAssetIds (asset IDs from assetsStatusInfo / libraryAssets).',
    'Provide an existing target trackId when clear; omit trackId if unknown.',
    'Choose ONE anchor: startFrame, startTimeInSeconds, or afterItemId.',
    'For the beginning of an empty timeline, use startFrame: 0 only.',
    'When placing multiple assets, they are glued together with no gaps.',
  ].join(' ');

  const inputSchema = z.object({
    libraryAssetIds: z
      .array(z.string().trim().min(1))
      .nonempty('Provide at least one library asset ID')
      .describe('Library asset IDs from project state or get_library_assets_data, in the desired timeline order.'),
    trackId: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe('Existing track ID from project state. Omit if there are no tracks or the target track is unknown.'),
    ...timelineAnchorSchemaFields,
    reason: z.string().trim().max(200).optional(),
  });

  return {
    description,
    inputSchema,
    execute: async ({ libraryAssetIds, trackId, startFrame, startTimeInSeconds, afterItemId, reason }: PlaceLibraryAssetsOnTimelineInput, { toolCallId }: { toolCallId?: string }) => {
      const normalizedIds = libraryAssetIds.map((id) => id.trim()).filter((id) => id.length > 0);
      if (normalizedIds.length === 0) {
        return { status: 'skipped', requestedLibraryAssetIds: [], note: 'No valid library asset IDs provided.' };
      }

      const resolvedToolCallId = toolCallId ?? `place-library-assets-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(resolvedToolCallId);
      const anchor = normalizeTimelineAnchor({ startFrame, startTimeInSeconds, afterItemId }, context);
      const params: EditorPlaceLibraryAssetsOnTimelinePayload['params'] = {
        libraryAssetIds: normalizedIds,
        trackId: trackId?.trim() || undefined,
        ...anchor,
      };

      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: { tool_name: editorToolNames.placeLibraryAssetsOnTimeline, params, toolCallId: resolvedToolCallId, messageId: context?.messageId, requestedAt: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      });

      const result = await waitForResult;
      if ('status' in result && result.status === 'timeout') {
        return { status: 'timeout', requestedLibraryAssetIds: normalizedIds, note: 'No response received from editor.' };
      }

      const mappedStatus = mapToolResultStatus(result.status, { success: 'completed' as const, skipped: 'skipped' as const, error: 'error' as const });
      const errorDetail = extractErrorDetail(result);
      const rawProjectState = result.output?.projectState as Record<string, unknown> | undefined;

      return {
        status: mappedStatus,
        requestedLibraryAssetIds: normalizedIds,
        placed: result.output?.placed as PlaceLibraryAssetsOnTimelineResult['placed'],
        skippedAssetIds: result.output?.skippedAssetIds as string[] | undefined,
        note: reason ?? (mappedStatus === 'completed' ? 'Assets placed on timeline.' : undefined),
        error: mappedStatus === 'error' ? errorDetail : undefined,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<PlaceLibraryAssetsOnTimelineInput, PlaceLibraryAssetsOnTimelineResult>;
}

export function createPlaceTimelineItemsTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<PlaceTimelineItemsInput, PlaceTimelineItemsResult> {
  const description = [
    'Move one or more existing timeline items onto a specific track and time.',
    'Provide itemIds from tracksInfo.tracks[].itemsTracksIds.',
    'Provide an existing target trackId when clear; omit trackId if unknown.',
    'Choose ONE anchor: startFrame, startTimeInSeconds, or afterItemId.',
    'For the beginning of an empty timeline, use startFrame: 0 only.',
    'When placing multiple items, they are glued together with no gaps.',
  ].join(' ');

  const inputSchema = z.object({
    itemIds: z
      .array(z.string().trim().min(1))
      .nonempty('Provide at least one item ID')
      .describe('Existing timeline item IDs from tracksInfo.tracks[].itemsTracksIds.'),
    trackId: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe('Existing track ID from project state. Omit if the target track is unknown.'),
    ...timelineAnchorSchemaFields,
    reason: z.string().trim().max(200).optional(),
  });

  return {
    description,
    inputSchema,
    execute: async ({ itemIds, trackId, startFrame, startTimeInSeconds, afterItemId, reason }: PlaceTimelineItemsInput, { toolCallId }: { toolCallId?: string }) => {
      const normalizedIds = itemIds.map((id) => id.trim()).filter((id) => id.length > 0);
      if (normalizedIds.length === 0) {
        return { status: 'skipped', requestedItemIds: [], note: 'No valid item IDs provided.' };
      }

      const resolvedToolCallId = toolCallId ?? `place-timeline-items-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(resolvedToolCallId);
      const anchor = normalizeTimelineAnchor({ startFrame, startTimeInSeconds, afterItemId }, context);
      const params: EditorPlaceTimelineItemsPayload['params'] = {
        itemIds: normalizedIds,
        trackId: trackId?.trim() || undefined,
        ...anchor,
      };

      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: { tool_name: editorToolNames.placeTimelineItems, params, toolCallId: resolvedToolCallId, messageId: context?.messageId, requestedAt: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      });

      const result = await waitForResult;
      if ('status' in result && result.status === 'timeout') {
        return { status: 'timeout', requestedItemIds: normalizedIds, note: 'No response received from editor.' };
      }

      const mappedStatus = mapToolResultStatus(result.status, { success: 'completed' as const, skipped: 'skipped' as const, error: 'error' as const });
      const errorDetail = extractErrorDetail(result);
      const rawProjectState = result.output?.projectState as Record<string, unknown> | undefined;

      return {
        status: mappedStatus,
        requestedItemIds: normalizedIds,
        placed: result.output?.placed as PlaceTimelineItemsResult['placed'],
        skippedItemIds: result.output?.skippedItemIds as string[] | undefined,
        note: reason ?? (mappedStatus === 'completed' ? 'Timeline items placed.' : undefined),
        error: mappedStatus === 'error' ? errorDetail : undefined,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<PlaceTimelineItemsInput, PlaceTimelineItemsResult>;
}

export function createDeleteItemsTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<DeleteItemsInput, DeleteItemsResult> {
  const description = 'Delete one or more timeline items from the editor by their IDs. Cannot be undone via this tool, but the editor maintains undo history.';

  return {
    description,
    inputSchema: z.object({
      itemIds: z.array(z.string().trim().min(1)).nonempty('Provide at least one item ID'),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async ({ itemIds, reason }: DeleteItemsInput, { toolCallId }: { toolCallId?: string }) => {
      const normalizedIds = Array.from(new Set(itemIds.map((id) => id.trim()).filter((id) => id.length > 0)));
      if (normalizedIds.length === 0) {
        return { status: 'skipped', requestedItemIds: [], note: 'No valid item IDs provided.' };
      }

      const resolvedToolCallId = toolCallId ?? `delete-items-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(resolvedToolCallId);
      const params: EditorDeleteItemsPayload['params'] = { itemIds: normalizedIds };

      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: { tool_name: editorToolNames.deleteItems, params, toolCallId: resolvedToolCallId, messageId: context?.messageId, requestedAt: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      });

      const result = await waitForResult;
      if ('status' in result && result.status === 'timeout') {
        return { status: 'timeout', requestedItemIds: normalizedIds, note: 'No response received from editor.' };
      }

      const mappedStatus = mapToolResultStatus(result.status, { success: 'completed' as const, skipped: 'skipped' as const, error: 'error' as const });
      const errorDetail = extractErrorDetail(result);

      if (mappedStatus === 'error') {
        return { status: 'error', requestedItemIds: normalizedIds, note: errorDetail ?? 'Failed to delete items.', error: errorDetail };
      }

      const outputWithState = { ...(result.output ?? {}) };
      const rawProjectState = outputWithState.projectState as Record<string, unknown> | undefined;
      delete outputWithState.projectState;

      return {
        status: mappedStatus,
        requestedItemIds: normalizedIds,
        deletedItemIds: (outputWithState.deletedItemIds as string[]) ?? normalizedIds,
        note: reason ?? `Deleted ${normalizedIds.length} item(s) from the timeline.`,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<DeleteItemsInput, DeleteItemsResult>;
}
