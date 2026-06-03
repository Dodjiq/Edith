import type { TwelveLabsVideoReference, VideoAnalysisSummary } from 'api-types';
import { VideoAsset } from '../../assets/assets';
import { EditorState } from '../types';

const isVideoAnalysisComplete = (asset: VideoAsset): boolean => {
  return Boolean(asset.summary) || Boolean(asset.summaryError);
};

const isTranscriptionComplete = (asset: VideoAsset): boolean => {
  return Boolean(asset.transcription) || asset.hasNoTranscription === true;
};

export const setAssetVideoAnalysisSummary = ({
  state,
  assetId,
  twelveLabs,
  summary,
  error,
}: {
  state: EditorState;
  assetId: string;
  twelveLabs?: TwelveLabsVideoReference;
  summary?: VideoAnalysisSummary;
  error?: string;
}): EditorState => {
  const existingAsset = state.undoableState.assets[assetId] ?? state.undoableState.libraryAssets[assetId];

  if (!existingAsset) {
    console.warn('[setAssetVideoAnalysisSummary] Asset not found:', assetId);
    return state;
  }

  if (existingAsset.type !== 'video') {
    console.warn('[setAssetVideoAnalysisSummary] Asset type does not support video analysis:', existingAsset.type);
    return state;
  }

  const updatedAsset: VideoAsset = {
    ...existingAsset,
    twelveLabs: twelveLabs ?? existingAsset.twelveLabs,
    summary: summary ?? existingAsset.summary,
    summaryError: error ?? existingAsset.summaryError,
  };

  const newAssets = state.undoableState.assets[assetId]
    ? { ...state.undoableState.assets, [assetId]: updatedAsset }
    : state.undoableState.assets;

  const newLibraryAssets = state.undoableState.libraryAssets[assetId]
    ? { ...state.undoableState.libraryAssets, [assetId]: updatedAsset }
    : state.undoableState.libraryAssets;

  const currentStatus = state.assetStatus[assetId];
  const shouldPreserveError = currentStatus?.type === 'error';
  const canMarkUploaded =
    !shouldPreserveError && isTranscriptionComplete(updatedAsset) && isVideoAnalysisComplete(updatedAsset);

  return {
    ...state,
    undoableState: {
      ...state.undoableState,
      assets: newAssets,
      libraryAssets: newLibraryAssets,
    },
    assetStatus: {
      ...state.assetStatus,
      [assetId]: canMarkUploaded ? { type: 'uploaded' } : currentStatus ?? { type: 'transcribing' },
    },
  };
};
