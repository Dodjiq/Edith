import { VideoItem } from '../items/video/video-item-type';
import { AudioItem } from '../items/audio/audio-item-type';
import { EditorStarterAsset } from '../assets/assets';
import { CAPTION_CHANNELS, CAPTION_SAMPLE_RATE, encodeCaptionsAudio } from './audio-buffer-to-mp3';

type MixableItem = VideoItem | AudioItem;

interface MixableItemInfo {
  assetId: string;
  /** Position on timeline in frames */
  from: number;
  /** Duration on timeline in frames */
  durationInFrames: number;
  /** Offset into source file in seconds */
  sourceOffsetInSeconds: number;
  /** Playback rate */
  playbackRate: number;
}

const extractItemInfo = (item: MixableItem): MixableItemInfo => ({
  assetId: item.assetId,
  from: item.from,
  durationInFrames: item.durationInFrames,
  sourceOffsetInSeconds: item.type === 'video' ? item.videoStartFromInSeconds : item.audioStartFromInSeconds,
  playbackRate: item.playbackRate,
});

const resolveAssetUrl = (
  assetId: string,
  assets: Record<string, EditorStarterAsset>,
  localUrls: Record<string, string>,
): string | null => {
  const localUrl = localUrls[assetId];
  if (localUrl) return localUrl;

  const asset = assets[assetId];
  return asset?.remoteUrl ?? null;
};

/**
 * Mix multiple timeline items into a single MP3 audio buffer for transcription.
 * Uses OfflineAudioContext for faster-than-realtime processing.
 *
 * - Deduplicates asset fetching (same source is fetched once)
 * - Positions each item correctly on the timeline
 * - Handles videoStartFromInSeconds/audioStartFromInSeconds for cuts
 * - Supports playback rate adjustments
 */
export const mixTimelineAudio = async ({
  items,
  assets,
  localUrls,
  fps,
}: {
  items: MixableItem[];
  assets: Record<string, EditorStarterAsset>;
  localUrls: Record<string, string>;
  fps: number;
}): Promise<{ buffer: ArrayBuffer; mimeType: string; extension: string }> => {
  if (items.length === 0) {
    throw new Error('No items provided for audio mixing');
  }

  // Extract info and sort by timeline position
  const itemInfos = items.map(extractItemInfo).sort((a, b) => a.from - b.from);

  // Calculate timeline range
  const firstItemFrom = itemInfos[0].from;
  const lastItem = itemInfos[itemInfos.length - 1];
  const lastItemEnd = lastItem.from + lastItem.durationInFrames;
  const totalDurationInFrames = lastItemEnd - firstItemFrom;
  const totalDurationInSeconds = totalDurationInFrames / fps;

  if (totalDurationInSeconds <= 0) {
    throw new Error('Invalid timeline duration');
  }

  // Create offline audio context
  const offlineCtx = new OfflineAudioContext(
    CAPTION_CHANNELS,
    Math.ceil(totalDurationInSeconds * CAPTION_SAMPLE_RATE),
    CAPTION_SAMPLE_RATE,
  );

  // Deduplicate assets - fetch each unique source once
  const uniqueAssetIds = [...new Set(itemInfos.map((i) => i.assetId))];
  const audioBuffers: Record<string, AudioBuffer> = {};

  await Promise.all(
    uniqueAssetIds.map(async (assetId) => {
      const url = resolveAssetUrl(assetId, assets, localUrls);
      if (!url) {
        console.warn(`[mixTimelineAudio] No URL found for asset ${assetId}`);
        return;
      }

      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffers[assetId] = await offlineCtx.decodeAudioData(arrayBuffer);
      } catch (error) {
        console.error(`[mixTimelineAudio] Failed to load audio for asset ${assetId}:`, error);
      }
    }),
  );

  // Schedule each timeline item at its correct position
  for (const itemInfo of itemInfos) {
    const buffer = audioBuffers[itemInfo.assetId];
    if (!buffer) {
      console.warn(`[mixTimelineAudio] No audio buffer for asset ${itemInfo.assetId}`);
      continue;
    }

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = itemInfo.playbackRate;
    source.connect(offlineCtx.destination);

    // Calculate timeline position relative to the caption start (first item)
    const timelinePositionInSeconds = (itemInfo.from - firstItemFrom) / fps;
    const durationInSeconds = itemInfo.durationInFrames / fps / itemInfo.playbackRate;

    // source.start(when, offset, duration)
    // - when: position on the mixed timeline
    // - offset: where in the original source to start reading
    // - duration: how long to play from the source (adjusted for playback rate)
    source.start(timelinePositionInSeconds, itemInfo.sourceOffsetInSeconds, durationInSeconds);
  }

  // Render all audio offline (faster than real-time)
  const renderedBuffer = await offlineCtx.startRendering();

  return encodeCaptionsAudio(renderedBuffer);
};

export type { MixableItem };
