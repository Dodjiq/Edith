import type { TranscriptionMetadata } from 'api-types';
import { AudioAsset, EditorStarterAsset, VideoAsset } from '../../assets/assets';
import { EditorState } from '../types';

const isVideoAnalysisComplete = (asset: VideoAsset): boolean => {
  return Boolean(asset.summary) || Boolean(asset.summaryError);
};

/**
 * Marks an asset as uploaded without adding transcription.
 * Used when transcription completes but returns no data (e.g., silent video).
 *
 * @param hasNoTranscription - True when asset was processed but has no speech (vs just skipped)
 */
export const finishUploadWithoutTranscription = ({
  state,
  assetId,
  hasNoTranscription = false,
  metadata,
}: {
  state: EditorState;
  assetId: string;
  hasNoTranscription?: boolean;
  metadata?: TranscriptionMetadata;
}): EditorState => {
  // If hasNoTranscription, update the asset to mark it
  let newAssets = state.undoableState.assets;
  let newLibraryAssets = state.undoableState.libraryAssets;

  if (hasNoTranscription || metadata) {
    const existingAsset: EditorStarterAsset | undefined =
      state.undoableState.assets[assetId] ?? state.undoableState.libraryAssets[assetId];

    if (existingAsset && (existingAsset.type === 'video' || existingAsset.type === 'audio')) {
      const updatedAsset: VideoAsset | AudioAsset = {
        ...existingAsset,
        ...(hasNoTranscription ? { hasNoTranscription: true } : {}),
        ...(metadata ? { transcriptionMetadata: metadata } : {}),
      };

      if (state.undoableState.assets[assetId]) {
        newAssets = { ...state.undoableState.assets, [assetId]: updatedAsset };
      }
      if (state.undoableState.libraryAssets[assetId]) {
        newLibraryAssets = { ...state.undoableState.libraryAssets, [assetId]: updatedAsset };
      }
    }
  }

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
          : (() => {
              const asset = newAssets[assetId] ?? newLibraryAssets[assetId];
              if (asset?.type === 'video' && !isVideoAnalysisComplete(asset)) {
                return { type: 'transcribing' } as const;
              }
              return { type: 'uploaded' } as const;
            })(),
    },
  };
};
