import type { Caption } from '@remotion/captions';
import type { DetectSilenceResponse } from 'api-types';
import type { AudioAsset, VideoAsset } from '../../../assets/assets';
import type { AudioCapableItem, AudiblePart } from '../types';

type TranscribableAsset = AudioAsset | VideoAsset;

type GetTranscriptionSilenceDetectionParams = {
  item: AudioCapableItem;
  asset: TranscribableAsset;
  fps: number;
  minDurationInSeconds: number;
};

const getItemOffsetInSeconds = (item: AudioCapableItem): number =>
  item.type === 'video' ? item.videoStartFromInSeconds : item.audioStartFromInSeconds;

const toSeconds = (milliseconds: number): number => milliseconds / 1000;

const mergeTimeRanges = (ranges: AudiblePart[]): AudiblePart[] => {
  const sortedRanges = [...ranges]
    .filter((range) => range.endInSeconds > range.startInSeconds)
    .sort((a, b) => a.startInSeconds - b.startInSeconds);
  const mergedRanges: AudiblePart[] = [];

  for (const range of sortedRanges) {
    const lastRange = mergedRanges[mergedRanges.length - 1];
    if (lastRange && range.startInSeconds <= lastRange.endInSeconds) {
      lastRange.endInSeconds = Math.max(lastRange.endInSeconds, range.endInSeconds);
    } else {
      mergedRanges.push({ ...range });
    }
  }

  return mergedRanges;
};

const getCaptionRangesInSource = ({
  captions,
  item,
  isItemRelative,
}: {
  captions: Caption[];
  item: AudioCapableItem;
  isItemRelative: boolean;
}): AudiblePart[] => {
  const itemOffset = getItemOffsetInSeconds(item);

  return captions.map((caption) => {
    const startInSeconds = toSeconds(caption.startMs) + (isItemRelative ? itemOffset : 0);
    const endInSeconds = toSeconds(caption.endMs) + (isItemRelative ? itemOffset : 0);

    return { startInSeconds, endInSeconds };
  });
};

const getSilentPartsFromAudibleParts = ({
  audibleParts,
  itemStart,
  itemEnd,
  minDurationInSeconds,
}: {
  audibleParts: AudiblePart[];
  itemStart: number;
  itemEnd: number;
  minDurationInSeconds: number;
}): AudiblePart[] => {
  const silentParts: AudiblePart[] = [];
  let cursor = itemStart;

  for (const part of audibleParts) {
    const startInSeconds = Math.max(part.startInSeconds, itemStart);
    const endInSeconds = Math.min(part.endInSeconds, itemEnd);

    if (startInSeconds - cursor >= minDurationInSeconds) {
      silentParts.push({ startInSeconds: cursor, endInSeconds: startInSeconds });
    }

    cursor = Math.max(cursor, endInSeconds);
  }

  if (itemEnd - cursor >= minDurationInSeconds) {
    silentParts.push({ startInSeconds: cursor, endInSeconds: itemEnd });
  }

  return silentParts;
};

const getAudiblePartsFromSilentParts = ({
  silentParts,
  itemStart,
  itemEnd,
}: {
  silentParts: AudiblePart[];
  itemStart: number;
  itemEnd: number;
}): AudiblePart[] => {
  if (silentParts.length === 0) {
    return [{ startInSeconds: itemStart, endInSeconds: itemEnd }];
  }

  const audibleParts: AudiblePart[] = [];
  let cursor = itemStart;

  for (const part of silentParts) {
    if (part.startInSeconds > cursor) {
      audibleParts.push({ startInSeconds: cursor, endInSeconds: part.startInSeconds });
    }

    cursor = Math.max(cursor, part.endInSeconds);
  }

  if (cursor < itemEnd) {
    audibleParts.push({ startInSeconds: cursor, endInSeconds: itemEnd });
  }

  return audibleParts;
};

export const getTranscriptionSilenceDetection = ({
  item,
  asset,
  fps,
  minDurationInSeconds,
}: GetTranscriptionSilenceDetectionParams): DetectSilenceResponse | null => {
  const itemStart = getItemOffsetInSeconds(item);
  const itemEnd = itemStart + item.durationInFrames / fps;
  const captions = item.transcription?.length ? item.transcription : asset.transcription;
  const isItemRelative = Boolean(item.transcription?.length);

  if (!captions?.length || itemEnd <= itemStart) {
    return null;
  }

  const captionRanges = getCaptionRangesInSource({ captions, item, isItemRelative })
    .map((range) => ({
      startInSeconds: Math.max(range.startInSeconds, itemStart),
      endInSeconds: Math.min(range.endInSeconds, itemEnd),
    }))
    .filter((range) => range.endInSeconds > range.startInSeconds);

  const mergedCaptionRanges = mergeTimeRanges(captionRanges);
  if (mergedCaptionRanges.length === 0) {
    return null;
  }

  const silentParts = getSilentPartsFromAudibleParts({
    audibleParts: mergedCaptionRanges,
    itemStart,
    itemEnd,
    minDurationInSeconds,
  });

  return {
    silentParts,
    audibleParts: getAudiblePartsFromSilentParts({ silentParts, itemStart, itemEnd }),
    durationInSeconds: asset.durationInSeconds,
  };
};
