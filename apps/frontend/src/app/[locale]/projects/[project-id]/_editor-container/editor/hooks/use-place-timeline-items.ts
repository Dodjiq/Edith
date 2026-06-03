import { useCallback } from 'react';
import api from '@/utils/services/api-frontend';
import { editorToolNames } from 'api-types';
import { placeTimelineItems } from '../state/actions/place-timeline-items';
import { revealTimelinePosition } from '../utils/reveal-timeline-position';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import { useGetProjectState } from './use-get-project-state';

export type PlaceTimelineItemsOptions = {
  itemIds: string[];
  trackId?: string;
  startFrame?: number;
  startTimeInSeconds?: number;
  afterItemId?: string;
  toolCallId?: string;
};

export const usePlaceTimelineItems = () => {
  const { setState } = useWriteContext();
  const stateAsRef = useCurrentStateAsRef();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState();

  const placeTimelineItemsOnTimeline = useCallback(
    async (options: PlaceTimelineItemsOptions) => {
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
              toolName: editorToolNames.placeTimelineItems,
              status,
              output: payload,
              error,
            },
          });
        } catch {
          console.error('Failed to report tool result', { toolCallId, status });
        }
      };

      if (!options.itemIds || options.itemIds.length === 0) {
        await reportResult('error', { error: 'No itemIds provided' }, 'No itemIds provided');
        return;
      }

      try {
        const currentState = stateAsRef.current;
        const fps = currentState.undoableState.fps;

        const firstItemId = options.itemIds.find((id) => id.trim().length > 0) ?? null;
        const fallbackTrackId = firstItemId
          ? currentState.undoableState.tracks.find((t) => t.items.includes(firstItemId))?.id
          : undefined;

        const resolvedTrackId = options.trackId ?? fallbackTrackId;

        const endOfTrackFrame = (() => {
          if (!resolvedTrackId) return 0;
          const track = currentState.undoableState.tracks.find((t) => t.id === resolvedTrackId);
          if (!track) return 0;

          let maxEnd = 0;
          for (const itemId of track.items) {
            const item = currentState.undoableState.items[itemId];
            if (!item) continue;
            maxEnd = Math.max(maxEnd, item.from + item.durationInFrames);
          }
          return maxEnd;
        })();

        const startFrameFromAfterItem = options.afterItemId
          ? (() => {
              const anchorItem = currentState.undoableState.items[options.afterItemId];
              if (!anchorItem) {
                throw new Error(`Item not found: ${options.afterItemId}`);
              }
              return anchorItem.from + anchorItem.durationInFrames;
            })()
          : null;

        const startFrameFromSeconds =
          options.startTimeInSeconds !== undefined ? Math.round(options.startTimeInSeconds * fps) : null;

        const startFrameFromInput =
          options.startFrame !== undefined ? Math.max(0, Math.round(options.startFrame)) : null;

        const resolvedStartFrame =
          startFrameFromAfterItem ?? startFrameFromInput ?? startFrameFromSeconds ?? endOfTrackFrame;

        const result = placeTimelineItems({
          state: currentState,
          itemIds: options.itemIds,
          startFrame: resolvedStartFrame,
          trackId: resolvedTrackId,
          selectMovedItems: true,
        });

        setState({
          update: result.state,
          commitToUndoStack: true,
        });

        if (result.placements.length === 0) {
          await reportResult('error', {
            error: 'No valid items were placed on the timeline',
            skippedItemIds: result.skippedItemIds,
          });
          return;
        }

        const placed = result.placements.map((p) => ({
          itemId: p.itemId,
          trackId: p.trackId,
          startFrame: p.fromFrame,
          endFrame: p.fromFrame + p.durationInFrames,
          startTimeInSeconds: Number((p.fromFrame / fps).toFixed(3)),
          endTimeInSeconds: Number(((p.fromFrame + p.durationInFrames) / fps).toFixed(3)),
        }));

        revealTimelinePosition({
          state: result.state,
          frame: result.blockStartFrame ?? result.placements[0].fromFrame,
          trackId: result.placements[0].trackId,
        });

        await reportResult('success', {
          requestedItemIds: options.itemIds,
          skippedItemIds: result.skippedItemIds.length > 0 ? result.skippedItemIds : undefined,
          placed,
          projectState: buildProjectState(result.state),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to place items on timeline';
        await reportResult('error', { error: message }, message);
      }
    },
    [buildProjectState, reportToolResult, setState, stateAsRef],
  );

  return { placeTimelineItems: placeTimelineItemsOnTimeline };
};

