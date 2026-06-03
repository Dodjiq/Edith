import type { RefObject } from 'react';
import { useCallback } from 'react';
import type { PlayerRef } from '@remotion/player';
import api from '@/utils/services/api-frontend';
import { editorToolNames, type TextItemPatchInput, type TextSelectionBehavior } from 'api-types';
import { TextItem } from '../items/text/text-item-type';
import { changeItem } from '../state/actions/change-item';
import { editAndRelayoutText } from '../state/actions/edit-and-relayout-text';
import { revealTimelinePosition } from '../utils/reveal-timeline-position';
import { loadFontFromTextItem } from '../utils/text/load-font-from-text-item';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import { useGetProjectState } from './use-get-project-state';

export type UpdateTextItemsOptions = {
  itemIds: string[];
  patch: TextItemPatchInput;
  selectionBehavior?: TextSelectionBehavior;
  toolCallId?: string;
};

const isTextItem = (item: unknown): item is TextItem => {
  return Boolean(item && typeof item === 'object' && (item as { type?: string }).type === 'text');
};

const hasConflictingTiming = ({ frame, seconds, fps }: {
  frame?: number;
  seconds?: number;
  fps: number;
}): boolean => {
  if (frame === undefined || seconds === undefined) return false;
  return Math.abs(Math.round(seconds * fps) - frame) > 1;
};

const resolveFrame = ({ frame, seconds, fps, min }: {
  frame?: number;
  seconds?: number;
  fps: number;
  min?: number;
}) => {
  const minimum = min ?? 0;
  if (frame !== undefined) return Math.max(minimum, Math.round(frame));
  if (seconds !== undefined) return Math.max(minimum, Math.round(seconds * fps));
  return undefined;
};

const clampOpacity = (opacity: number | undefined) => {
  if (opacity === undefined) return undefined;
  return Math.min(1, Math.max(0, opacity));
};

const hasRelayoutPatch = (patch: TextItemPatchInput) => {
  return (
    patch.text !== undefined ||
    patch.fontFamily !== undefined ||
    patch.fontStyle !== undefined ||
    patch.fontSize !== undefined ||
    patch.lineHeight !== undefined ||
    patch.letterSpacing !== undefined ||
    patch.align !== undefined
  );
};

const applyCanvasAnchor = (item: TextItem, patch: TextItemPatchInput): TextItem => {
  if (patch.xOnCanvas === undefined && patch.yOnCanvas === undefined) return item;

  const x = patch.xOnCanvas;
  const y = patch.yOnCanvas;
  const left =
    x === undefined
      ? item.left
      : item.align === 'center'
        ? Math.round(x - item.width / 2)
        : item.align === 'right'
          ? Math.round(x - item.width)
          : Math.round(x);
  const top = y === undefined ? item.top : Math.round(y - item.height / 2);

  return { ...item, left, top };
};

const applyTextPatch = async ({ previousItem, patch, fps }: {
  previousItem: TextItem;
  patch: TextItemPatchInput;
  fps: number;
}): Promise<TextItem> => {
  const nextFontStyle = {
    variant: patch.fontStyle?.variant ?? previousItem.fontStyle.variant,
    weight: patch.fontStyle?.weight ?? previousItem.fontStyle.weight,
  };
  const nextFontFamily = patch.fontFamily ?? previousItem.fontFamily;

  if (patch.fontFamily !== undefined || patch.fontStyle !== undefined) {
    await loadFontFromTextItem({
      fontFamily: nextFontFamily,
      fontVariant: nextFontStyle.variant,
      fontWeight: nextFontStyle.weight,
      fontInfosDuringRendering: null,
    });
  }

  const from = resolveFrame({ frame: patch.from, seconds: patch.startTimeInSeconds, fps });
  const durationInFrames = resolveFrame({
    frame: patch.durationInFrames,
    seconds: patch.durationInSeconds,
    fps,
    min: 1,
  });

  const text = patch.text === undefined ? previousItem.text : patch.text.trim();
  const relayoutBase: TextItem = {
    ...previousItem,
    text,
    from: from ?? previousItem.from,
    durationInFrames: durationInFrames ?? previousItem.durationInFrames,
    opacity: clampOpacity(patch.opacity) ?? previousItem.opacity,
    rotation: patch.rotation ?? previousItem.rotation,
    fontFamily: nextFontFamily,
    fontStyle: nextFontStyle,
    lineHeight: patch.lineHeight ?? previousItem.lineHeight,
    letterSpacing: patch.letterSpacing ?? previousItem.letterSpacing,
    fontSize: patch.fontSize ?? previousItem.fontSize,
    align: patch.align ?? previousItem.align,
    color: patch.color ?? previousItem.color,
    direction: patch.direction ?? previousItem.direction,
    strokeWidth: patch.strokeWidth ?? previousItem.strokeWidth,
    strokeColor: patch.strokeColor ?? previousItem.strokeColor,
    fadeInDurationInSeconds: patch.fadeInDurationInSeconds ?? previousItem.fadeInDurationInSeconds,
    fadeOutDurationInSeconds: patch.fadeOutDurationInSeconds ?? previousItem.fadeOutDurationInSeconds,
  };

  const relayouted = hasRelayoutPatch(patch)
    ? editAndRelayoutText(previousItem, () => relayoutBase)
    : relayoutBase;

  const withExplicitGeometry: TextItem = {
    ...relayouted,
    left: patch.left ?? relayouted.left,
    top: patch.top ?? relayouted.top,
    width: patch.width ?? relayouted.width,
    height: patch.height ?? relayouted.height,
  };

  return applyCanvasAnchor(withExplicitGeometry, patch);
};

export const useUpdateTextItems = (playerRef?: RefObject<PlayerRef | null>) => {
  const { setState } = useWriteContext();
  const stateAsRef = useCurrentStateAsRef();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState(playerRef);

  const updateTextItems = useCallback(
    async (options: UpdateTextItemsOptions) => {
      const toolCallId = options.toolCallId;
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
              toolName: editorToolNames.updateTextItems,
              status,
              output: payload,
              error,
            },
          });
        } catch {
          console.error('Failed to report tool result', { toolCallId, status });
        }
      };

      const itemIds = Array.from(new Set(options.itemIds.map((id) => id.trim()).filter(Boolean)));
      if (itemIds.length === 0) {
        await reportResult('error', { error: 'No text item IDs provided' }, 'No text item IDs provided');
        return;
      }

      const currentState = stateAsRef.current;
      const fps = currentState.undoableState.fps;
      if (
        hasConflictingTiming({ frame: options.patch.from, seconds: options.patch.startTimeInSeconds, fps }) ||
        hasConflictingTiming({
          frame: options.patch.durationInFrames,
          seconds: options.patch.durationInSeconds,
          fps,
        })
      ) {
        await reportResult(
          'error',
          { error: 'Conflicting frame and seconds timing values were provided' },
          'Conflicting frame and seconds timing values were provided',
        );
        return;
      }

      if (options.patch.text !== undefined && options.patch.text.trim().length === 0) {
        await reportResult('error', { error: 'Text cannot be empty' }, 'Text cannot be empty');
        return;
      }

      try {
        let nextState = currentState;
        const updatedItems: NonNullable<UpdateTextItemsOptions['itemIds']> = [];
        const updatedItemDetails: {
          itemId: string;
          text: string;
          startFrame: number;
          endFrame: number;
          startTimeInSeconds: number;
          endTimeInSeconds: number;
        }[] = [];
        const failedItems: { itemId: string; error: string }[] = [];

        for (const itemId of itemIds) {
          const existingItem = nextState.undoableState.items[itemId];
          if (!existingItem) {
            failedItems.push({ itemId, error: 'Item does not exist' });
            continue;
          }
          if (!isTextItem(existingItem)) {
            failedItems.push({ itemId, error: 'Item is not a text overlay' });
            continue;
          }

          const updatedItem = await applyTextPatch({
            previousItem: existingItem,
            patch: options.patch,
            fps,
          });

          nextState = changeItem(nextState, itemId, () => updatedItem);
          updatedItems.push(itemId);
          updatedItemDetails.push({
            itemId,
            text: updatedItem.text,
            startFrame: updatedItem.from,
            endFrame: updatedItem.from + updatedItem.durationInFrames,
            startTimeInSeconds: Number((updatedItem.from / fps).toFixed(3)),
            endTimeInSeconds: Number(((updatedItem.from + updatedItem.durationInFrames) / fps).toFixed(3)),
          });
        }

        if (updatedItems.length === 0) {
          const message = failedItems[0]?.error ?? 'No text items were updated';
          await reportResult('error', { failedItems }, message);
          return;
        }

        const selectionBehavior = options.selectionBehavior ?? 'select_updated';
        const selectedItemIds =
          selectionBehavior === 'select_updated'
            ? updatedItems
            : selectionBehavior === 'none'
              ? []
              : nextState.selectedItems;

        nextState = {
          ...nextState,
          selectedItems: selectedItemIds,
        };

        setState({ update: nextState, commitToUndoStack: true });

        const firstUpdated = updatedItemDetails[0];
        if (firstUpdated) {
          const trackId =
            nextState.undoableState.tracks.find((track) => track.items.includes(firstUpdated.itemId))?.id ?? '';
          revealTimelinePosition({
            state: nextState,
            frame: firstUpdated.startFrame,
            trackId,
          });
        }

        await reportResult('success', {
          updatedItems: updatedItemDetails,
          updatedItemIds: updatedItems,
          selectedItemIds,
          failedItems,
          projectState: buildProjectState(nextState),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update text items';
        await reportResult('error', { error: message }, message);
      }
    },
    [buildProjectState, reportToolResult, setState, stateAsRef],
  );

  return { updateTextItems };
};
