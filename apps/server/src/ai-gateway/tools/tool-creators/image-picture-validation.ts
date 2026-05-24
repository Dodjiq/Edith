import type { DigestProjectStateRequest, ImageItemPatchInput } from 'api-types';

export type ImageItemValidationError = { itemId: string; error: string };

export const validateImageUpdateRequest = ({
  itemIds,
  patch,
  projectState,
}: {
  itemIds: string[];
  patch: ImageItemPatchInput;
  projectState?: DigestProjectStateRequest;
}) => {
  if (!projectState) {
    return { validItemIds: itemIds, itemErrors: [] as ImageItemValidationError[], assetError: undefined };
  }

  const knownItems = new Map(projectState.projectItemsInfo.map((item) => [item.itemId, item]));
  const itemErrors: ImageItemValidationError[] = [];
  const validItemIds: string[] = [];

  for (const itemId of itemIds) {
    const item = knownItems.get(itemId);
    if (!item) {
      itemErrors.push({ itemId, error: 'Item not found' });
      continue;
    }
    if (item.fileType !== 'image') {
      itemErrors.push({ itemId, error: 'Item is not an image' });
      continue;
    }
    validItemIds.push(itemId);
  }

  const assetError = (() => {
    if (!patch.assetId) return undefined;

    const imageAsset = projectState.imageAssetsInfo?.find((asset) => asset.assetId === patch.assetId);
    if (imageAsset) {
      return imageAsset.isReadyForPlacement ? undefined : 'Replacement asset is not ready for placement';
    }

    const assetStatus = projectState.assetsStatusInfo?.find((asset) => asset.assetId === patch.assetId);
    if (!assetStatus) return undefined;
    if (assetStatus.fileType !== 'image') return 'Replacement asset is not an image';
    return assetStatus.status === 'ready' ? undefined : 'Replacement asset is not ready for placement';
  })();

  return { validItemIds, itemErrors, assetError };
};
