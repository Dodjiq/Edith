import type { RefObject } from 'react';
import { useCallback } from 'react';
import type { PlayerRef } from '@remotion/player';
import api from '@/utils/services/api-frontend';
import { editorToolNames, type ImageItemInput } from 'api-types';
import { makeItemFromAsset } from '../library/make-item-from-asset';
import { addItem } from '../state/actions/add-item';
import { revealTimelinePosition } from '../utils/reveal-timeline-position';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import { applyImageStyle, isReadyImageAsset, resolveFramePair } from './image-tool-utils';
import { useGetProjectState } from './use-get-project-state';

export type AddImageItemsOptions = {
  items: ImageItemInput[];
  toolCallId?: string;
};

export const useAddImageItems = (playerRef?: RefObject<PlayerRef | null>) => {
  const { setState } = useWriteContext();
  const stateAsRef = useCurrentStateAsRef();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState(playerRef);

  const addImageItems = useCallback(
    async (options: AddImageItemsOptions) => {
      const toolCallId = options.toolCallId;
      const reportResult = async (
        status: 'success' | 'skipped' | 'error',
        output?: Record<string, unknown>,
        error?: string,
      ) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: { toolCallId, toolName: editorToolNames.addImageItems, status, output, error },
          });
        } catch {
          console.error('Failed to report add image tool result', { toolCallId, status });
        }
      };

      if (options.items.length === 0) {
        await reportResult('error', { error: 'No image items provided' }, 'No image items provided');
        return;
      }

      try {
        const currentState = stateAsRef.current;
        const { fps, compositionWidth, compositionHeight } = currentState.undoableState;
        const selectedItem = currentState.selectedItems[0]
          ? currentState.undoableState.items[currentState.selectedItems[0]]
          : undefined;
        let nextState = currentState;
        const skippedAssetIds: string[] = [];
        const createdItems: {
          assetId: string;
          itemId: string;
          trackId: string;
          startFrame: number;
          endFrame: number;
          startTimeInSeconds: number;
          endTimeInSeconds: number;
        }[] = [];

        for (const requestedItem of options.items) {
          const asset = currentState.undoableState.libraryAssets[requestedItem.assetId];
          const status = currentState.assetStatus[requestedItem.assetId];

          if (!isReadyImageAsset(asset, status?.type)) {
            skippedAssetIds.push(requestedItem.assetId);
            continue;
          }

          const from = resolveFramePair({
            frame: requestedItem.startFrame,
            seconds: requestedItem.startTimeInSeconds,
            fps,
            fallback: selectedItem?.from ?? 0,
            label: 'Start',
          });
          const durationInFrames = resolveFramePair({
            frame: requestedItem.durationInFrames,
            seconds: requestedItem.durationInSeconds,
            fps,
            fallback: selectedItem?.durationInFrames ?? fps * 2,
            label: 'Duration',
          });
          const baseItem = makeItemFromAsset({ asset, fps, compositionWidth, compositionHeight, currentFrame: from });

          if (baseItem.type !== 'image') {
            skippedAssetIds.push(requestedItem.assetId);
            continue;
          }

          const item = applyImageStyle({
            item: { ...baseItem, durationInFrames },
            input: {
              ...requestedItem,
              xOnCanvas: requestedItem.xOnCanvas ?? compositionWidth / 2,
              yOnCanvas: requestedItem.yOnCanvas ?? compositionHeight / 2,
            },
          });

          nextState = {
            ...nextState,
            undoableState: {
              ...nextState.undoableState,
              assets: {
                ...nextState.undoableState.assets,
                [asset.id]: asset,
              },
            },
          };
          nextState = addItem({ state: nextState, item, select: false, position: { type: 'front' } });
          const trackId = nextState.undoableState.tracks.find((track) => track.items.includes(item.id))?.id ?? '';

          createdItems.push({
            assetId: asset.id,
            itemId: item.id,
            trackId,
            startFrame: item.from,
            endFrame: item.from + item.durationInFrames,
            startTimeInSeconds: Number((item.from / fps).toFixed(3)),
            endTimeInSeconds: Number(((item.from + item.durationInFrames) / fps).toFixed(3)),
          });
        }

        if (createdItems.length === 0) {
          await reportResult('skipped', { skippedAssetIds, reason: 'No ready image assets were placed' });
          return;
        }

        nextState = { ...nextState, selectedItems: createdItems.map((item) => item.itemId) };
        setState({ update: nextState, commitToUndoStack: true });
        revealTimelinePosition({ state: nextState, frame: createdItems[0].startFrame, trackId: createdItems[0].trackId });

        await reportResult('success', {
          createdItems,
          skippedAssetIds: skippedAssetIds.length > 0 ? skippedAssetIds : undefined,
          projectState: buildProjectState(nextState),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add image items';
        await reportResult('error', { error: message }, message);
      }
    },
    [buildProjectState, reportToolResult, setState, stateAsRef],
  );

  return { addImageItems };
};
