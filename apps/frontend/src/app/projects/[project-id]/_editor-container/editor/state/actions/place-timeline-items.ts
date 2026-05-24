import { EditorStarterItem } from '../../items/item-type';
import { generateRandomId } from '../../utils/generate-random-id';
import { isTrackPositionBusy } from '../../utils/is-track-position-busy';
import { EditorState, TrackType } from '../types';

export type TimelineItemPlacement = {
  itemId: string;
  trackId: string;
  fromFrame: number;
  durationInFrames: number;
};

export type PlaceTimelineItemsResult = {
  state: EditorState;
  placements: TimelineItemPlacement[];
  skippedItemIds: string[];
  blockStartFrame: number | null;
  trackIdUsed: string | null;
};

const createTrack = (id: string): TrackType => {
  return {
    id,
    items: [],
    hidden: false,
    muted: false,
  };
};

const removeItemsFromTracks = ({
  tracks,
  itemIds,
}: {
  tracks: TrackType[];
  itemIds: Set<string>;
}): TrackType[] => {
  return tracks.map((track) => {
    const nextItems = track.items.filter((id) => !itemIds.has(id));
    if (nextItems.length === track.items.length) {
      return track;
    }
    return {
      ...track,
      items: nextItems,
    };
  });
};

const resolveFreeStartFrameOnTrack = ({
  track,
  items,
  startFrame,
  durationInFrames,
}: {
  track: TrackType;
  items: Record<string, EditorStarterItem>;
  startFrame: number;
  durationInFrames: number;
}): number => {
  let candidate = Math.max(0, Math.round(startFrame));
  const maxIterations = Math.max(10, track.items.length + 5);

  for (let i = 0; i < maxIterations; i++) {
    const collisionItemId = isTrackPositionBusy({
      track,
      startAt: candidate,
      durationInFrames,
      items,
    });

    if (!collisionItemId) {
      return candidate;
    }

    const collisionItem = items[collisionItemId];
    candidate = collisionItem.from + collisionItem.durationInFrames;
  }

  return candidate;
};

export const placeTimelineItems = ({
  state,
  itemIds,
  startFrame,
  trackId,
  selectMovedItems,
}: {
  state: EditorState;
  itemIds: string[];
  startFrame: number;
  trackId?: string;
  selectMovedItems?: boolean;
}): PlaceTimelineItemsResult => {
  const normalizedIds = itemIds.map((id) => id.trim()).filter((id) => id.length > 0);
  const uniqueIds = Array.from(new Set(normalizedIds));

  const skippedItemIds: string[] = [];
  const candidates: { itemId: string; item: EditorStarterItem }[] = [];

  for (const itemId of uniqueIds) {
    const item = state.undoableState.items[itemId];
    if (!item) {
      skippedItemIds.push(itemId);
      continue;
    }
    candidates.push({ itemId, item });
  }

  if (candidates.length === 0) {
    return {
      state,
      placements: [],
      skippedItemIds,
      blockStartFrame: null,
      trackIdUsed: null,
    };
  }

  const ordered = [...candidates].sort((a, b) => a.item.from - b.item.from);
  const itemsToMove = new Set(ordered.map((c) => c.itemId));

  const baseTracks = removeItemsFromTracks({
    tracks: state.undoableState.tracks,
    itemIds: itemsToMove,
  });

  const resolveFallbackTrackId = () => {
    const firstItemId = ordered[0].itemId;
    const originalTrack = state.undoableState.tracks.find((t) => t.items.includes(firstItemId));
    if (originalTrack) return originalTrack.id;
    return baseTracks[0]?.id ?? null;
  };

  const desiredTrackId = trackId ?? resolveFallbackTrackId() ?? generateRandomId();
  let targetTrackIndex = baseTracks.findIndex((t) => t.id === desiredTrackId);

  const tracks = targetTrackIndex === -1 ? [...baseTracks, createTrack(desiredTrackId)] : baseTracks;
  if (targetTrackIndex === -1) {
    targetTrackIndex = tracks.length - 1;
  }

  const totalDuration = ordered.reduce((acc, c) => acc + c.item.durationInFrames, 0);
  const blockStartFrame = resolveFreeStartFrameOnTrack({
    track: tracks[targetTrackIndex],
    items: state.undoableState.items,
    startFrame,
    durationInFrames: totalDuration,
  });

  const newItems: Record<string, EditorStarterItem> = { ...state.undoableState.items };
  const placements: TimelineItemPlacement[] = [];

  let runningOffset = 0;
  for (const { itemId, item } of ordered) {
    const fromFrame = blockStartFrame + runningOffset;

    const nextItem: EditorStarterItem = {
      ...item,
      from: fromFrame,
      isDraggingInTimeline: false,
    };

    newItems[itemId] = nextItem;

    placements.push({
      itemId,
      trackId: tracks[targetTrackIndex].id,
      fromFrame,
      durationInFrames: item.durationInFrames,
    });

    runningOffset += item.durationInFrames;
  }

  const nextTrackItems = [...tracks[targetTrackIndex].items, ...ordered.map((c) => c.itemId)];
  nextTrackItems.sort((a, b) => newItems[a].from - newItems[b].from);

  const newTracks = tracks.map((t, idx) => {
    if (idx !== targetTrackIndex) return t;
    return {
      ...t,
      items: nextTrackItems,
    };
  });

  const movedIds = ordered.map((c) => c.itemId);

  return {
    state: {
      ...state,
      undoableState: {
        ...state.undoableState,
        tracks: newTracks,
        items: newItems,
      },
      selectedItems: selectMovedItems ? movedIds : state.selectedItems,
    },
    placements,
    skippedItemIds,
    blockStartFrame,
    trackIdUsed: newTracks[targetTrackIndex]?.id ?? null,
  };
};

