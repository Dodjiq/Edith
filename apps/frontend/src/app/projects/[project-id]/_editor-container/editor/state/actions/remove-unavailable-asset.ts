import { EditorStarterItem } from '../../items/item-type';
import { removeEmptyTracks } from '../../utils/remove-empty-tracks';
import { EditorState } from '../types';
import { setSelectedItems } from './set-selected-items';

const isAssetBackedItem = (item: EditorStarterItem): item is EditorStarterItem & { assetId: string } => {
  return 'assetId' in item;
};

export const removeUnavailableAsset = ({
  state,
  assetId,
}: {
  state: EditorState;
  assetId: string;
}): EditorState => {
  const itemIdsToRemove = Object.values(state.undoableState.items)
    .filter((item) => isAssetBackedItem(item) && item.assetId === assetId)
    .map((item) => item.id);

  const hasLibraryAsset = Boolean(state.undoableState.libraryAssets[assetId]);
  const hasTimelineAsset = Boolean(state.undoableState.assets[assetId]);

  if (!hasLibraryAsset && !hasTimelineAsset && itemIdsToRemove.length === 0) {
    return state;
  }

  const nextTracks = removeEmptyTracks(
    state.undoableState.tracks.map((track) => {
      const nextItemIds = track.items.filter((itemId) => !itemIdsToRemove.includes(itemId));

      if (nextItemIds.length === track.items.length) {
        return track;
      }

      return {
        ...track,
        items: nextItemIds,
      };
    }),
  );

  const nextItems = { ...state.undoableState.items };
  itemIdsToRemove.forEach((itemId) => {
    delete nextItems[itemId];
  });

  const nextLibraryAssets = { ...state.undoableState.libraryAssets };
  const nextAssets = { ...state.undoableState.assets };
  const nextAssetStatus = { ...state.assetStatus };

  delete nextLibraryAssets[assetId];
  delete nextAssets[assetId];
  delete nextAssetStatus[assetId];

  const nextDeletedAssets = state.undoableState.deletedAssets.filter((deletedAsset) => deletedAsset.assetId !== assetId);
  const nextSelectedItems = state.selectedItems.filter((itemId) => !itemIdsToRemove.includes(itemId));

  return setSelectedItems(
    {
      ...state,
      undoableState: {
        ...state.undoableState,
        tracks: nextTracks,
        items: nextItems,
        assets: nextAssets,
        libraryAssets: nextLibraryAssets,
        deletedAssets: nextDeletedAssets,
      },
      assetStatus: nextAssetStatus,
    },
    nextSelectedItems,
  );
};
