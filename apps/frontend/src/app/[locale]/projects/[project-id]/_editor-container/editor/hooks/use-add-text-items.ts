import type { RefObject } from 'react';
import { useCallback } from 'react';
import type { PlayerRef } from '@remotion/player';
import api from '@/utils/services/api-frontend';
import { editorToolNames, type TextItemInput } from 'api-types';
import { createTextItem } from '../items/text/create-text-item';
import { EditorStarterItem } from '../items/item-type';
import { addItem } from '../state/actions/add-item';
import { revealTimelinePosition } from '../utils/reveal-timeline-position';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import { useGetProjectState } from './use-get-project-state';

export type AddTextItemsOptions = {
  items: TextItemInput[];
  toolCallId?: string;
};

const resolveFrame = ({
  frame,
  seconds,
  fps,
  fallback,
  min,
}: {
  frame?: number;
  seconds?: number;
  fps: number;
  fallback: number;
  min?: number;
}): number => {
  const minimum = min ?? 0;
  if (frame !== undefined) return Math.max(minimum, Math.round(frame));
  if (seconds !== undefined) return Math.max(minimum, Math.round(seconds * fps));
  return fallback;
};

const hasConflictingTiming = ({
  frame,
  seconds,
  fps,
}: {
  frame?: number;
  seconds?: number;
  fps: number;
}): boolean => {
  if (frame === undefined || seconds === undefined) return false;
  return Math.abs(Math.round(seconds * fps) - frame) > 1;
};

const clampOpacity = (opacity: number | undefined) => {
  if (opacity === undefined) return undefined;
  return Math.min(1, Math.max(0, opacity));
};

const getSelectedRange = ({
  items,
  selectedItemIds,
}: {
  items: Record<string, EditorStarterItem>;
  selectedItemIds: string[];
}) => {
  const selectedItems = selectedItemIds.map((id) => items[id]).filter(Boolean);
  if (selectedItems.length === 0) return null;

  const startFrame = Math.min(...selectedItems.map((item) => item.from));
  const endFrame = Math.max(...selectedItems.map((item) => item.from + item.durationInFrames));

  return endFrame > startFrame ? { startFrame, durationInFrames: endFrame - startFrame } : null;
};

export const useAddTextItems = (playerRef?: RefObject<PlayerRef | null>) => {
  const { setState } = useWriteContext();
  const stateAsRef = useCurrentStateAsRef();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState(playerRef);

  const addTextItems = useCallback(
    async (options: AddTextItemsOptions) => {
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
              toolName: editorToolNames.addTextItems,
              status,
              output: payload,
              error,
            },
          });
        } catch {
          console.error('Failed to report tool result', { toolCallId, status });
        }
      };

      const requestedItems = options.items.filter((item) => item.text.trim().length > 0);
      if (requestedItems.length === 0) {
        await reportResult('error', { error: 'No text items provided' }, 'No text items provided');
        return;
      }

      try {
        const currentState = stateAsRef.current;
        const { fps, compositionWidth, compositionHeight } = currentState.undoableState;
        const timingConflict = requestedItems.some((item) => {
          return (
            hasConflictingTiming({ frame: item.startFrame, seconds: item.startTimeInSeconds, fps }) ||
            hasConflictingTiming({ frame: item.durationInFrames, seconds: item.durationInSeconds, fps })
          );
        });

        if (timingConflict) {
          await reportResult(
            'error',
            { error: 'Conflicting frame and seconds timing values were provided' },
            'Conflicting frame and seconds timing values were provided',
          );
          return;
        }

        const selectedRange = getSelectedRange({
          items: currentState.undoableState.items,
          selectedItemIds: currentState.selectedItems,
        });
        let nextState = currentState;
        const createdItems: {
          itemId: string;
          text: string;
          trackId: string;
          startFrame: number;
          endFrame: number;
          startTimeInSeconds: number;
          endTimeInSeconds: number;
        }[] = [];

        for (const requestedItem of requestedItems) {
          const from = resolveFrame({
            frame: requestedItem.startFrame,
            seconds: requestedItem.startTimeInSeconds,
            fps,
            fallback: selectedRange?.startFrame ?? 0,
          });
          const durationInFrames = resolveFrame({
            frame: requestedItem.durationInFrames,
            seconds: requestedItem.durationInSeconds,
            fps,
            fallback: selectedRange?.durationInFrames ?? 100,
            min: 1,
          });
          const style = {
            ...requestedItem.style,
            opacity: clampOpacity(requestedItem.style?.opacity),
          };
          const item = await createTextItem({
            xOnCanvas: requestedItem.xOnCanvas ?? compositionWidth / 2,
            yOnCanvas: requestedItem.yOnCanvas ?? compositionHeight * 0.86,
            from,
            durationInFrames,
            text: requestedItem.text,
            align: style.align ?? 'center',
            style,
          });

          nextState = addItem({
            state: nextState,
            item,
            select: false,
            position: { type: 'front' },
          });

          const trackId = nextState.undoableState.tracks.find((track) => track.items.includes(item.id))?.id ?? '';

          createdItems.push({
            itemId: item.id,
            text: item.text,
            trackId,
            startFrame: item.from,
            endFrame: item.from + item.durationInFrames,
            startTimeInSeconds: Number((item.from / fps).toFixed(3)),
            endTimeInSeconds: Number(((item.from + item.durationInFrames) / fps).toFixed(3)),
          });
        }

        nextState = {
          ...nextState,
          selectedItems: createdItems.map((item) => item.itemId),
        };

        setState({
          update: nextState,
          commitToUndoStack: true,
        });

        if (createdItems[0]) {
          revealTimelinePosition({
            state: nextState,
            frame: createdItems[0].startFrame,
            trackId: createdItems[0].trackId,
          });
        }

        await reportResult('success', {
          createdItems,
          projectState: buildProjectState(nextState),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add text items';
        await reportResult('error', { error: message }, message);
      }
    },
    [buildProjectState, reportToolResult, setState, stateAsRef],
  );

  return { addTextItems };
};
