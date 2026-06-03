import { IsAnImageError, parseMediaOnWebWorker } from '@remotion/media-parser/worker';
import { cacheAssetLocally } from '../caching/indexeddb';
import { setLocalUrl } from '../caching/load-to-blob-url';
import { generateRandomId } from '../utils/generate-random-id';
import { getSvgDimensions } from '../utils/get-svg-dimensions';
import { AudioAsset, EditorStarterAsset, GifAsset, ImageAsset, VideoAsset } from './assets';

export const makeAssetOnly = async ({
  file,
  filename,
  remoteUrl,
  remoteFileKey,
}: {
  file: Blob;
  filename: string;
  remoteUrl: string | null;
  remoteFileKey: string | null;
}): Promise<EditorStarterAsset> => {
  const assetId = generateRandomId();
  const url = URL.createObjectURL(file);
  setLocalUrl(assetId, url);

  await cacheAssetLocally({
    assetId: assetId,
    value: file,
  });

  try {
    const metadata = await parseMediaOnWebWorker({
      src: file,
      fields: {
        slowDurationInSeconds: true,
        dimensions: true,
        videoCodec: true,
        audioCodec: true,
      },
      acknowledgeRemotionLicense: true,
    });

    // Audio file
    if (metadata.videoCodec === null && metadata.audioCodec) {
      const asset: AudioAsset = {
        type: 'audio',
        id: assetId,
        filename,
        size: file.size,
        durationInSeconds: metadata.slowDurationInSeconds,
        mimeType: file.type,
        remoteUrl,
        remoteFileKey,
      };
      return asset;
    }

    // Video file
    if (!metadata.dimensions) {
      throw new Error('cannot get video dimensions');
    }

    const asset: VideoAsset = {
      type: 'video',
      id: assetId,
      filename,
      size: file.size,
      durationInSeconds: metadata.slowDurationInSeconds,
      width: metadata.dimensions.width,
      height: metadata.dimensions.height,
      hasAudioTrack: metadata.audioCodec !== null,
      mimeType: file.type,
      remoteUrl,
      remoteFileKey,
    };
    return asset;
  } catch (error) {
    if (error instanceof IsAnImageError) {
      // GIF
      if (error.imageType === 'gif') {
        const asset: GifAsset = {
          type: 'gif',
          id: assetId,
          filename,
          size: file.size,
          durationInSeconds: error.dimensions ? 3 : 3, // Default GIF duration
          width: error.dimensions?.width ?? 100,
          height: error.dimensions?.height ?? 100,
          mimeType: file.type,
          remoteUrl,
          remoteFileKey,
        };
        return asset;
      }

      // Regular image
      if (!error.dimensions) {
        throw new Error('Could not get dimensions for image');
      }

      const asset: ImageAsset = {
        type: 'image',
        id: assetId,
        filename,
        size: file.size,
        width: error.dimensions.width,
        height: error.dimensions.height,
        mimeType: file.type,
        remoteUrl,
        remoteFileKey,
      };
      return asset;
    }

    // SVG
    if (file.type === 'image/svg+xml') {
      const svgText = await file.text();
      const dimensions = getSvgDimensions(svgText);
      const asset: ImageAsset = {
        type: 'image',
        id: assetId,
        filename,
        size: file.size,
        width: dimensions.width,
        height: dimensions.height,
        mimeType: file.type,
        remoteUrl,
        remoteFileKey,
      };
      return asset;
    }

    // Re-throw the original error to preserve debugging information
    throw error;
  }
};
