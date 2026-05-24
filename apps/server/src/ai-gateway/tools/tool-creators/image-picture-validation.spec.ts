import type { DigestProjectStateRequest } from 'api-types';
import { validateImageUpdateRequest } from './image-picture-validation';

const createProjectState = (): DigestProjectStateRequest =>
  ({
    tracksInfo: { numberOfTracks: 1, tracks: [] },
    dimensionsInfo: { width: 1920, height: 1080 },
    projectItemsInfo: [
      {
        itemId: 'image-1',
        fileType: 'image',
        fileName: 'logo.png',
        mimeType: 'image/png',
        hasAudioTrack: false,
      },
      {
        itemId: 'video-1',
        fileType: 'video',
        fileName: 'clip.mp4',
        mimeType: 'video/mp4',
        hasAudioTrack: true,
      },
    ],
    selectedItemsInfo: [],
    fpsInfo: 30,
    assetsStatusInfo: [
      {
        assetId: 'image-ready',
        fileName: 'ready.png',
        fileType: 'image',
        status: 'ready',
        isOnTimeline: false,
        isReadyForPlacement: true,
      },
      {
        assetId: 'video-ready',
        fileName: 'ready.mp4',
        fileType: 'video',
        status: 'ready',
        isOnTimeline: false,
      },
      {
        assetId: 'image-uploading',
        fileName: 'uploading.png',
        fileType: 'image',
        status: 'uploading',
        isOnTimeline: false,
        isReadyForPlacement: false,
      },
    ],
    imageAssetsInfo: [
      {
        assetId: 'image-ready',
        fileName: 'ready.png',
        fileType: 'image',
        mimeType: 'image/png',
        status: 'ready',
        isReadyForPlacement: true,
        isOnTimeline: false,
      },
    ],
  }) as DigestProjectStateRequest;

describe('validateImageUpdateRequest', () => {
  it('keeps only image item IDs valid', () => {
    const result = validateImageUpdateRequest({
      itemIds: ['image-1', 'video-1', 'missing-1'],
      patch: {},
      projectState: createProjectState(),
    });

    expect(result.validItemIds).toEqual(['image-1']);
    expect(result.itemErrors).toEqual([
      { itemId: 'video-1', error: 'Item is not an image' },
      { itemId: 'missing-1', error: 'Item not found' },
    ]);
  });

  it('rejects replacement assets that are not ready images', () => {
    const nonImageResult = validateImageUpdateRequest({
      itemIds: ['image-1'],
      patch: { assetId: 'video-ready' },
      projectState: createProjectState(),
    });
    const uploadingResult = validateImageUpdateRequest({
      itemIds: ['image-1'],
      patch: { assetId: 'image-uploading' },
      projectState: createProjectState(),
    });

    expect(nonImageResult.assetError).toBe('Replacement asset is not an image');
    expect(uploadingResult.assetError).toBe('Replacement asset is not ready for placement');
  });

  it('allows ready replacement image assets', () => {
    const result = validateImageUpdateRequest({
      itemIds: ['image-1'],
      patch: { assetId: 'image-ready' },
      projectState: createProjectState(),
    });

    expect(result.validItemIds).toEqual(['image-1']);
    expect(result.assetError).toBeUndefined();
  });
});
