import { EditorStarterAsset } from '../assets/assets';
import { EditorStarterItem } from '../items/item-type';
import { addItem } from '../state/actions/add-item';
import { EditorState, TrackType } from '../state/types';
import { findItemById } from '../utils/find-item-by-id';
import { generateRandomId } from '../utils/generate-random-id';
import { isTrackPositionBusy } from '../utils/is-track-position-busy';
import { makeItemFromAsset } from './make-item-from-asset';

export type PlaceLibraryAssetsMode = 'auto-track' | 'fixed-track-shift-right';

export type LibraryAssetTimelinePlacement = {
  assetId: string;
  itemId: string;
  trackId: string;
  fromFrame: number;
  durationInFrames: number;
};

export type PlaceLibraryAssetsOnTimelineResult = {
  state: EditorState;
  placements: LibraryAssetTimelinePlacement[];
  skippedAssetIds: string[];
  blockStartFrame: number | null;
};

const getDurationInFramesForAsset = ({ asset, fps }: { asset: EditorStarterAsset; fps: number }): number => {
  if (asset.type === 'image') {
    return fps * 2;
  }

  if (asset.type === 'video' || asset.type === 'audio' || asset.type === 'gif') {
    return Math.floor(asset.durationInSeconds * fps);
  }

  throw new Error('Caption assets cannot be placed on timeline');
};

const createTrack = (id: string): TrackType => {
  return {
    id,
    items: [],
    hidden: false,
    muted: false,
  };
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

export const placeLibraryAssetsOnTimelineWithNewItems = ({
  state,
  libraryAssetIds,
  startFrame,
  trackId,
  mode,
  selectNewItems,
}: {
  state: EditorState;
  libraryAssetIds: string[];
  startFrame: number;
  trackId?: string;
  mode: PlaceLibraryAssetsMode;
  selectNewItems?: boolean;
}): PlaceLibraryAssetsOnTimelineResult => {
  const fps = state.undoableState.fps;
  const compositionWidth = state.undoableState.compositionWidth;
  const compositionHeight = state.undoableState.compositionHeight;

  const normalizedIds = libraryAssetIds.map((id) => id.trim()).filter((id) => id.length > 0);
  const skippedAssetIds: string[] = [];
  const validAssets: EditorStarterAsset[] = [];

  for (const assetId of normalizedIds) {
    const asset = state.undoableState.libraryAssets[assetId];
    if (!asset) {
      skippedAssetIds.push(assetId);
      continue;
    }
    if (asset.type === 'caption') {
      skippedAssetIds.push(assetId);
      continue;
    }
    validAssets.push(asset);
  }

  if (validAssets.length === 0) {
    return {
      state,
      placements: [],
      skippedAssetIds,
      blockStartFrame: null,
    };
  }

  const timelineAssets: Record<string, EditorStarterAsset> = { ...state.undoableState.assets };
  for (const asset of validAssets) {
    if (!timelineAssets[asset.id]) {
      timelineAssets[asset.id] = asset;
    }
  }

  if (mode === 'auto-track') {
    let nextState: EditorState = {
      ...state,
      undoableState: {
        ...state.undoableState,
        assets: timelineAssets,
      },
    };

    const placements: LibraryAssetTimelinePlacement[] = [];
    const createdItemIds: string[] = [];
    let offsetFrames = 0;

    for (const asset of validAssets) {
      const item = makeItemFromAsset({
        asset,
        fps,
        compositionWidth,
        compositionHeight,
        currentFrame: Math.max(0, Math.round(startFrame + offsetFrames)),
      });

      offsetFrames += item.durationInFrames;

      nextState = addItem({
        state: nextState,
        item,
        select: false,
        position: { type: 'front' },
      });

      createdItemIds.push(item.id);

      const { trackIndex } = findItemById(nextState.undoableState.tracks, item.id);
      placements.push({
        assetId: asset.id,
        itemId: item.id,
        trackId: nextState.undoableState.tracks[trackIndex].id,
        fromFrame: item.from,
        durationInFrames: item.durationInFrames,
      });
    }

    const finalState: EditorState =
      selectNewItems && createdItemIds.length > 0
        ? { ...nextState, selectedItems: createdItemIds }
        : nextState;

    return {
      state: finalState,
      placements,
      skippedAssetIds,
      blockStartFrame: Math.max(0, Math.round(startFrame)),
    };
  }

  const durations = validAssets.map((asset) => getDurationInFramesForAsset({ asset, fps }));
  const totalDuration = durations.reduce((acc, d) => acc + d, 0);

  const baseTracks = [...state.undoableState.tracks];
  const items = state.undoableState.items;

  let targetTrackIndex = -1;

  if (trackId) {
    targetTrackIndex = baseTracks.findIndex((t) => t.id === trackId);
    if (targetTrackIndex === -1) {
      baseTracks.push(createTrack(trackId));
      targetTrackIndex = baseTracks.length - 1;
    }
  } else {
    if (baseTracks.length === 0) {
      baseTracks.push(createTrack(generateRandomId()));
    }
    targetTrackIndex = 0;
  }

  const blockStartFrame = resolveFreeStartFrameOnTrack({
    track: baseTracks[targetTrackIndex],
    items,
    startFrame,
    durationInFrames: totalDuration,
  });

  const placements: LibraryAssetTimelinePlacement[] = [];
  const createdItemIds: string[] = [];
  const updatedItems: Record<string, EditorStarterItem> = { ...items };
  const updatedTrackItems = [...baseTracks[targetTrackIndex].items];

  let runningOffset = 0;
  for (let i = 0; i < validAssets.length; i++) {
    const asset = validAssets[i];
    const durationInFrames = durations[i];
    const fromFrame = blockStartFrame + runningOffset;

    const item = makeItemFromAsset({
      asset,
      fps,
      compositionWidth,
      compositionHeight,
      currentFrame: fromFrame,
    });

    updatedItems[item.id] = item;
    updatedTrackItems.push(item.id);
    createdItemIds.push(item.id);
    placements.push({
      assetId: asset.id,
      itemId: item.id,
      trackId: baseTracks[targetTrackIndex].id,
      fromFrame,
      durationInFrames,
    });

    runningOffset += durationInFrames;
  }

  const updatedTracks = baseTracks.map((track, idx) => {
    if (idx !== targetTrackIndex) return track;
    return {
      ...track,
      items: updatedTrackItems,
    };
  });

  const nextState: EditorState = {
    ...state,
    undoableState: {
      ...state.undoableState,
      assets: timelineAssets,
      items: updatedItems,
      tracks: updatedTracks,
    },
    selectedItems: selectNewItems ? createdItemIds : state.selectedItems,
  };

  return {
    state: nextState,
    placements,
    skippedAssetIds,
    blockStartFrame,
  };
};
