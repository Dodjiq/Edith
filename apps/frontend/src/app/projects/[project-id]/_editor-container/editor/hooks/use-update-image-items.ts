import type { RefObject } from 'react';
import { useCallback } from 'react';
import type { PlayerRef } from '@remotion/player';
import api from '@/utils/services/api-frontend';
import { editorToolNames, type ImageItemPatchInput } from 'api-types';
import type { ImageItem } from '../items/image/image-item-type';
import { changeItem } from '../state/actions/change-item';
import { revealTimelinePosition } from '../utils/reveal-timeline-position';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import { applyImageStyle, isImageItem, isReadyImageAsset, resolveFramePair } from './image-tool-utils';
import { useGetProjectState } from './use-get-project-state';

export type UpdateImageItemsOptions = {
  itemIds: string[];
  patch: ImageItemPatchInput;
  selectionBehavior?: 'select_updated' | 'keep_current' | 'none';
  toolCallId?: string;
};

const hasPatchValue = (patch: ImageItemPatchInput): boolean => {
  return Object.values(patch).some((value) => value !== undefined);
};

const summarizeImageItem = (item: ImageItem, fps: number) => ({
  itemId: item.id,
  assetId: item.assetId,
  startFrame: item.from,
  endFrame: item.from + item.durationInFrames,
  startTimeInSeconds: Number((item.from / fps).toFixed(3)),
  endTimeInSeconds: Number(((item.from + item.durationInFrames) / fps).toFixed(3)),
  left: item.left,
  top: item.top,
  width: item.width,
  height: item.height,
  opacity: item.opacity,
  rotation: item.rotation,
  borderRadius: item.borderRadius,
  keepAspectRatio: item.keepAspectRatio,
  fadeInDurationInSeconds: item.fadeInDurationInSeconds,
  fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
  objectFit: item.objectFit ?? 'fill',
});

export const useUpdateImageItems = (playerRef?: RefObject<PlayerRef | null>) => {
  const { setState } = useWriteContext();
  const stateAsRef = useCurrentStateAsRef();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState(playerRef);

  const updateImageItems = useCallback(
    async (options: UpdateImageItemsOptions) => {
      const toolCallId = options.toolCallId;
      const reportResult = async (
        status: 'success' | 'skipped' | 'error',
        output?: Record<string, unknown>,
        error?: string,
      ) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: { toolCallId, toolName: editorToolNames.updateImageItems, status, output, error },
          });
        } catch {
          console.error('Failed to report update image tool result', { toolCallId, status });
        }
      };

      const normalizedIds = [...new Set(options.itemIds.map((id) => id.trim()).filter(Boolean))];
      if (normalizedIds.length === 0 || !hasPatchValue(options.patch)) {
        await reportResult('error', { error: 'No image item IDs or patch values provided' });
        return;
      }

      try {
        const currentState = stateAsRef.current;
        const { fps } = currentState.undoableState;
        const itemErrors: { itemId: string; error: string }[] = [];
        const updateableIds: string[] = [];

        for (const itemId of normalizedIds) {
          const item = currentState.undoableState.items[itemId];
          if (!item) {
            itemErrors.push({ itemId, error: 'Item not found' });
            continue;
          }
          if (!isImageItem(item)) {
            itemErrors.push({ itemId, error: 'Item is not an image' });
            continue;
          }
          updateableIds.push(itemId);
        }

        const replacementAsset = options.patch.assetId
          ? currentState.undoableState.libraryAssets[options.patch.assetId]
          : undefined;
        const replacementStatus = options.patch.assetId ? currentState.assetStatus[options.patch.assetId] : undefined;

        if (options.patch.assetId && !isReadyImageAsset(replacementAsset, replacementStatus?.type)) {
          await reportResult('error', { itemErrors, error: 'Replacement asset is not a ready image asset' });
          return;
        }

        if (updateableIds.length === 0) {
          await reportResult('error', { itemErrors, error: 'No image items could be updated' });
          return;
        }

        const patch = options.patch;
        let nextState = replacementAsset
          ? {
              ...currentState,
              undoableState: {
                ...currentState.undoableState,
                assets: {
                  ...currentState.undoableState.assets,
                  [replacementAsset.id]: replacementAsset,
                },
              },
            }
          : currentState;

        for (const itemId of updateableIds) {
          nextState = changeItem(nextState, itemId, (item) => {
            if (!isImageItem(item)) return item;
            const from = resolveFramePair({
              frame: patch.from,
              seconds: patch.startTimeInSeconds,
              fps,
              fallback: item.from,
              label: 'Start',
            });
            const durationInFrames = resolveFramePair({
              frame: patch.durationInFrames,
              seconds: patch.durationInSeconds,
              fps,
              fallback: item.durationInFrames,
              label: 'Duration',
            });

            return applyImageStyle({
              item: {
                ...item,
                assetId: patch.assetId ?? item.assetId,
                from,
                durationInFrames,
              },
              input: { style: patch, xOnCanvas: patch.xOnCanvas, yOnCanvas: patch.yOnCanvas },
            });
          });
        }

        const selectionBehavior = options.selectionBehavior ?? 'select_updated';
        nextState = {
          ...nextState,
          selectedItems:
            selectionBehavior === 'select_updated'
              ? updateableIds
              : selectionBehavior === 'none'
                ? []
                : currentState.selectedItems,
        };
        setState({ update: nextState, commitToUndoStack: true });

        const firstUpdated = nextState.undoableState.items[updateableIds[0]];
        const trackId = nextState.undoableState.tracks.find((track) => track.items.includes(updateableIds[0]))?.id;
        if (firstUpdated && trackId) {
          revealTimelinePosition({ state: nextState, frame: firstUpdated.from, trackId });
        }

        const updatedItems = updateableIds
          .map((itemId) => nextState.undoableState.items[itemId])
          .filter(isImageItem)
          .map((item) => summarizeImageItem(item, fps));

        await reportResult('success', {
          updatedItemIds: updateableIds,
          selectedItemIds: nextState.selectedItems,
          usedAssetIds: patch.assetId ? [patch.assetId] : undefined,
          updatedItems,
          itemErrors: itemErrors.length > 0 ? itemErrors : undefined,
          projectState: buildProjectState(nextState),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update image items';
        await reportResult('error', { error: message }, message);
      }
    },
    [buildProjectState, reportToolResult, setState, stateAsRef],
  );

  return { updateImageItems };
};
