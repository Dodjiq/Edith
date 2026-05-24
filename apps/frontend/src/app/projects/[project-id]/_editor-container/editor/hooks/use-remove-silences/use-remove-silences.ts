import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import api from '@/utils/services/api-frontend';
import { DetectSilenceResponse, editorToolNames } from 'api-types';
import { useAllItems, useAssets, useFps, useSelectedItems, useWriteContext } from '../../utils/use-context';
import { RemovedSegmentFromSource, useEditorAssetsStore } from '../../state/editor-assets-store';
import { useGetProjectState } from '../use-get-project-state';
import { EditorState } from '../../state/types';
import { RemovedSegment, RemoveSilenceOptions, TargetItem } from './types';
import { DEFAULT_MIN_DURATION, DEFAULT_NOISE_THRESHOLD, DEFAULT_PADDING_SECONDS } from './constants';
import { applyRemovalForItem, getSourceRemovedSegments, isAudioCapable } from './utils';

export const useRemoveSilences = () => {
  const { assets } = useAssets();
  const { items } = useAllItems();
  const { selectedItems } = useSelectedItems();
  const { fps } = useFps();
  const { setState } = useWriteContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const { mutateAsync: detectSilence } = api.audio.detectSilence.useMutation();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const registerRemovedSegments = useEditorAssetsStore((state) => state.registerRemovedSegments);
  const { buildProjectState } = useGetProjectState();

  const resolveTargets = useCallback(
    (targetItemId?: string): TargetItem[] => {
      const scopedIds = targetItemId ? selectedItems.filter((id) => id === targetItemId) : selectedItems;

      return scopedIds
        .map((id) => items[id])
        .filter(isAudioCapable)
        .map((item) => {
          const asset = assets[item.assetId];
          if (!asset) return null;

          const hasAudio = asset.type === 'audio' || (asset.type === 'video' && asset.hasAudioTrack);
          if (!hasAudio || !asset.remoteUrl) return null;

          return { item, assetUrl: asset.remoteUrl };
        })
        .filter(Boolean) as TargetItem[];
    },
    [assets, items, selectedItems],
  );

  const targets = useMemo(() => resolveTargets(), [resolveTargets]);
  const canRemove = targets.length > 0;

  const reportResult = useCallback(
    async (
      toolCallId: string | undefined,
      status: 'success' | 'skipped' | 'error',
      payload?: Record<string, unknown>,
    ) => {
      if (!toolCallId) return;
      try {
        await reportToolResult({
          body: {
            toolCallId,
            toolName: editorToolNames.removeSilences,
            status,
            output: payload,
            error: status === 'error' ? (payload?.error as string | undefined) : undefined,
          },
        });
      } catch {
        console.error('Failed to report tool result', { toolCallId, status, payload });
      }
    },
    [reportToolResult],
  );

  const detectSilencesForTargets = useCallback(
    async (
      scopedTargets: TargetItem[],
      options: RemoveSilenceOptions,
    ): Promise<{ target: TargetItem; data: DetectSilenceResponse }[]> => {
      const precomputedDetections = options.detectionsByItemId ?? {};
      const noiseThreshold = options.noiseThresholdInDecibels ?? DEFAULT_NOISE_THRESHOLD;
      const minDuration = options.minDurationInSeconds ?? DEFAULT_MIN_DURATION;

      const results: { target: TargetItem; data: DetectSilenceResponse }[] = [];

      for (const target of scopedTargets) {
        const precomputed = precomputedDetections[target.item.id];

        const response = precomputed
          ? precomputed
          : await detectSilence({
              body: {
                assetUrl: target.assetUrl,
                noiseThresholdInDecibels: noiseThreshold,
                minDurationInSeconds: minDuration,
              },
            });

        if (!precomputed && 'status' in response && response.status !== 200) {
          throw new Error('Silence detection failed');
        }

        const data = precomputed
          ? precomputed
          : 'body' in response
            ? response.body
            : (response as DetectSilenceResponse);

        if (data?.audibleParts?.length) {
          results.push({ target, data });
        }
      }

      return results;
    },
    [detectSilence],
  );

  const applyRemovalsToState = useCallback(
    (
      results: { target: TargetItem; data: DetectSilenceResponse }[],
      paddingInSeconds: number,
    ): {
      summary: RemovedSegment[];
      sourceRemovals: {
        assetId: string;
        remoteUrl: string;
        fileName: string;
        originalDurationInSeconds: number;
        removedSegments: RemovedSegmentFromSource[];
      }[];
      updatedState: EditorState | null;
    } => {
      let summary: RemovedSegment[] = [];
      let updatedState: EditorState | null = null;
      const sourceRemovals: {
        assetId: string;
        remoteUrl: string;
        fileName: string;
        originalDurationInSeconds: number;
        removedSegments: RemovedSegmentFromSource[];
      }[] = [];

      setState({
        update: (state) => {
          const aggregated = results.reduce(
            (acc, result) => {
              const { state: nextState, removedSegments } = applyRemovalForItem({
                state: acc.state,
                itemId: result.target.item.id,
                audibleParts: result.data.audibleParts,
                fps,
                paddingInSeconds,
              });

              const asset = assets[result.target.item.assetId];
              if (asset?.remoteUrl) {
                sourceRemovals.push({
                  assetId: asset.id,
                  remoteUrl: asset.remoteUrl,
                  fileName: asset.filename,
                  originalDurationInSeconds: result.data.durationInSeconds,
                  removedSegments: getSourceRemovedSegments({
                    mergedAudibleParts: result.data.audibleParts,
                    sourceDurationInSeconds: result.data.durationInSeconds,
                  }),
                });
              }

              return {
                state: nextState,
                summary: acc.summary.concat(removedSegments),
              };
            },
            { state, summary: [] as RemovedSegment[] },
          );

          summary = aggregated.summary;
          updatedState = aggregated.state;
          return aggregated.state;
        },
        commitToUndoStack: true,
      });

      return { summary, sourceRemovals, updatedState };
    },
    [assets, fps, setState],
  );

  const removeSilences = useCallback(
    async (options?: RemoveSilenceOptions) => {
      const toolCallId = options?.toolCallId;
      const scopedTargets = resolveTargets(options?.targetItemId);

      if (scopedTargets.length === 0) {
        toast.error('Select at least one video or audio with an uploaded audio track.');
        await reportResult(toolCallId, 'error', { error: 'No valid audio-capable item selected' });
        return;
      }

      setIsProcessing(true);

      try {
        const paddingInSeconds = options?.paddingInSeconds ?? DEFAULT_PADDING_SECONDS;
        const results = await detectSilencesForTargets(scopedTargets, options ?? {});

        if (results.length === 0) {
          toast.info('No audible parts detected with the current settings.');
          await reportResult(toolCallId, 'skipped', { reason: 'No audible parts detected' });
          return;
        }

        const { summary, sourceRemovals, updatedState } = applyRemovalsToState(results, paddingInSeconds);

        // Register removed segments for AI tools
        for (const removal of sourceRemovals) {
          registerRemovedSegments(removal);
        }

        toast.success('Silences removed', {
          description: `${summary.length} silences removed successfully.`,
          position: 'top-right',
        });

        const summaryPayload = {
          removedSegments: summary,
          removedCount: summary.length,
          removedDurationSeconds: summary.reduce((acc, seg) => acc + seg.durationInSeconds, 0),
          projectState: buildProjectState(updatedState ?? undefined),
        };

        await reportResult(toolCallId, 'success', summaryPayload);
        return summaryPayload;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove silences';
        toast.error('Failed to remove silences', { description: message });
        await reportResult(toolCallId, 'error', { error: message });
      } finally {
        setIsProcessing(false);
      }
    },
    [
      applyRemovalsToState,
      buildProjectState,
      detectSilencesForTargets,
      registerRemovedSegments,
      reportResult,
      resolveTargets,
    ],
  );

  return {
    removeSilences,
    isProcessing,
    canRemove,
  };
};
