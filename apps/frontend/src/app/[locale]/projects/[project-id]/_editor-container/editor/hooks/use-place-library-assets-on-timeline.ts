import { useCallback } from 'react';
import api from '@/utils/services/api-frontend';
import { editorToolNames } from 'api-types';
import { placeLibraryAssetsOnTimelineWithNewItems } from '../library/place-library-assets-on-timeline';
import { useGetProjectState } from './use-get-project-state';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import { revealTimelinePosition } from '../utils/reveal-timeline-position';

export type PlaceLibraryAssetsOnTimelineOptions = {
  libraryAssetIds: string[];
  trackId?: string;
  startFrame?: number;
  startTimeInSeconds?: number;
  afterItemId?: string;
  toolCallId?: string;
};

export const usePlaceLibraryAssetsOnTimeline = () => {
  const { setState } = useWriteContext();
  const stateAsRef = useCurrentStateAsRef();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState();

  const placeLibraryAssetsOnTimeline = useCallback(
    async (options: PlaceLibraryAssetsOnTimelineOptions) => {
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
              toolName: editorToolNames.placeLibraryAssetsOnTimeline,
              status,
              output: payload,
              error,
            },
          });
        } catch {
          console.error('Failed to report tool result', { toolCallId, status });
        }
      };

      if (!options.libraryAssetIds || options.libraryAssetIds.length === 0) {
        await reportResult('error', { error: 'No libraryAssetIds provided' }, 'No libraryAssetIds provided');
        return;
      }

      let placements: ReturnType<typeof placeLibraryAssetsOnTimelineWithNewItems>['placements'] = [];
      let skippedAssetIds: string[] = [];
      let blockStartFrame: number | null = null;

      try {
        const currentState = stateAsRef.current;

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
          options.startTimeInSeconds !== undefined
            ? Math.round(options.startTimeInSeconds * currentState.undoableState.fps)
            : null;

        const startFrameFromInput =
          options.startFrame !== undefined ? Math.max(0, Math.round(options.startFrame)) : null;

        let resolvedTrackId = options.trackId;
        if (!resolvedTrackId && options.afterItemId) {
          const trackWithAnchor = currentState.undoableState.tracks.find((t) => t.items.includes(options.afterItemId!));
          resolvedTrackId = trackWithAnchor?.id;
        }

        if (!resolvedTrackId && currentState.undoableState.tracks.length > 0) {
          resolvedTrackId = currentState.undoableState.tracks[0].id;
        }

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

        const resolvedStartFrame =
          startFrameFromAfterItem ?? startFrameFromInput ?? startFrameFromSeconds ?? endOfTrackFrame;

        const result = placeLibraryAssetsOnTimelineWithNewItems({
          state: currentState,
          libraryAssetIds: options.libraryAssetIds,
          startFrame: resolvedStartFrame,
          trackId: resolvedTrackId,
          mode: 'fixed-track-shift-right',
          selectNewItems: true,
        });

        placements = result.placements;
        skippedAssetIds = result.skippedAssetIds;
        blockStartFrame = result.blockStartFrame;

        setState({
          update: result.state,
          commitToUndoStack: true,
        });

        if (placements.length === 0) {
          await reportResult('skipped', {
            reason: 'No valid assets were placed on the timeline',
            skippedAssetIds,
          });
          return;
        }

        const fps = result.state.undoableState.fps;
        const placed = placements.map((p) => ({
          assetId: p.assetId,
          itemId: p.itemId,
          trackId: p.trackId,
          startFrame: p.fromFrame,
          endFrame: p.fromFrame + p.durationInFrames,
          startTimeInSeconds: Number((p.fromFrame / fps).toFixed(3)),
          endTimeInSeconds: Number(((p.fromFrame + p.durationInFrames) / fps).toFixed(3)),
        }));

        revealTimelinePosition({
          state: result.state,
          frame: blockStartFrame ?? placements[0].fromFrame,
          trackId: placements[0].trackId,
        });

        await reportResult('success', {
          requestedLibraryAssetIds: options.libraryAssetIds,
          skippedAssetIds: skippedAssetIds.length > 0 ? skippedAssetIds : undefined,
          placed,
          projectState: buildProjectState(result.state),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to place assets on timeline';
        await reportResult('error', { error: message }, message);
      }
    },
    [buildProjectState, reportToolResult, setState, stateAsRef],
  );

  return { placeLibraryAssetsOnTimeline };
};
