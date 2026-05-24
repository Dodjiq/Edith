import type { RefObject } from 'react';
import { useCallback } from 'react';
import type { PlayerRef } from '@remotion/player';
import api from '@/utils/services/api-frontend';
import { editorToolNames } from 'api-types';
import type { ShapeItemPatchInput, ShapeKind, ShapeSelectionBehavior } from 'api-types';
import type { EditorStarterItem } from '../items/item-type';
import type { SolidItem } from '../items/solid/solid-item-type';
import { changeItem } from '../state/actions/change-item';
import type { EditorState } from '../state/types';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import { useGetProjectState } from './use-get-project-state';

export type UpdateShapeItemsOptions = {
  itemIds: string[];
  patch: ShapeItemPatchInput;
  selectionBehavior?: ShapeSelectionBehavior;
  toolCallId?: string;
};

const clampOpacity = (value: number) => Math.min(1, Math.max(0, value));

const resolveFrame = ({ frame, seconds, fps }: { frame?: number; seconds?: number; fps: number }) => {
  if (frame !== undefined && seconds !== undefined && frame !== Math.round(seconds * fps)) {
    throw new Error('Conflicting frame and seconds timing fields');
  }
  if (frame !== undefined) return Math.max(0, Math.round(frame));
  if (seconds !== undefined) return Math.max(0, Math.round(seconds * fps));
  return undefined;
};

const getShapeKindPatch = ({
  shapeKind,
  width,
  height,
  borderRadius,
}: {
  shapeKind: ShapeKind | undefined;
  width: number;
  height: number;
  borderRadius: number;
}): Partial<SolidItem> => {
  if (!shapeKind) return {};

  if (shapeKind === 'square' || shapeKind === 'circle') {
    const size = Math.max(width, height);
    return {
      width: size,
      height: size,
      borderRadius: shapeKind === 'circle' ? size : borderRadius,
    };
  }

  if (shapeKind === 'ellipse') {
    return { borderRadius: Math.max(width, height) };
  }

  if (shapeKind === 'rounded_rectangle') {
    return { borderRadius: borderRadius || 24 };
  }

  return {};
};

const applyShapePatch = (item: SolidItem, patch: ShapeItemPatchInput, fps: number): SolidItem => {
  const from = resolveFrame({ frame: patch.from, seconds: patch.startTimeInSeconds, fps });
  const durationInFrames = resolveFrame({
    frame: patch.durationInFrames,
    seconds: patch.durationInSeconds,
    fps,
  });
  const baseWidth = patch.width ?? item.width;
  const baseHeight = patch.height ?? item.height;
  const shapeKindPatch = getShapeKindPatch({
    shapeKind: patch.shapeKind,
    width: baseWidth,
    height: baseHeight,
    borderRadius: item.borderRadius,
  });
  const width = shapeKindPatch.width ?? baseWidth;
  const height = shapeKindPatch.height ?? baseHeight;
  const borderRadius = shapeKindPatch.borderRadius ?? patch.borderRadius ?? item.borderRadius;
  const left = patch.xOnCanvas === undefined ? patch.left : Math.round(patch.xOnCanvas - width / 2);
  const top = patch.yOnCanvas === undefined ? patch.top : Math.round(patch.yOnCanvas - height / 2);

  return {
    ...item,
    ...shapeKindPatch,
    ...(from !== undefined ? { from } : {}),
    ...(durationInFrames !== undefined ? { durationInFrames } : {}),
    ...(left !== undefined ? { left } : {}),
    ...(top !== undefined ? { top } : {}),
    ...(patch.width !== undefined || shapeKindPatch.width !== undefined ? { width } : {}),
    ...(patch.height !== undefined || shapeKindPatch.height !== undefined ? { height } : {}),
    ...(patch.opacity !== undefined ? { opacity: clampOpacity(patch.opacity) } : {}),
    ...(patch.rotation !== undefined ? { rotation: patch.rotation } : {}),
    ...(patch.fillColor !== undefined ? { color: patch.fillColor } : {}),
    ...(patch.borderRadius !== undefined || shapeKindPatch.borderRadius !== undefined ? { borderRadius } : {}),
    ...(patch.keepAspectRatio !== undefined ? { keepAspectRatio: patch.keepAspectRatio } : {}),
    ...(patch.fadeInDurationInSeconds !== undefined ? { fadeInDurationInSeconds: patch.fadeInDurationInSeconds } : {}),
    ...(patch.fadeOutDurationInSeconds !== undefined
      ? { fadeOutDurationInSeconds: patch.fadeOutDurationInSeconds }
      : {}),
  };
};

const isSolidItem = (item: EditorStarterItem | undefined): item is SolidItem => item?.type === 'solid';

export const useUpdateShapeItems = (playerRef?: RefObject<PlayerRef | null>) => {
  const { setState } = useWriteContext();
  const stateAsRef = useCurrentStateAsRef();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState(playerRef);

  const updateShapeItems = useCallback(
    async (options: UpdateShapeItemsOptions) => {
      const { itemIds, patch, selectionBehavior = 'select_updated', toolCallId } = options;

      const reportResult = async (
        status: 'success' | 'skipped' | 'error',
        payload?: Record<string, unknown>,
        error?: string,
      ) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: {
              toolCallId,
              toolName: editorToolNames.updateShapeItems,
              status,
              output: payload,
              error,
            },
          });
        } catch {
          console.error('Failed to report tool result', { toolCallId, status });
        }
      };

      if (itemIds.length === 0) {
        await reportResult('error', { error: 'No shape item IDs provided' }, 'No shape item IDs provided');
        return;
      }

      try {
        const currentState = stateAsRef.current;
        const fps = currentState.undoableState.fps;
        const uniqueItemIds = Array.from(new Set(itemIds.map((id) => id.trim()).filter(Boolean)));
        const failedItems: { itemId: string; error: string }[] = [];
        const updatedItems: {
          itemId: string;
          shapeKind?: string;
          startFrame: number;
          endFrame: number;
          startTimeInSeconds: number;
          endTimeInSeconds: number;
        }[] = [];

        let nextState: EditorState = currentState;

        for (const itemId of uniqueItemIds) {
          const existingItem = nextState.undoableState.items[itemId];

          if (!existingItem) {
            failedItems.push({ itemId, error: 'Item not found' });
            continue;
          }

          if (!isSolidItem(existingItem)) {
            failedItems.push({ itemId, error: `Item is ${existingItem.type}, not a shape-compatible solid item` });
            continue;
          }

          nextState = changeItem(nextState, itemId, (item) => applyShapePatch(item as SolidItem, patch, fps));
          const updatedItem = nextState.undoableState.items[itemId] as SolidItem;
          updatedItems.push({
            itemId,
            shapeKind: patch.shapeKind,
            startFrame: updatedItem.from,
            endFrame: updatedItem.from + updatedItem.durationInFrames,
            startTimeInSeconds: Number((updatedItem.from / fps).toFixed(3)),
            endTimeInSeconds: Number(((updatedItem.from + updatedItem.durationInFrames) / fps).toFixed(3)),
          });
        }

        if (updatedItems.length === 0) {
          await reportResult('error', { failedItems }, failedItems[0]?.error ?? 'No shape items were updated');
          return;
        }

        nextState = {
          ...nextState,
          selectedItems:
            selectionBehavior === 'select_updated'
              ? updatedItems.map((item) => item.itemId)
              : selectionBehavior === 'none'
                ? []
                : nextState.selectedItems,
        };

        setState({
          update: nextState,
          commitToUndoStack: true,
        });

        await reportResult('success', {
          requestedItemIds: uniqueItemIds,
          updatedItems,
          updatedItemIds: updatedItems.map((item) => item.itemId),
          selectedItemIds: nextState.selectedItems,
          failedItems: failedItems.length > 0 ? failedItems : undefined,
          projectState: buildProjectState(nextState),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update shape items';
        await reportResult('error', { error: message }, message);
      }
    },
    [buildProjectState, reportToolResult, setState, stateAsRef],
  );

  return { updateShapeItems };
};
