import type { Caption } from '@remotion/captions';
import { AudioAsset, EditorStarterAsset, VideoAsset } from '../../../assets/assets';
import { AudioItem } from '../../../items/audio/audio-item-type';
import { EditorStarterItem } from '../../../items/item-type';
import { VideoItem } from '../../../items/video/video-item-type';
import { generateRandomId } from '../../../utils/generate-random-id';
import { EditorState } from '../../types';
import { getSourceOffsetInSeconds, setSourceOffsetInSeconds } from './adjust-source-offset';
import { framesToMs, sliceTranscription } from './slice-transcription';
import { KeepRange, SpliceItemParams, SpliceItemResult } from './types';

type TranscribableItem = VideoItem | AudioItem;
type TranscribableAsset = VideoAsset | AudioAsset;

type GetItemTranscriptionParams = {
  item: EditorStarterItem;
  assets: Record<string, EditorStarterAsset>;
  fps: number;
};

/**
 * Gets transcription for a video/audio item, normalized to item-portion coordinates.
 *
 * Priority: item.transcription > asset.transcription
 *
 * When using asset transcription, it's converted from file-relative to item-portion-relative
 * by accounting for the item's sourceOffset and duration.
 *
 * sourceOffset: The starting point within the original source file (asset).
 * Example: A 60s asset trimmed to show seconds 10-40 has sourceOffset=10s, duration=30s.
 * The transcription is sliced to only include words within that 10-40s window,
 * then shifted so timestamps start at 0 (relative to item start).
 *
 * Returns transcription where 0 = start of what this item shows.
 */
const getItemTranscription = ({ item, assets, fps }: GetItemTranscriptionParams): Caption[] | null => {
  if (item.type !== 'video' && item.type !== 'audio') {
    return null;
  }

  const transcribableItem = item as TranscribableItem;

  // Priority 1: Item has its own transcription (already item-portion-relative from previous splice)
  if (transcribableItem.transcription && transcribableItem.transcription.length > 0) {
    return transcribableItem.transcription;
  }

  // Priority 2: Asset has transcription (file-relative, needs conversion)
  const asset = assets[transcribableItem.assetId];
  if (!asset || (asset.type !== 'video' && asset.type !== 'audio')) {
    return null;
  }

  const transcribableAsset = asset as TranscribableAsset;
  if (!transcribableAsset.transcription || transcribableAsset.transcription.length === 0) {
    return null;
  }

  // Convert asset transcription (file-relative) to item-portion coordinates
  // Always slice to filter by both sourceOffset AND duration
  const sourceOffsetMs = getSourceOffsetInSeconds(item) * 1000;
  const durationMs = framesToMs(item.durationInFrames, fps);

  return sliceTranscription(transcribableAsset.transcription, sourceOffsetMs, durationMs);
};

/**
 * Sets transcription on a video/audio item.
 */
const setItemTranscription = (item: EditorStarterItem, transcription: Caption[]): EditorStarterItem => {
  if (item.type === 'video') {
    return { ...item, transcription } as VideoItem;
  }
  if (item.type === 'audio') {
    return { ...item, transcription } as AudioItem;
  }
  return item;
};

type CreateItemFromRangeParams = {
  sourceItem: EditorStarterItem;
  range: KeepRange;
  fps: number;
  parentTranscription: Caption[] | null;
  /** True if the source asset/item has no transcription (no speech detected) */
  hasNoTranscription?: boolean;
};

/**
 * Sets hasNoTranscription flag on a video/audio item.
 */
const setItemHasNoTranscription = (item: EditorStarterItem, hasNoTranscription: boolean): EditorStarterItem => {
  if (item.type === 'video') {
    return { ...item, hasNoTranscription } as VideoItem;
  }
  if (item.type === 'audio') {
    return { ...item, hasNoTranscription } as AudioItem;
  }
  return item;
};

/**
 * Creates a new item from a keep range, adjusting source offset and slicing transcription.
 */
const createItemFromRange = ({
  sourceItem,
  range,
  fps,
  parentTranscription,
  hasNoTranscription,
}: CreateItemFromRangeParams): EditorStarterItem => {
  const originalSourceOffset = getSourceOffsetInSeconds(sourceItem);
  const rangeSourceOffsetInSeconds = range.sourceOffsetInFrames / fps;
  const newSourceOffsetInSeconds = originalSourceOffset + rangeSourceOffsetInSeconds;

  let newItem: EditorStarterItem = {
    ...sourceItem,
    id: generateRandomId(),
    from: range.timelineStartFrame,
    durationInFrames: range.durationInFrames,
  };

  newItem = setSourceOffsetInSeconds(newItem, newSourceOffsetInSeconds);

  // Slice transcription for the new item
  if (parentTranscription && parentTranscription.length > 0) {
    const rangeStartMs = framesToMs(range.sourceOffsetInFrames, fps);
    const rangeDurationMs = framesToMs(range.durationInFrames, fps);
    const slicedTranscription = sliceTranscription(parentTranscription, rangeStartMs, rangeDurationMs);

    if (slicedTranscription.length > 0) {
      newItem = setItemTranscription(newItem, slicedTranscription);
    } else {
      // Parent had transcription but this slice has no words (silent portion).
      // Mark as hasNoTranscription so we don't trigger unnecessary re-transcription.
      newItem = setItemHasNoTranscription(newItem, true);
    }
  }

  // Preserve hasNoTranscription flag from source
  if (hasNoTranscription) {
    newItem = setItemHasNoTranscription(newItem, true);
  }

  return newItem;
};

/**
 * Splices an item by keeping only the specified frame ranges.
 * This is a pure function that operates on the state and returns a new state.
 *
 * The function:
 * 1. Removes the original item from state
 * 2. Creates new items for each keep range
 * 3. Updates the track to reference the new items
 * 4. Returns info about the source item and created items
 *
 * Note: This does NOT shift following items. Use shiftFollowingItems separately if needed.
 */
export const spliceItem = (
  state: EditorState,
  params: SpliceItemParams,
): { state: EditorState; result: SpliceItemResult } | null => {
  const { itemId, trackId, keepRanges, fps } = params;
  const { tracks, items, assets } = state.undoableState;

  const sourceItem = items[itemId];
  if (!sourceItem) {
    return null;
  }

  const trackIndex = tracks.findIndex((t) => t.id === trackId);
  if (trackIndex === -1) {
    return null;
  }

  const track = tracks[trackIndex];
  if (!track.items.includes(itemId)) {
    return null;
  }

  const sortedRanges = [...keepRanges].sort((a, b) => a.timelineStartFrame - b.timelineStartFrame);

  // Get parent transcription for slicing (from item or asset, normalized to item-portion coordinates)
  const parentTranscription = getItemTranscription({ item: sourceItem, assets, fps });

  // Check if source item or asset has hasNoTranscription flag
  let hasNoTranscription = false;
  if (sourceItem.type === 'video' || sourceItem.type === 'audio') {
    const itemFlag = 'hasNoTranscription' in sourceItem ? sourceItem.hasNoTranscription : undefined;
    const asset = assets[sourceItem.assetId];
    const assetFlag =
      asset && (asset.type === 'video' || asset.type === 'audio') ? asset.hasNoTranscription : undefined;
    hasNoTranscription = itemFlag === true || assetFlag === true;
  }

  const createdItems: EditorStarterItem[] = sortedRanges.map((range) =>
    createItemFromRange({ sourceItem, range, fps, parentTranscription, hasNoTranscription }),
  );

  const originalDuration = sourceItem.durationInFrames;
  const keptFrames = sortedRanges.reduce((sum, range) => sum + range.durationInFrames, 0);
  const totalRemovedFrames = originalDuration - keptFrames;

  const newItems: Record<string, EditorStarterItem> = { ...items };
  delete newItems[itemId];
  for (const item of createdItems) {
    newItems[item.id] = item;
  }

  const createdItemIds = createdItems.map((item) => item.id);
  const newTrackItems = track.items.flatMap((id) => (id === itemId ? createdItemIds : [id]));

  const newTracks = tracks.map((t, idx) => (idx === trackIndex ? { ...t, items: newTrackItems } : t));

  const newSelectedItems = state.selectedItems
    .filter((id) => id !== itemId)
    .concat(createdItems.length > 0 ? [createdItems[0].id] : []);

  const newState: EditorState = {
    ...state,
    undoableState: {
      ...state.undoableState,
      items: newItems,
      tracks: newTracks,
    },
    selectedItems: newSelectedItems,
  };

  return {
    state: newState,
    result: {
      sourceItem,
      createdItems,
      totalRemovedFrames,
    },
  };
};

/**
 * Helper to build keep ranges from "cut" ranges (frame ranges to remove).
 * Converts ranges to remove into ranges to keep.
 */
export const buildKeepRangesFromCuts = (
  itemFrom: number,
  itemDurationInFrames: number,
  cutStartFrame: number,
  cutEndFrame: number,
): KeepRange[] => {
  const itemEnd = itemFrom + itemDurationInFrames;
  const keepRanges: KeepRange[] = [];

  const effectiveCutStart = Math.max(cutStartFrame, itemFrom);
  const effectiveCutEnd = Math.min(cutEndFrame, itemEnd);

  if (effectiveCutStart >= effectiveCutEnd || effectiveCutStart >= itemEnd || effectiveCutEnd <= itemFrom) {
    return [
      {
        timelineStartFrame: itemFrom,
        sourceOffsetInFrames: 0,
        durationInFrames: itemDurationInFrames,
      },
    ];
  }

  if (effectiveCutStart > itemFrom) {
    keepRanges.push({
      timelineStartFrame: itemFrom,
      sourceOffsetInFrames: 0,
      durationInFrames: effectiveCutStart - itemFrom,
    });
  }

  if (effectiveCutEnd < itemEnd) {
    const rightPartSourceOffset = effectiveCutEnd - itemFrom;
    // When there's a left part, right part goes at effectiveCutStart (adjacent to left part).
    // When there's no left part (item starts inside cut), right part goes at cutStartFrame for ripple delete.
    const hasLeftPart = effectiveCutStart > itemFrom;
    keepRanges.push({
      timelineStartFrame: hasLeftPart ? effectiveCutStart : cutStartFrame,
      sourceOffsetInFrames: rightPartSourceOffset,
      durationInFrames: itemEnd - effectiveCutEnd,
    });
  }

  return keepRanges;
};
