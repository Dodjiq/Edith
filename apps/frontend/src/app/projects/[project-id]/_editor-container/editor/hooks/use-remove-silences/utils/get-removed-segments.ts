import { RemovedSegmentFromSource } from '../../../state/editor-assets-store';
import { AudioCapableItem, AudiblePart, RemovedSegment } from '../types';

type GetRemovedSegmentsParams = {
  item: AudioCapableItem;
  mergedAudibleParts: AudiblePart[];
  fps: number;
};

type GetSourceRemovedSegmentsParams = {
  mergedAudibleParts: AudiblePart[];
  sourceDurationInSeconds: number;
};

const getItemOffset = (item: AudioCapableItem): number =>
  item.type === 'video' ? item.videoStartFromInSeconds : item.audioStartFromInSeconds;

export const getRemovedSegments = ({
  item,
  mergedAudibleParts,
  fps,
}: GetRemovedSegmentsParams): RemovedSegment[] => {
  const itemOffset = getItemOffset(item);
  const itemDurationInSeconds = item.durationInFrames / fps;
  const itemEnd = itemOffset + itemDurationInSeconds;
  const timelineOffset = item.from / fps;

  const gaps: RemovedSegment[] = [];
  let cursor = itemOffset;

  for (const part of mergedAudibleParts) {
    if (part.startInSeconds > cursor) {
      gaps.push({
        timelineStartInSeconds: timelineOffset + (cursor - itemOffset),
        timelineEndInSeconds: timelineOffset + (part.startInSeconds - itemOffset),
        durationInSeconds: part.startInSeconds - cursor,
      });
    }
    cursor = Math.max(cursor, part.endInSeconds);
  }

  if (cursor < itemEnd) {
    gaps.push({
      timelineStartInSeconds: timelineOffset + (cursor - itemOffset),
      timelineEndInSeconds: timelineOffset + (itemEnd - itemOffset),
      durationInSeconds: itemEnd - cursor,
    });
  }

  return gaps;
};

export const getSourceRemovedSegments = ({
  mergedAudibleParts,
  sourceDurationInSeconds,
}: GetSourceRemovedSegmentsParams): RemovedSegmentFromSource[] => {
  if (mergedAudibleParts.length === 0) return [];

  const gaps: RemovedSegmentFromSource[] = [];
  let cursor = 0;

  for (const part of mergedAudibleParts) {
    if (part.startInSeconds > cursor) {
      gaps.push({
        sourceStartInSeconds: cursor,
        sourceEndInSeconds: part.startInSeconds,
        durationInSeconds: part.startInSeconds - cursor,
      });
    }
    cursor = Math.max(cursor, part.endInSeconds);
  }

  if (cursor < sourceDurationInSeconds) {
    gaps.push({
      sourceStartInSeconds: cursor,
      sourceEndInSeconds: sourceDurationInSeconds,
      durationInSeconds: sourceDurationInSeconds - cursor,
    });
  }

  return gaps;
};
