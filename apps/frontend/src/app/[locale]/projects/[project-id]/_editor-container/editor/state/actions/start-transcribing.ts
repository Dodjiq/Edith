import { EditorStarterAsset } from '../../assets/assets';
import { EditorState } from '../types';

/**
 * Marks an asset as transcribing after S3 upload completes.
 * Updates the remoteUrl and remoteFileKey, and sets status to 'transcribing'.
 * The transcription will arrive via WebSocket and complete the upload.
 */
export const startTranscribing = ({
  state,
  asset,
  remoteUrl,
  remoteFileKey,
}: {
  state: EditorState;
  asset: EditorStarterAsset;
  remoteUrl: string;
  remoteFileKey: string;
}): EditorState => {
  // Look in both assets and libraryAssets (library-only assets won't be in assets)
  const existingAsset = state.undoableState.assets[asset.id] ?? state.undoableState.libraryAssets[asset.id];

  if (!existingAsset) {
    console.warn('[startTranscribing] Asset not found:', asset.id);
    return state;
  }

  const updatedAsset: EditorStarterAsset = {
    ...existingAsset,
    remoteUrl,
    remoteFileKey,
  };

  // Update in assets if present there
  const newAssets = state.undoableState.assets[asset.id]
    ? { ...state.undoableState.assets, [asset.id]: updatedAsset }
    : state.undoableState.assets;

  // Always update in libraryAssets (source of truth for all uploaded assets)
  const newLibraryAssets = state.undoableState.libraryAssets[asset.id]
    ? { ...state.undoableState.libraryAssets, [asset.id]: updatedAsset }
    : state.undoableState.libraryAssets;

  return {
    ...state,
    undoableState: {
      ...state.undoableState,
      assets: newAssets,
      libraryAssets: newLibraryAssets,
    },
    assetStatus: {
      ...state.assetStatus,
      [asset.id]: { type: 'transcribing' },
    },
  };
};
