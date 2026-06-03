import { useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/utils/services/api-frontend';
import { editorToolNames, FrameRange } from 'api-types';
import { cutFrameRange } from '../state/actions/cut-frame-range';
import { EditorState } from '../state/types';
import { useTracks, useWriteContext } from '../utils/use-context';
import { useGetProjectState } from './use-get-project-state';

type CutFrameRangeOptions = {
  trackId: string;
  ranges: FrameRange[];
  toolCallId?: string;
};

export const useCutFrameRange = () => {
  const { tracks } = useTracks();
  const { setState } = useWriteContext();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState();

  const cutFrameRangeFromTimeline = useCallback(
    async (options: CutFrameRangeOptions) => {
      const { trackId, ranges, toolCallId } = options;

      const report = async (
        status: 'success' | 'skipped' | 'error',
        output?: Record<string, unknown>,
        error?: string,
      ) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: {
              toolCallId,
              toolName: editorToolNames.cutFrameRange,
              status,
              output,
              error,
            },
          });
        } catch (e) {
          console.error('Failed to report tool result', e);
          // Reporting failure should not block
        }
      };

      if (ranges.length === 0) {
        toast.error('No frame ranges provided');
        await report('error', undefined, 'No frame ranges provided');
        return;
      }

      const invalidRanges = ranges.filter((r) => r.startFrame >= r.endFrame);
      if (invalidRanges.length > 0) {
        toast.error('Invalid frame range: startFrame must be less than endFrame for all ranges');
        await report('error', undefined, 'startFrame must be less than endFrame for all ranges');
        return;
      }

      const trackExists = tracks.some((track) => track.id === trackId);
      if (!trackExists) {
        toast.error('Track not found');
        await report('error', undefined, `Track with ID "${trackId}" not found`);
        return;
      }

      try {
        let totalDeletedItemIds: string[] = [];
        let totalTrimmedItemIds: string[] = [];
        let totalAffectedItemCount = 0;
        let updatedState: EditorState | null = null;

        // Sort ranges by startFrame descending to process from end to beginning
        // This prevents offset issues when cutting multiple ranges
        const sortedRanges = [...ranges].sort((a, b) => b.startFrame - a.startFrame);

        setState({
          update: (state) => {
            let currentState = state;

            for (const range of sortedRanges) {
              const cutResult = cutFrameRange({
                state: currentState,
                trackId,
                startFrame: range.startFrame,
                endFrame: range.endFrame,
              });

              totalDeletedItemIds = [...totalDeletedItemIds, ...cutResult.deletedItemIds];
              totalTrimmedItemIds = [...totalTrimmedItemIds, ...cutResult.trimmedItemIds];
              totalAffectedItemCount += cutResult.affectedItemCount;
              currentState = cutResult.state;
            }

            updatedState = currentState;
            return currentState;
          },
          commitToUndoStack: true,
        });

        const totalRemovedFrames = ranges.reduce((sum, r) => sum + (r.endFrame - r.startFrame), 0);

        if (totalAffectedItemCount === 0) {
          toast.info('No items found in the specified frame ranges', {
            position: 'top-right',
          });
          await report('skipped', {
            trackId,
            ranges,
            removedFrames: totalRemovedFrames,
            message: 'No items found in the specified frame ranges',
          });
          return;
        }

        toast.success(
          `Cut ${totalRemovedFrames} frames across ${ranges.length} range${ranges.length > 1 ? 's' : ''} from timeline`,
          {
            description: `${totalAffectedItemCount} item${totalAffectedItemCount > 1 ? 's' : ''} affected`,
            position: 'top-right',
          },
        );

        await report('success', {
          trackId,
          ranges,
          removedFrames: totalRemovedFrames,
          deletedItemIds: totalDeletedItemIds,
          trimmedItemIds: totalTrimmedItemIds,
          affectedItemCount: totalAffectedItemCount,
          projectState: buildProjectState(updatedState ?? undefined),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to cut frame ranges';
        toast.error('Failed to cut frame ranges', { description: message });
        await report('error', undefined, message);
      }
    },
    [buildProjectState, reportToolResult, setState, tracks],
  );

  return { cutFrameRange: cutFrameRangeFromTimeline };
};
