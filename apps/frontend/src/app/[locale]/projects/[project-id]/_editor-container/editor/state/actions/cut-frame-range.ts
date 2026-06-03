import { EditorStarterItem } from '../../items/item-type';
import { removeEmptyTracks } from '../../utils/remove-empty-tracks';
import { EditorState, TrackType } from '../types';
import { setSelectedItems } from './set-selected-items';
import { spliceItem, buildKeepRangesFromCuts, SpliceItemResult } from './splice-item';

type CutFrameRangeResult = {
  state: EditorState;
  deletedItemIds: string[];
  trimmedItemIds: string[];
  affectedItemCount: number;
  /** Detailed info about each item that was spliced */
  spliceResults: SpliceItemResult[];
};

/**
 * Cut/remove content from a specific track between startFrame and endFrame.
 * Items fully inside the range are deleted.
 * Items partially overlapping are trimmed (split and the overlapping portion removed).
 * All items after endFrame are shifted backward to close the gap (ripple delete).
 */
export const cutFrameRange = ({
  state,
  trackId,
  startFrame,
  endFrame,
}: {
  state: EditorState;
  trackId: string;
  startFrame: number;
  endFrame: number;
}): CutFrameRangeResult => {
  if (startFrame >= endFrame) {
    return { state, deletedItemIds: [], trimmedItemIds: [], affectedItemCount: 0, spliceResults: [] };
  }

  const { tracks, items, fps } = state.undoableState;
  const trackIndex = tracks.findIndex((track) => track.id === trackId);

  if (trackIndex === -1) {
    return { state, deletedItemIds: [], trimmedItemIds: [], affectedItemCount: 0, spliceResults: [] };
  }

  const track = tracks[trackIndex];
  const cutDuration = endFrame - startFrame;

  const deletedItemIds: string[] = [];
  const trimmedItemIds: string[] = [];
  const spliceResults: SpliceItemResult[] = [];
  let currentState = state;
  const itemsToShift: string[] = [];
  const processedItemIds: string[] = [];

  // Process each item in the track
  for (const itemId of track.items) {
    const item = items[itemId];
    if (!item) continue;

    const itemStart = item.from;
    const itemEnd = itemStart + item.durationInFrames;

    // Case 1: Item is completely before the cut range - keep as is
    if (itemEnd <= startFrame) {
      processedItemIds.push(itemId);
      continue;
    }

    // Case 2: Item is completely after the cut range - shift backward
    if (itemStart >= endFrame) {
      itemsToShift.push(itemId);
      processedItemIds.push(itemId);
      continue;
    }

    // Case 3: Item is fully inside the cut range - delete it
    if (itemStart >= startFrame && itemEnd <= endFrame) {
      deletedItemIds.push(itemId);
      spliceResults.push({
        sourceItem: item,
        createdItems: [],
        totalRemovedFrames: item.durationInFrames,
      });
      continue;
    }

    // Cases 4, 5, 6: Item overlaps the cut range - use spliceItem
    const keepRanges = buildKeepRangesFromCuts(itemStart, item.durationInFrames, startFrame, endFrame);

    if (keepRanges.length === 0) {
      // Entirely cut - treat as deleted
      deletedItemIds.push(itemId);
      spliceResults.push({
        sourceItem: item,
        createdItems: [],
        totalRemovedFrames: item.durationInFrames,
      });
      continue;
    }

    const spliceResult = spliceItem(currentState, {
      itemId,
      trackId,
      keepRanges,
      fps,
    });

    if (spliceResult) {
      currentState = spliceResult.state;
      spliceResults.push(spliceResult.result);
      trimmedItemIds.push(...spliceResult.result.createdItems.map((i) => i.id));

      // Add created items to processed list
      // NOTE: Do NOT add splice-created items to itemsToShift.
      // buildKeepRangesFromCuts already positions them correctly for ripple delete.
      for (const createdItem of spliceResult.result.createdItems) {
        processedItemIds.push(createdItem.id);
      }
    }
  }

  // Remove deleted items from state
  const newItems: Record<string, EditorStarterItem> = { ...currentState.undoableState.items };
  for (const id of deletedItemIds) {
    delete newItems[id];
  }

  // Shift items that are after the cut range or are right-side pieces
  for (const itemId of itemsToShift) {
    const item = newItems[itemId];
    if (item && item.from >= startFrame) {
      newItems[itemId] = {
        ...item,
        from: item.from - cutDuration,
      };
    }
  }

  // Build new track item list (remove deleted items)
  const currentTrack = currentState.undoableState.tracks[trackIndex];
  const newTrackItemIds = currentTrack.items.filter((id) => !deletedItemIds.includes(id));

  // Build new tracks array
  const newTracks: TrackType[] = currentState.undoableState.tracks.map((t, index) => {
    if (index !== trackIndex) return t;
    return { ...t, items: newTrackItemIds };
  });

  // Remove empty tracks
  const cleanedTracks = removeEmptyTracks(newTracks);

  // Update selected items: remove deleted items from selection
  const newSelectedItems = currentState.selectedItems.filter(
    (id) => !deletedItemIds.includes(id) && newItems[id],
  );

  const newState = setSelectedItems(
    {
      ...currentState,
      undoableState: {
        ...currentState.undoableState,
        tracks: cleanedTracks,
        items: newItems,
      },
    },
    newSelectedItems,
  );

  return {
    state: newState,
    deletedItemIds,
    trimmedItemIds,
    affectedItemCount: deletedItemIds.length + trimmedItemIds.length,
    spliceResults,
  };
};
