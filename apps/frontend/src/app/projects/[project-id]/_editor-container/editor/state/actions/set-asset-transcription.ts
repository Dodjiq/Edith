import { Caption } from '@remotion/captions';
import { AudioAsset, VideoAsset } from '../../assets/assets';
import { EditorState } from '../types';

const isVideoAnalysisComplete = (asset: VideoAsset): boolean => {
  return Boolean(asset.summary) || Boolean(asset.summaryError);
};

/**
 * Updates the transcription for a video or audio asset and marks it as uploaded.
 * Called when transcription arrives via WebSocket after direct S3 upload.
 */
export const setAssetTranscription = ({
  state,
  assetId,
  transcription,
}: {
  state: EditorState;
  assetId: string;
  transcription: Caption[];
}): EditorState => {
  const existingAsset = state.undoableState.assets[assetId] ?? state.undoableState.libraryAssets[assetId];

  if (!existingAsset) {
    console.warn('[setAssetTranscription] Asset not found:', assetId);
    return state;
  }

  if (existingAsset.type !== 'video' && existingAsset.type !== 'audio') {
    console.warn('[setAssetTranscription] Asset type does not support transcription:', existingAsset.type);
    return state;
  }

  const updatedAsset: VideoAsset | AudioAsset = {
    ...existingAsset,
    transcription,
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
    assetStatus: {
      ...state.assetStatus,
      [assetId]:
        state.assetStatus[assetId]?.type === 'error' || state.assetStatus[assetId]?.type === 'uploaded'
          ? state.assetStatus[assetId]
          : updatedAsset.type === 'video' && !isVideoAnalysisComplete(updatedAsset)
            ? { type: 'transcribing' }
            : { type: 'uploaded' },
    },
  };
};
