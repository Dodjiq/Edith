import { useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/utils/services/api-frontend';
import { editorToolNames, type TimelineTrimMode } from 'api-types';
import type { EditorStarterItem } from '../items/item-type';
import { cutFrameRange } from '../state/actions/cut-frame-range';
import type { EditorState } from '../state/types';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import { useGetProjectState } from './use-get-project-state';

type TrimTimelineItemsOptions = {
  itemIds: string[];
  mode?: TimelineTrimMode;
  durationInFrames?: number;
  durationInSeconds?: number;
  toolCallId?: string;
};

type TrimRequest = {
  sourceItemId: string;
  trackId: string;
  startFrame: number;
  endFrame: number;
};

type TrimmedItemSummary = {
  sourceItemId: string;
  itemId: string;
  trackId: string;
  startFrame: number;
  endFrame: number;
  startTimeInSeconds: number;
  endTimeInSeconds: number;
  removedFrames: number;
};

const resolveDurationInFrames = ({
  durationInFrames,
  durationInSeconds,
  fps,
}: {
  durationInFrames?: number;
  durationInSeconds?: number;
  fps: number;
}) => {
  if (durationInFrames !== undefined && durationInSeconds !== undefined) {
    const durationFromSeconds = Math.round(durationInSeconds * fps);
    if (Math.abs(durationFromSeconds - durationInFrames) > 1) {
      throw new Error('Conflicting durationInFrames and durationInSeconds values');
    }
  }

  if (durationInFrames !== undefined) return Math.max(1, Math.round(durationInFrames));
  if (durationInSeconds !== undefined) return Math.max(1, Math.round(durationInSeconds * fps));
  return undefined;
};

const getItemTrackId = (state: EditorState, itemId: string) => {
  return state.undoableState.tracks.find((track) => track.items.includes(itemId))?.id;
};

const getKeepDuration = ({
  item,
  mode,
  targetDurationInFrames,
}: {
  item: EditorStarterItem;
  mode: TimelineTrimMode;
  targetDurationInFrames?: number;
}) => {
  if (mode === 'first_half') {
    return Math.max(1, Math.floor(item.durationInFrames / 2));
  }

  return targetDurationInFrames;
};

export const useTrimTimelineItems = () => {
  const { setState } = useWriteContext();
  const stateAsRef = useCurrentStateAsRef();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState();

  const trimTimelineItems = useCallback(
    async (options: TrimTimelineItemsOptions) => {
      const { itemIds, mode = 'first_half', durationInFrames, durationInSeconds, toolCallId } = options;

      const reportResult = async (
        status: 'success' | 'skipped' | 'error',
        output?: Record<string, unknown>,
        error?: string,
      ) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: {
              toolCallId,
              toolName: editorToolNames.trimTimelineItems,
              status,
              output,
              error,
            },
          });
        } catch {
          console.error('Failed to report trim timeline items result', { toolCallId, status });
        }
      };

      try {
        const currentState = stateAsRef.current;
        const fps = currentState.undoableState.fps;
        const targetDurationInFrames = resolveDurationInFrames({ durationInFrames, durationInSeconds, fps });

        if (mode === 'duration' && targetDurationInFrames === undefined) {
          await reportResult('error', { error: 'duration mode requires durationInFrames or durationInSeconds' });
          return;
        }

        const uniqueItemIds = Array.from(new Set(itemIds.map((id) => id.trim()).filter(Boolean)));
        const trimRequests: TrimRequest[] = [];
        const skippedItemIds: string[] = [];

        for (const itemId of uniqueItemIds) {
          const item = currentState.undoableState.items[itemId];
          const trackId = getItemTrackId(currentState, itemId);
          const keepDuration = item ? getKeepDuration({ item, mode, targetDurationInFrames }) : undefined;

          if (!item || !trackId || keepDuration === undefined || keepDuration >= item.durationInFrames) {
            skippedItemIds.push(itemId);
            continue;
          }

          trimRequests.push({
            sourceItemId: itemId,
            trackId,
            startFrame: item.from + keepDuration,
            endFrame: item.from + item.durationInFrames,
          });
        }

        if (trimRequests.length === 0) {
          await reportResult('skipped', {
            requestedItemIds: uniqueItemIds,
            skippedItemIds,
            message: 'No timeline items needed trimming',
          });
          return;
        }

        const trimmedItems: TrimmedItemSummary[] = [];
        let updatedState: EditorState | null = null;

        setState({
          update: (state) => {
            let nextState = state;
            const sortedRequests = [...trimRequests].sort((a, b) => b.startFrame - a.startFrame);

            for (const request of sortedRequests) {
              const cutResult = cutFrameRange({
                state: nextState,
                trackId: request.trackId,
                startFrame: request.startFrame,
                endFrame: request.endFrame,
              });

              for (const spliceResult of cutResult.spliceResults) {
                for (const createdItem of spliceResult.createdItems) {
                  trimmedItems.push({
                    sourceItemId: spliceResult.sourceItem.id,
                    itemId: createdItem.id,
                    trackId: request.trackId,
                    startFrame: createdItem.from,
                    endFrame: createdItem.from + createdItem.durationInFrames,
                    startTimeInSeconds: Number((createdItem.from / fps).toFixed(3)),
                    endTimeInSeconds: Number(((createdItem.from + createdItem.durationInFrames) / fps).toFixed(3)),
                    removedFrames: spliceResult.totalRemovedFrames,
                  });
                }
              }

              nextState = cutResult.state;
            }

            updatedState = nextState;
            return nextState;
          },
          commitToUndoStack: true,
        });

        const sortedTrimmedItems = [...trimmedItems].sort((a, b) => a.startFrame - b.startFrame);

        toast.success(`Trimmed ${sortedTrimmedItems.length} timeline item${sortedTrimmedItems.length > 1 ? 's' : ''}`, {
          position: 'top-right',
        });
        await reportResult('success', {
          requestedItemIds: uniqueItemIds,
          mode,
          trimmedItems: sortedTrimmedItems,
          skippedItemIds,
          projectState: buildProjectState(updatedState ?? undefined),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to trim timeline items';
        toast.error('Failed to trim timeline items', { description: message });
        await reportResult('error', { error: message }, message);
      }
    },
    [buildProjectState, reportToolResult, setState, stateAsRef],
  );

  return { trimTimelineItems };
};
