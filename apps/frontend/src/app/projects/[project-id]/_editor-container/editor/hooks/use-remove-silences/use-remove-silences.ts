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
import { applyRemovalForItem, getTranscriptionSilenceDetection, isAudioCapable } from './utils';

type TimelineGap = {
  trackId: string;
  beforeItemId: string;
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
  durationInSeconds: number;
};

type TimelineGapSummary = {
  gapCount: number;
  totalGapSeconds: number;
  largestGapSeconds: number;
  gaps: TimelineGap[];
};

type ApplyRemovalsStateResult = {
  summary: RemovedSegment[];
  processedItemIds: string[];
  createdItemIds: string[];
  sourceRemovals: {
    assetId: string;
    remoteUrl: string;
    fileName: string;
    originalDurationInSeconds: number;
    removedSegments: RemovedSegmentFromSource[];
  }[];
  updatedState: EditorState | null;
};

const roundSeconds = (value: number) => Number(value.toFixed(3));

const getTimelineGapSummary = (state: EditorState | null): TimelineGapSummary => {
  if (!state) {
    return { gapCount: 0, totalGapSeconds: 0, largestGapSeconds: 0, gaps: [] };
  }

  const { tracks, items, fps } = state.undoableState;
  const gaps: TimelineGap[] = [];

  for (const track of tracks) {
    const sortedItems = track.items
      .map((itemId) => items[itemId])
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => a.from - b.from);

    if (sortedItems.length < 2) continue;

    let coverageEnd = sortedItems[0].from + sortedItems[0].durationInFrames;
    for (const item of sortedItems.slice(1)) {
      if (item.from > coverageEnd) {
        const durationInFrames = item.from - coverageEnd;
        gaps.push({
          trackId: track.id,
          beforeItemId: item.id,
          startFrame: coverageEnd,
          endFrame: item.from,
          durationInFrames,
          durationInSeconds: roundSeconds(durationInFrames / fps),
        });
      }

      coverageEnd = Math.max(coverageEnd, item.from + item.durationInFrames);
    }
  }

  const sortedGaps = [...gaps].sort((a, b) => b.durationInFrames - a.durationInFrames);
  const totalGapFrames = gaps.reduce((sum, gap) => sum + gap.durationInFrames, 0);

  return {
    gapCount: gaps.length,
    totalGapSeconds: roundSeconds(totalGapFrames / fps),
    largestGapSeconds: roundSeconds((sortedGaps[0]?.durationInFrames ?? 0) / fps),
    gaps: sortedGaps.slice(0, 10),
  };
};

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
    (options?: Pick<RemoveSilenceOptions, 'targetItemId' | 'itemIds'>): TargetItem[] => {
      const requestedIds = options?.itemIds?.length
        ? options.itemIds
        : options?.targetItemId
          ? [options.targetItemId]
          : selectedItems;
      const scopedIds = Array.from(new Set(requestedIds.map((id) => id.trim()).filter(Boolean)));

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
    ): Promise<{
      results: { target: TargetItem; data: DetectSilenceResponse; detectionSource: 'transcription' | 'audio' }[];
      detectionSourceCounts: Record<'transcription' | 'audio', number>;
      skippedItemIds: string[];
    }> => {
      const precomputedDetections = options.detectionsByItemId ?? {};
      const noiseThreshold = options.noiseThresholdInDecibels ?? DEFAULT_NOISE_THRESHOLD;
      const minDuration = options.minDurationInSeconds ?? DEFAULT_MIN_DURATION;
      const detectionMode = options.detectionMode ?? 'auto';
      const canUseTranscription = detectionMode !== 'audio';
      const canUseAudio = detectionMode !== 'transcription';

      const results: { target: TargetItem; data: DetectSilenceResponse; detectionSource: 'transcription' | 'audio' }[] =
        [];
      const detectionSourceCounts = { transcription: 0, audio: 0 };
      const skippedItemIds: string[] = [];
      const audioDetectionCache = new Map<string, Promise<DetectSilenceResponse>>();

      for (const target of scopedTargets) {
        const precomputed = precomputedDetections[target.item.id];
        const asset = assets[target.item.assetId];
        const transcriptionDetection =
          canUseTranscription && asset && (asset.type === 'audio' || asset.type === 'video')
            ? getTranscriptionSilenceDetection({
                item: target.item,
                asset,
                fps,
                minDurationInSeconds: minDuration,
              })
            : null;

        if (transcriptionDetection?.silentParts.length) {
          results.push({ target, data: transcriptionDetection, detectionSource: 'transcription' });
          detectionSourceCounts.transcription += 1;
          continue;
        } else if (transcriptionDetection && !canUseAudio) {
          skippedItemIds.push(target.item.id);
          continue;
        }

        if (precomputed) {
          if (precomputed.audibleParts.length && precomputed.silentParts.length > 0) {
            results.push({ target, data: precomputed, detectionSource: 'audio' });
            detectionSourceCounts.audio += 1;
          } else {
            skippedItemIds.push(target.item.id);
          }
          continue;
        }

        if (!canUseAudio) {
          skippedItemIds.push(target.item.id);
          continue;
        }

        const cacheKey = `${target.assetUrl}:${noiseThreshold}:${minDuration}`;
        const detectionPromise =
          audioDetectionCache.get(cacheKey) ??
          detectSilence({
            body: {
              assetUrl: target.assetUrl,
              noiseThresholdInDecibels: noiseThreshold,
              minDurationInSeconds: minDuration,
            },
          }).then((response) => {
            if ('status' in response && response.status !== 200) {
              throw new Error('Silence detection failed');
            }

            return 'body' in response ? response.body : (response as DetectSilenceResponse);
          });

        audioDetectionCache.set(cacheKey, detectionPromise);
        const data = await detectionPromise;

        if (data?.audibleParts?.length && data.silentParts.length > 0) {
          results.push({ target, data, detectionSource: 'audio' });
          detectionSourceCounts.audio += 1;
        } else {
          skippedItemIds.push(target.item.id);
        }
      }

      return { results, detectionSourceCounts, skippedItemIds };
    },
    [assets, detectSilence, fps],
  );

  const applyRemovalsToState = useCallback(
    (
      results: { target: TargetItem; data: DetectSilenceResponse; detectionSource: 'transcription' | 'audio' }[],
      paddingInSeconds: number,
    ): ApplyRemovalsStateResult => {
      let operationResult: ApplyRemovalsStateResult = {
        summary: [],
        processedItemIds: [],
        createdItemIds: [],
        sourceRemovals: [],
        updatedState: null,
      };

      setState({
        update: (state) => {
          const nextSourceRemovals: ApplyRemovalsStateResult['sourceRemovals'] = [];
          const nextProcessedItemIds: string[] = [];
          let nextCreatedItemIds: string[] = [];

          const aggregated = results.reduce(
            (acc, result) => {
              const removalResult = applyRemovalForItem({
                state: acc.state,
                itemId: result.target.item.id,
                audibleParts: result.data.audibleParts,
                fps,
                paddingInSeconds,
              });

              const asset = assets[result.target.item.assetId];
              if (asset?.remoteUrl && removalResult.sourceRemovedSegments.length > 0) {
                nextSourceRemovals.push({
                  assetId: asset.id,
                  remoteUrl: asset.remoteUrl,
                  fileName: asset.filename,
                  originalDurationInSeconds:
                    'durationInSeconds' in asset ? asset.durationInSeconds : result.data.durationInSeconds,
                  removedSegments: removalResult.sourceRemovedSegments,
                });
              }

              if (removalResult.removedSegments.length > 0) {
                nextProcessedItemIds.push(result.target.item.id);
                nextCreatedItemIds = nextCreatedItemIds.concat(
                  removalResult.spliceResult?.createdItems.map((item) => item.id) ?? [],
                );
              }

              return {
                state: removalResult.state,
                summary: acc.summary.concat(removalResult.removedSegments),
              };
            },
            { state, summary: [] as RemovedSegment[] },
          );

          operationResult = {
            summary: aggregated.summary,
            processedItemIds: nextProcessedItemIds,
            createdItemIds: nextCreatedItemIds,
            sourceRemovals: nextSourceRemovals,
            updatedState: aggregated.state,
          };

          return aggregated.state;
        },
        commitToUndoStack: true,
      });

      return operationResult;
    },
    [assets, fps, setState],
  );

  const removeSilences = useCallback(
    async (options?: RemoveSilenceOptions) => {
      const toolCallId = options?.toolCallId;
      const scopedTargets = resolveTargets({ targetItemId: options?.targetItemId, itemIds: options?.itemIds });
      const requestedItemIds = scopedTargets.map((target) => target.item.id);

      if (scopedTargets.length === 0) {
        toast.error('Select at least one video or audio with an uploaded audio track.');
        await reportResult(toolCallId, 'error', { error: 'No valid audio-capable item selected' });
        return;
      }

      setIsProcessing(true);

      try {
        const paddingInSeconds = options?.paddingInSeconds ?? DEFAULT_PADDING_SECONDS;
        const { results, detectionSourceCounts, skippedItemIds } = await detectSilencesForTargets(
          scopedTargets,
          options ?? {},
        );

        if (results.length === 0) {
          toast.info('No removable silences detected with the current settings.');
          await reportResult(toolCallId, 'skipped', {
            reason: 'No removable silences detected',
            requestedItemIds,
            skippedItemIds: Array.from(new Set([...skippedItemIds, ...requestedItemIds])),
            detectionMode: options?.detectionMode ?? 'auto',
            detectionSourceCounts,
          });
          return;
        }

        const { summary, processedItemIds, createdItemIds, sourceRemovals, updatedState } = applyRemovalsToState(
          results,
          paddingInSeconds,
        );

        // Register removed segments for AI tools
        for (const removal of sourceRemovals) {
          registerRemovedSegments(removal);
        }

        const summaryPayload = {
          requestedItemIds,
          processedItemIds,
          createdItemIds,
          skippedItemIds: [
            ...new Set([...skippedItemIds, ...requestedItemIds.filter((itemId) => !processedItemIds.includes(itemId))]),
          ],
          removedCount: summary.length,
          removedDurationSeconds: summary.reduce((acc, seg) => acc + seg.durationInSeconds, 0),
          detectionMode: options?.detectionMode ?? 'auto',
          detectionSourceCounts,
          timelineGapSummary: getTimelineGapSummary(updatedState),
          projectState: buildProjectState(updatedState ?? undefined),
        };

        if (summary.length === 0) {
          toast.info('No removable silences detected with the current settings.');
          await reportResult(toolCallId, 'skipped', summaryPayload);
          return summaryPayload;
        }

        toast.success('Silences removed', {
          description: `${summary.length} silence${summary.length > 1 ? 's' : ''} removed successfully.`,
          position: 'top-right',
        });

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
