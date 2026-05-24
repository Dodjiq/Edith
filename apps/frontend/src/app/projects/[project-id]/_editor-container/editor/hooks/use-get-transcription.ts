import { useCallback } from 'react';
import { editorToolNames, TranscriptionWord, Caption } from 'api-types';
import { Caption as RemotionCaption } from '@remotion/captions';
import { toast } from 'sonner';
import api from '@/utils/services/api-frontend';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import { AudioItem } from '../items/audio/audio-item-type';
import { VideoItem } from '../items/video/video-item-type';
import { AudioAsset, VideoAsset } from '../assets/assets';
import { periodicallyCheckIfLocalUrlIsStillValid, getLocalUrls, useLocalUrls } from '../caching/load-to-blob-url';
import { getCaptions, getCaptionsFromBuffer } from '../captioning/caption-state';
import { mixTimelineAudio } from '../captioning/mix-timeline-audio';
import { generateRandomId } from '../utils/generate-random-id';
import { sliceTranscription, framesToMs } from '../state/actions/splice-item/slice-transcription';

type TranscribableItem = VideoItem | AudioItem;
type TranscribableAsset = VideoAsset | AudioAsset;

/** Convert RemotionCaption to api-types Caption format */
const toApiCaption = (caption: RemotionCaption): Caption => ({
  text: caption.text,
  startMs: caption.startMs,
  endMs: caption.endMs,
  timestampMs: caption.timestampMs ?? null,
  confidence: caption.confidence ?? null,
});

/** Get source offset in seconds for video/audio items */
const getSourceOffsetInSeconds = (item: TranscribableItem): number => {
  if (item.type === 'video') {
    return item.videoStartFromInSeconds ?? 0;
  }
  if (item.type === 'audio') {
    return item.audioStartFromInSeconds ?? 0;
  }
  return 0;
};

type GetTranscriptionRequest = {
  itemIds?: string[];
  /** Start frame to filter transcription (inclusive) */
  startFrame?: number;
  /** End frame to filter transcription (exclusive) */
  endFrame?: number;
  toolCallId?: string;
};

type GetDetailedTranscriptionRequest = {
  /** Array of minute numbers (0-indexed) to get detailed transcription for. Maximum 10 minutes per request. */
  minutes: number[];
  itemIds?: string[];
  toolCallId?: string;
};

export const useGetTranscription = () => {
  // Use ref to get latest state synchronously (avoids stale closure issues with WebSocket callbacks)
  const stateRef = useCurrentStateAsRef();
  const { setState } = useWriteContext();
  const localUrls = useLocalUrls();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();

  // Helper functions that read from stateRef to get latest state (avoids stale closure issues)

  /** Find the trackId for a given item */
  const getTrackIdForItem = useCallback(
    (itemId: string): string | null => {
      const { tracks } = stateRef.current.undoableState;
      for (const track of tracks) {
        if (track.items.includes(itemId)) {
          return track.id;
        }
      }
      return null;
    },
    [stateRef],
  );

  /** Check if an asset has audio */
  const hasAudio = useCallback((asset: TranscribableAsset): boolean => {
    return asset.type === 'audio' || (asset.type === 'video' && asset.hasAudioTrack);
  }, []);

  /**
   * Gets transcription for an item, normalized to item-portion coordinates.
   * Priority: item.transcription > asset.transcription
   *
   * Returns transcription where 0 = start of what this item shows.
   */
  const getItemTranscription = useCallback(
    (item: TranscribableItem): Caption[] | null => {
      const { assets, fps } = stateRef.current.undoableState;

      // Priority 1: Item has its own transcription (from splice, already item-portion-relative)
      if (item.transcription && item.transcription.length > 0) {
        console.debug('[getItemTranscription] Item', item.id, 'has own transcription:', item.transcription.length, 'words');
        return item.transcription.map(toApiCaption);
      }

      // Priority 2: Asset has transcription (file-relative, needs conversion)
      const asset = assets[item.assetId];
      if (!asset || (asset.type !== 'video' && asset.type !== 'audio')) {
        console.debug('[getItemTranscription] Item', item.id, 'has no valid asset');
        return null;
      }

      const transcribableAsset = asset as TranscribableAsset;
      if (!transcribableAsset.transcription || transcribableAsset.transcription.length === 0) {
        console.debug('[getItemTranscription] Item', item.id, 'asset has no transcription');
        return null;
      }

      const assetTranscription = transcribableAsset.transcription.map(toApiCaption);

      // Convert asset transcription (file-relative) to item-portion coordinates
      // Always slice to filter by both sourceOffset AND duration
      const sourceOffsetMs = getSourceOffsetInSeconds(item) * 1000;
      const durationMs = framesToMs(item.durationInFrames, fps);

      const sliced = sliceTranscription(assetTranscription, sourceOffsetMs, durationMs);
      console.debug('[getItemTranscription] Item', item.id, 'sliced from asset:', sliced.length, 'words (sourceOffset:', sourceOffsetMs, 'duration:', durationMs, ')');
      return sliced;
    },
    [stateRef],
  );

  /**
   * Checks if an item has been marked as having no transcription (no speech detected).
   * Returns true if the item or its asset has hasNoTranscription set.
   */
  const itemHasNoTranscription = useCallback(
    (item: TranscribableItem): boolean => {
      const { assets } = stateRef.current.undoableState;

      // Check item-level flag first (for spliced items)
      if ('hasNoTranscription' in item && item.hasNoTranscription === true) {
        return true;
      }

      // Check asset-level flag
      const asset = assets[item.assetId];
      if (!asset || (asset.type !== 'video' && asset.type !== 'audio')) {
        return false;
      }

      return asset.hasNoTranscription === true;
    },
    [stateRef],
  );

  /**
   * Checks if an item's asset is currently being transcribed.
   * Returns true if the asset status is 'transcribing', 'pending-upload', or 'in-progress'.
   */
  const isItemTranscribing = useCallback(
    (item: TranscribableItem): boolean => {
      const { assetStatus } = stateRef.current;
      const status = assetStatus[item.assetId];
      if (!status) return false;
      return status.type === 'transcribing' || status.type === 'pending-upload' || status.type === 'in-progress';
    },
    [stateRef],
  );

  /**
   * Checks if any of the target items are still being transcribed.
   */
  const anyItemsStillTranscribing = useCallback(
    (targetItems: TranscribableItem[]): boolean => {
      return targetItems.some((item) => isItemTranscribing(item));
    },
    [isItemTranscribing],
  );

  /** Resolve target items from IDs or get all audio items if no IDs provided */
  const resolveTargetItems = useCallback(
    (targetItemIds?: string[]): TranscribableItem[] => {
      const { items, assets } = stateRef.current.undoableState;
      const resolved: TranscribableItem[] = [];

      // Log state reference to verify we have the latest state
      console.debug('[resolveTargetItems] State ref identity check - items count:', Object.keys(items).length);
      console.debug('[resolveTargetItems] Item IDs in current state:', Object.keys(items));

      if (targetItemIds && targetItemIds.length > 0) {
        for (const id of targetItemIds) {
          const item = items[id];
          if (item && (item.type === 'video' || item.type === 'audio')) {
            const asset = assets[item.assetId];
            if (asset && (asset.type === 'audio' || asset.type === 'video') && hasAudio(asset)) {
              resolved.push(item);
            }
          }
        }
      } else {
        for (const itemId of Object.keys(items)) {
          const item = items[itemId];
          if (item && (item.type === 'video' || item.type === 'audio')) {
            const asset = assets[item.assetId];
            if (asset && (asset.type === 'audio' || asset.type === 'video') && hasAudio(asset)) {
              resolved.push(item);
            }
          }
        }
      }

      console.debug('[resolveTargetItems] Resolved items:', resolved.map((i) => ({
        id: i.id,
        type: i.type,
        from: i.from,
        duration: i.durationInFrames,
        hasTranscription: !!(i.transcription && i.transcription.length > 0),
        transcriptionLength: i.transcription?.length ?? 0,
      })));

      return resolved.sort((a, b) => a.from - b.from);
    },
    [stateRef, hasAudio],
  );

  const resolveAsset = useCallback(
    (item: TranscribableItem): TranscribableAsset | null => {
      const { assets } = stateRef.current.undoableState;
      const asset = assets[item.assetId];
      if (!asset) return null;
      if (asset.type === 'audio' || asset.type === 'video') {
        return asset;
      }
      return null;
    },
    [stateRef],
  );

  const resolveSourceUrl = useCallback(
    (asset: TranscribableAsset): string | null => {
      const localUrl = localUrls[asset.id];
      if (localUrl) {
        void periodicallyCheckIfLocalUrlIsStillValid(localUrl, asset);
        return localUrl;
      }
      return asset.remoteUrl;
    },
    [localUrls],
  );

  /**
   * Converts an item's transcription to timeline-based TranscriptionWords.
   * The item's transcription timestamps (relative to item portion) are converted
   * to absolute timeline frames by adding item.from.
   */
  const convertItemTranscriptionToTimelineWords = useCallback(
    (item: TranscribableItem, transcription: Caption[]): TranscriptionWord[] => {
      const { fps } = stateRef.current.undoableState;
      const trackId = getTrackIdForItem(item.id) ?? 'unknown';

      return transcription.map((caption) => ({
        text: caption.text,
        // Convert item-portion ms to timeline frames: item.from + (ms to frames)
        startFrame: item.from + Math.floor((caption.startMs / 1000) * fps),
        endFrame: item.from + Math.floor((caption.endMs / 1000) * fps),
        trackId,
      }));
    },
    [stateRef, getTrackIdForItem],
  );

  /**
   * Merges transcription from multiple items into a single timeline.
   * Each item's transcription is converted to timeline coordinates and combined.
   */
  const mergeItemTranscriptions = useCallback(
    (targetItems: TranscribableItem[]): TranscriptionWord[] => {
      const allWords: TranscriptionWord[] = [];

      for (const item of targetItems) {
        const transcription = getItemTranscription(item);
        if (transcription && transcription.length > 0) {
          const timelineWords = convertItemTranscriptionToTimelineWords(item, transcription);
          allWords.push(...timelineWords);
        }
      }

      // Sort by timeline position
      return allWords.sort((a, b) => a.startFrame - b.startFrame);
    },
    [getItemTranscription, convertItemTranscriptionToTimelineWords],
  );

  /**
   * Checks if all target items have cached transcription (from item or asset)
   * or have been marked as having no transcription (no speech detected).
   */
  const allItemsHaveTranscription = useCallback(
    (targetItems: TranscribableItem[]): boolean => {
      const results = targetItems.map((item) => {
        // If marked as having no transcription, consider it "processed"
        if (itemHasNoTranscription(item)) {
          return { itemId: item.id, hasNoTranscription: true, hasTranscription: true, reason: 'marked-no-transcription' };
        }
        const transcription = getItemTranscription(item);
        const hasIt = transcription !== null && transcription.length > 0;
        return {
          itemId: item.id,
          hasNoTranscription: false,
          hasTranscription: hasIt,
          transcriptionLength: transcription?.length ?? 0,
          itemTranscriptionLength: item.transcription?.length ?? 0,
          reason: hasIt ? 'has-transcription' : 'no-transcription',
        };
      });

      console.debug('[allItemsHaveTranscription] Results:', results);

      return results.every((r) => r.hasTranscription);
    },
    [getItemTranscription, itemHasNoTranscription],
  );

  const getTranscription = useCallback(
    async ({ itemIds, startFrame, endFrame, toolCallId }: GetTranscriptionRequest = {}) => {
      const report = async (status: 'success' | 'skipped' | 'error', payload?: Record<string, unknown>) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: {
              toolCallId,
              toolName: editorToolNames.getTranscription,
              status,
              output: payload,
              error: status === 'error' ? (payload?.error as string | undefined) : undefined,
            },
          });
        } catch {
          console.error('Failed to report transcription result', { toolCallId, status, payload });
        }
      };

      if (startFrame !== undefined && endFrame !== undefined && startFrame >= endFrame) {
        const error = 'Invalid frame range: startFrame must be less than endFrame.';
        toast.error('Cannot transcribe', { description: error });
        await report('error', { error, startFrame, endFrame });
        return null;
      }

      const targetItems = resolveTargetItems(itemIds);

      if (targetItems.length === 0) {
        const error = itemIds?.length
          ? 'No items with audio found among the provided IDs.'
          : 'No items with audio found on the timeline.';
        toast.error('Cannot transcribe', { description: error });
        await report('error', { error, requestedItemIds: itemIds });
        return null;
      }

      try {
        // Extract current state values (avoids stale closure - reads fresh state)
        const { assets, fps } = stateRef.current.undoableState;
        let transcriptionWords: TranscriptionWord[];

        console.debug('[getTranscription] Checking transcription state for', targetItems.length, 'items');
        const hasAll = allItemsHaveTranscription(targetItems);
        const stillTranscribing = anyItemsStillTranscribing(targetItems);
        console.debug('[getTranscription] hasAllTranscription:', hasAll, 'stillTranscribing:', stillTranscribing);

        // Optimization: If all items have cached transcription, merge without transcribing
        if (hasAll) {
          console.debug('Using cached transcription for all items', targetItems.length);
          transcriptionWords = mergeItemTranscriptions(targetItems);
        } else if (stillTranscribing) {
          // Some items are still being transcribed - use cached transcription for items that have it
          // Don't trigger a new transcription request since one is already in progress
          console.debug('Some items still transcribing, using available cached transcription');
          transcriptionWords = mergeItemTranscriptions(targetItems);

          // Count how many items are still transcribing vs have transcription
          const transcribingCount = targetItems.filter((item) => isItemTranscribing(item)).length;
          const cachedCount = targetItems.filter(
            (item) => !isItemTranscribing(item) && (getItemTranscription(item)?.length ?? 0) > 0,
          ).length;

          toast.info('Transcription in progress', {
            description: `${transcribingCount} item(s) still processing. Using ${cachedCount} cached transcription(s).`,
          });
        } else if (targetItems.length === 1) {
          // Single item without cached transcription: transcribe it
          const targetItem = targetItems[0];
          const asset = resolveAsset(targetItem);

          if (!asset) {
            const error = 'Transcription requires an audio or video asset.';
            toast.error('Cannot transcribe', { description: error });
            await report('error', { error, targetItemId: targetItem.id });
            return null;
          }

          const src = resolveSourceUrl(asset);
          if (!src) {
            const error = 'Asset is missing a playable source URL.';
            toast.error('Cannot transcribe', { description: error });
            await report('error', { error, targetItemId: targetItem.id, assetId: asset.id });
            return null;
          }

          toast.info('Transcribing audio', { description: 'Processing single item...' });

          const captions = await getCaptions({
            src,
            setState,
            asset,
            captionItemId: generateRandomId(),
          });

          if (!captions || captions.length === 0) {
            const error = 'Transcription returned no results.';
            toast.error('Transcription failed', { description: error });
            await report('error', { error, targetItemIds: [targetItem.id] });
            return null;
          }

          // Convert file-relative captions to item-portion then to timeline
          // Always slice to filter by both sourceOffset AND duration
          const sourceOffsetMs = getSourceOffsetInSeconds(targetItem) * 1000;
          const durationMs = framesToMs(targetItem.durationInFrames, fps);
          const itemPortionCaptions = sliceTranscription(captions, sourceOffsetMs, durationMs);

          transcriptionWords = convertItemTranscriptionToTimelineWords(targetItem, itemPortionCaptions);
        } else {
          // Multiple items, some without transcription and none transcribing: mix and transcribe
          toast.info('Mixing audio tracks', { description: `Processing ${targetItems.length} items...` });

          const mixedAudio = await mixTimelineAudio({
            items: targetItems,
            assets,
            localUrls: getLocalUrls(),
            fps,
          });

          const captions = await getCaptionsFromBuffer({
            audioBuffer: mixedAudio.buffer,
            audioMimeType: mixedAudio.mimeType,
            audioExtension: mixedAudio.extension,
            setState,
            captionItemId: generateRandomId(),
            filename: `mixed-audio${mixedAudio.extension}`,
          });

          if (!captions || captions.length === 0) {
            const error = 'Transcription returned no results.';
            toast.error('Transcription failed', { description: error });
            await report('error', { error, targetItemIds: targetItems.map((i) => i.id) });
            return null;
          }

          // Mixed audio timestamps are relative to mix start (first item's timeline position)
          const firstItemFrom = targetItems[0].from;
          transcriptionWords = captions.map((caption) => {
            // Find which item this word belongs to based on timeline position
            const wordTimelineFrame = firstItemFrom + Math.floor((caption.startMs / 1000) * fps);
            let trackId = 'unknown';

            for (const item of targetItems) {
              const itemEnd = item.from + item.durationInFrames;
              if (wordTimelineFrame >= item.from && wordTimelineFrame < itemEnd) {
                trackId = getTrackIdForItem(item.id) ?? 'unknown';
                break;
              }
            }

            return {
              text: caption.text,
              startFrame: firstItemFrom + Math.floor((caption.startMs / 1000) * fps),
              endFrame: firstItemFrom + Math.floor((caption.endMs / 1000) * fps),
              trackId,
            };
          });
        }

        // Filter by frame range if provided
        if (startFrame !== undefined || endFrame !== undefined) {
          const filterStart = startFrame ?? 0;
          const filterEnd = endFrame ?? Infinity;

          transcriptionWords = transcriptionWords.filter((word) => {
            return word.endFrame > filterStart && word.startFrame < filterEnd;
          });
        }

        const frameRangeInfo =
          startFrame !== undefined || endFrame !== undefined ? ` (frames ${startFrame ?? 0}-${endFrame ?? 'end'})` : '';

        toast.success('Transcription complete', {
          description: `Transcribed ${transcriptionWords.length} words from ${targetItems.length} item(s)${frameRangeInfo}.`,
        });

        await report('success', {
          words: transcriptionWords,
          wordCount: transcriptionWords.length,
          itemCount: targetItems.length,
          targetItemIds: targetItems.map((i) => i.id),
          startFrame,
          endFrame,
          fps,
        });

        return transcriptionWords;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to transcribe audio';
        toast.error('Transcription failed', { description: message });
        await report('error', {
          error: message,
          note: message,
          targetItemIds: targetItems.map((i) => i.id),
        });
        return null;
      }
    },
    [
      allItemsHaveTranscription,
      anyItemsStillTranscribing,
      convertItemTranscriptionToTimelineWords,
      getItemTranscription,
      getTrackIdForItem,
      isItemTranscribing,
      mergeItemTranscriptions,
      reportToolResult,
      resolveAsset,
      resolveSourceUrl,
      resolveTargetItems,
      setState,
      stateRef,
    ],
  );

  /**
   * Gets detailed transcription for specific minutes.
   * Minutes are 0-indexed (minute 0 = first minute).
   */
  const getDetailedTranscription = useCallback(
    async ({ minutes, itemIds, toolCallId }: GetDetailedTranscriptionRequest) => {
      const report = async (status: 'success' | 'skipped' | 'error', payload?: Record<string, unknown>) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: {
              toolCallId,
              toolName: editorToolNames.getDetailedTranscription,
              status,
              output: payload,
              error: status === 'error' ? (payload?.error as string | undefined) : undefined,
            },
          });
        } catch {
          console.error('Failed to report detailed transcription result', { toolCallId, status, payload });
        }
      };

      const normalizedMinutes = Array.from(new Set(minutes.filter((minute) => minute >= 0))).sort((a, b) => a - b);

      if (normalizedMinutes.length === 0) {
        const error = 'At least one minute is required for detailed transcription.';
        toast.error('Cannot get detailed transcription', { description: error });
        await report('error', { error, requestedItemIds: itemIds });
        return null;
      }

      if (normalizedMinutes.length > 10) {
        const error = 'Detailed transcription is limited to 10 minutes per request. Split longer ranges into multiple calls.';
        toast.error('Cannot get detailed transcription', { description: error });
        await report('error', { error, requestedItemIds: itemIds, minutes: normalizedMinutes });
        return null;
      }

      const targetItems = resolveTargetItems(itemIds);

      if (targetItems.length === 0) {
        const error = itemIds?.length
          ? 'No items with audio found among the provided IDs.'
          : 'No items with audio found on the timeline.';
        toast.error('Cannot get detailed transcription', { description: error });
        await report('error', { error, requestedItemIds: itemIds });
        return null;
      }

      try {
        // Extract current state values (avoids stale closure - reads fresh state)
        const { fps } = stateRef.current.undoableState;

        // Get full transcription first (using cached if available)
        let allTranscriptionWords: TranscriptionWord[];

        if (allItemsHaveTranscription(targetItems)) {
          allTranscriptionWords = mergeItemTranscriptions(targetItems);
        } else {
          // Need to transcribe first - call getTranscription without toolCallId
          const result = await getTranscription({ itemIds });
          if (!result) {
            await report('error', { error: 'Failed to get transcription' });
            return null;
          }
          allTranscriptionWords = result;
        }

        // Filter words to only those within the requested minutes
        const filteredWords: TranscriptionWord[] = [];
        const framesPerMinute = fps * 60;

        for (const word of allTranscriptionWords) {
          const wordMinute = Math.floor(word.startFrame / framesPerMinute);
          if (normalizedMinutes.includes(wordMinute)) {
            filteredWords.push(word);
          }
        }

        toast.success('Detailed transcription retrieved', {
          description: `Retrieved ${filteredWords.length} words for minute(s): ${normalizedMinutes.map((minute) => minute + 1).join(', ')}.`,
        });

        await report('success', {
          words: filteredWords,
          wordCount: filteredWords.length,
          targetItemIds: targetItems.map((i) => i.id),
          minutes: normalizedMinutes,
        });

        return filteredWords;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get detailed transcription';
        toast.error('Detailed transcription failed', { description: message });
        await report('error', {
          error: message,
          note: message,
          targetItemIds: targetItems.map((i) => i.id),
        });
        return null;
      }
    },
    [
      allItemsHaveTranscription,
      getTranscription,
      mergeItemTranscriptions,
      reportToolResult,
      resolveTargetItems,
      stateRef,
    ],
  );

  return { getTranscription, getDetailedTranscription };
};
