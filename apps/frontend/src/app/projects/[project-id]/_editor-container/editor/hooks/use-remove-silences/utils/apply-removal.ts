import { EditorState } from '../../../state/types';
import {
  spliceItem,
  SpliceItemResult,
  KeepRange,
  getSourceOffsetInSeconds,
} from '../../../state/actions/splice-item';
import { AudioCapableItem, AudiblePart, RemovedSegment } from '../types';
import { getRemovedSegments } from './get-removed-segments';
import { shiftFollowingItems } from './shift-following-items';

type ApplyRemovalParams = {
  state: EditorState;
  itemId: string;
  audibleParts: AudiblePart[];
  fps: number;
  paddingInSeconds: number;
};

type ApplyRemovalResult = {
  state: EditorState;
  removedSegments: RemovedSegment[];
  spliceResult: SpliceItemResult | null;
};

/**
 * Expands audible parts by padding and merges overlapping parts.
 */
const expandAndMergeParts = (
  parts: AudiblePart[],
  padding: number,
  itemOffset: number,
  itemEnd: number,
): AudiblePart[] => {
  const expanded = parts
    .map((part) => ({
      startInSeconds: Math.max(part.startInSeconds - padding, itemOffset),
      endInSeconds: Math.min(part.endInSeconds + padding, itemEnd),
    }))
    .filter((part) => part.endInSeconds > part.startInSeconds)
    .sort((a, b) => a.startInSeconds - b.startInSeconds);

  const merged: AudiblePart[] = [];
  for (const part of expanded) {
    const last = merged[merged.length - 1];
    if (last && part.startInSeconds <= last.endInSeconds) {
      last.endInSeconds = Math.max(last.endInSeconds, part.endInSeconds);
    } else {
      merged.push({ ...part });
    }
  }

  return merged;
};

/**
 * Converts merged audible parts to KeepRange format for spliceItem.
 */
const audiblePartsToKeepRanges = (
  item: AudioCapableItem,
  mergedAudibleParts: AudiblePart[],
  fps: number,
): KeepRange[] => {
  const itemOffset = getSourceOffsetInSeconds(item);

  let timelineCursor = item.from;
  const keepRanges: KeepRange[] = [];

  for (const part of mergedAudibleParts) {
    const durationInSeconds = part.endInSeconds - part.startInSeconds;
    const durationInFrames = Math.max(1, Math.round(durationInSeconds * fps));
    const sourceOffsetInFrames = Math.round((part.startInSeconds - itemOffset) * fps);

    keepRanges.push({
      timelineStartFrame: timelineCursor,
      sourceOffsetInFrames,
      durationInFrames,
    });

    timelineCursor += durationInFrames;
  }

  return keepRanges;
};

export const applyRemovalForItem = ({
  state,
  itemId,
  audibleParts,
  fps,
  paddingInSeconds,
}: ApplyRemovalParams): ApplyRemovalResult => {
  const currentItem = state.undoableState.items[itemId] as AudioCapableItem | undefined;

  if (!currentItem) {
    return { state, removedSegments: [], spliceResult: null };
  }

  const trackIndex = state.undoableState.tracks.findIndex((track) => track.items.includes(itemId));
  if (trackIndex === -1) {
    return { state, removedSegments: [], spliceResult: null };
  }

  const track = state.undoableState.tracks[trackIndex];
  const itemOffset = getSourceOffsetInSeconds(currentItem);
  const itemDurationInSeconds = currentItem.durationInFrames / fps;
  const itemEnd = itemOffset + itemDurationInSeconds;

  // Expand and merge audible parts
  const mergedAudibleParts = expandAndMergeParts(audibleParts, paddingInSeconds, itemOffset, itemEnd);

  if (mergedAudibleParts.length === 0) {
    return { state, removedSegments: [], spliceResult: null };
  }

  // Convert to keep ranges
  const keepRanges = audiblePartsToKeepRanges(currentItem, mergedAudibleParts, fps);

  if (keepRanges.length === 0) {
    return { state, removedSegments: [], spliceResult: null };
  }

  // Use spliceItem to apply the changes
  const spliceOutput = spliceItem(state, {
    itemId,
    trackId: track.id,
    keepRanges,
    fps,
  });

  if (!spliceOutput) {
    return { state, removedSegments: [], spliceResult: null };
  }

  let newState = spliceOutput.state;
  const { result: spliceResult } = spliceOutput;

  // Shift following items if frames were removed
  if (spliceResult.totalRemovedFrames > 0) {
    const pivotFrame = currentItem.from + currentItem.durationInFrames;
    newState = shiftFollowingItems({
      trackIndex,
      pivotFrame,
      shiftBy: spliceResult.totalRemovedFrames,
    })(newState);
  }

  // Calculate removed segments for reporting
  const removedSegments = getRemovedSegments({
    item: currentItem,
    mergedAudibleParts,
    fps,
  });

  return { state: newState, removedSegments, spliceResult };
};
