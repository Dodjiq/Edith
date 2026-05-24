import { EditorStarterAsset } from '../../assets/assets';
import { EditorState } from '../types';

/** Add an asset to the library (not on timeline yet) */
export const addAssetToLibrary = ({ state, asset }: { state: EditorState; asset: EditorStarterAsset }): EditorState => {
  return {
    ...state,
    undoableState: {
      ...state.undoableState,
      libraryAssets: {
        ...state.undoableState.libraryAssets,
        [asset.id]: asset,
      },
    },
    assetStatus: {
      ...state.assetStatus,
      [asset.id]: { type: 'pending-upload' },
    },
  };
};

/** Remove an asset from the library (and from timeline if present) */
export const removeAssetFromLibrary = ({ state, assetId }: { state: EditorState; assetId: string }): EditorState => {
  const { [assetId]: removed, ...remainingLibraryAssets } = state.undoableState.libraryAssets;
  const { [assetId]: removedStatus, ...remainingAssetStatus } = state.assetStatus;
  // Also remove from timeline assets to maintain invariant (assets is subset of libraryAssets)
  const { [assetId]: removedTimelineAsset, ...remainingAssets } = state.undoableState.assets;

  return {
    ...state,
    undoableState: {
      ...state.undoableState,
      assets: remainingAssets,
      libraryAssets: remainingLibraryAssets,
    },
    assetStatus: remainingAssetStatus,
  };
};

/** Copy an asset from library to timeline assets (when placing on timeline) */
export const addLibraryAssetToTimeline = ({ state, assetId }: { state: EditorState; assetId: string }): EditorState => {
  const asset = state.undoableState.libraryAssets[assetId];
  if (!asset) {
    return state;
  }

  // Already on timeline
  if (state.undoableState.assets[assetId]) {
    return state;
  }

  return {
    ...state,
    undoableState: {
      ...state.undoableState,
      // Keep in libraryAssets (don't remove)
      assets: {
        ...state.undoableState.assets,
        [assetId]: asset,
      },
    },
  };
};

/** Update an asset in the library (and on timeline if present) */
export const updateLibraryAsset = ({
  state,
  assetId,
  updates,
}: {
  state: EditorState;
  assetId: string;
  updates: Partial<EditorStarterAsset>;
}): EditorState => {
  const asset = state.undoableState.libraryAssets[assetId];
  if (!asset) {
    return state;
  }

  const updatedAsset = { ...asset, ...updates } as EditorStarterAsset;

  // Also update in timeline assets if present (assets is a subset of libraryAssets)
  const timelineAsset = state.undoableState.assets[assetId];
  const newAssets = timelineAsset
    ? { ...state.undoableState.assets, [assetId]: updatedAsset }
    : state.undoableState.assets;

  return {
    ...state,
    undoableState: {
      ...state.undoableState,
      assets: newAssets,
      libraryAssets: {
        ...state.undoableState.libraryAssets,
        [assetId]: updatedAsset,
      },
    },
  };
};
