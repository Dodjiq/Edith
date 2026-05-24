'use client';

import { useCallback, useContext, useMemo } from 'react';
import { EditorStarterAsset } from '../assets/assets';
import { LibraryAssetsContext, AssetsContext } from '../context-provider';
import {
  addAssetToLibrary,
  addLibraryAssetToTimeline,
  removeAssetFromLibrary,
  updateLibraryAsset,
} from '../state/actions/library-assets';
import { useWriteContext } from '../utils/use-context';

/** Access library assets (all uploaded assets, superset of timeline assets) */
export const useLibraryAssets = () => {
  const context = useContext(LibraryAssetsContext);
  if (!context) {
    throw new Error('LibraryAssetsContext is not set');
  }
  return context;
};

/** Access all assets (library + timeline combined) for unified library view */
export const useAllProjectAssets = () => {
  const { libraryAssets } = useLibraryAssets();
  const assetsContext = useContext(AssetsContext);

  if (!assetsContext) {
    throw new Error('AssetsContext is not set');
  }

  return useMemo(
    () => ({
      libraryAssets,
      timelineAssets: assetsContext.assets,
      allAssets: { ...libraryAssets, ...assetsContext.assets },
    }),
    [libraryAssets, assetsContext.assets],
  );
};

/** Hook to manage library asset operations */
export const useLibraryAssetActions = () => {
  const { setState } = useWriteContext();

  const addToLibrary = useCallback(
    (asset: EditorStarterAsset) => {
      setState({
        update: (state) => addAssetToLibrary({ state, asset }),
        commitToUndoStack: true,
      });
    },
    [setState],
  );

  const removeFromLibrary = useCallback(
    (assetId: string) => {
      setState({
        update: (state) => removeAssetFromLibrary({ state, assetId }),
        commitToUndoStack: true,
      });
    },
    [setState],
  );

  const addToTimeline = useCallback(
    (assetId: string) => {
      setState({
        update: (state) => addLibraryAssetToTimeline({ state, assetId }),
        commitToUndoStack: false,
      });
    },
    [setState],
  );

  const updateAsset = useCallback(
    (assetId: string, updates: Partial<EditorStarterAsset>) => {
      setState({
        update: (state) => updateLibraryAsset({ state, assetId, updates }),
        commitToUndoStack: false,
      });
    },
    [setState],
  );

  return {
    addToLibrary,
    removeFromLibrary,
    addToTimeline,
    updateAsset,
  };
};
