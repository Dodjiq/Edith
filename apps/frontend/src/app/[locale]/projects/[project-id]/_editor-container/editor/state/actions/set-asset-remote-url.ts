import { EditorStarterAsset } from '../../assets/assets';
import { EditorState } from '../types';

/**
 * Updates the remote URL and file key for an asset and sets status to 'transcribing'.
 * Used when upload to S3 is complete but transcription is still pending.
 */
export const setAssetRemoteUrl = ({
  state,
  assetId,
  remoteUrl,
  remoteFileKey,
}: {
  state: EditorState;
  assetId: string;
  remoteUrl: string;
  remoteFileKey: string;
}): EditorState => {
  // Look in both assets and libraryAssets (library-only assets won't be in assets)
  const existingAsset = state.undoableState.assets[assetId] ?? state.undoableState.libraryAssets[assetId];

  if (!existingAsset) {
    console.warn('[setAssetRemoteUrl] Asset not found:', assetId);
    return state;
  }

  const updatedAsset: EditorStarterAsset = {
    ...existingAsset,
    remoteUrl,
    remoteFileKey,
  };

  // Update in assets if present there
  const newAssets = state.undoableState.assets[assetId]
    ? { ...state.undoableState.assets, [assetId]: updatedAsset }
    : state.undoableState.assets;

  // Always update in libraryAssets (source of truth for all uploaded assets)
  const newLibraryAssets = state.undoableState.libraryAssets[assetId]
    ? { ...state.undoableState.libraryAssets, [assetId]: updatedAsset }
    : state.undoableState.libraryAssets;

  return {
    ...state,
    undoableState: {
      ...state.undoableState,
      assets: newAssets,
      libraryAssets: newLibraryAssets,
    },
    // Set status to transcribing so UI shows the transcription phase
    assetStatus: {
      ...state.assetStatus,
      [assetId]: { type: 'transcribing' },
    },
  };
};
