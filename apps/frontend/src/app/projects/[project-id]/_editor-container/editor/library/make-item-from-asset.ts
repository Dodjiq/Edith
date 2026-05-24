import { EditorStarterAsset } from '../assets/assets';
import { EditorStarterItem } from '../items/item-type';
import { VideoItem } from '../items/video/video-item-type';
import { AudioItem } from '../items/audio/audio-item-type';
import { ImageItem } from '../items/image/image-item-type';
import { GifItem } from '../items/gif/gif-item-type';
import { byDefaultKeepAspectRatioMap } from '../utils/aspect-ratio';
import { calculateMediaDimensionsForCanvas } from '../utils/dimension-utils';
import { generateRandomId } from '../utils/generate-random-id';

type MakeItemFromAssetOptions = {
  asset: EditorStarterAsset;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  currentFrame: number;
};

export const makeItemFromAsset = ({
  asset,
  fps,
  compositionWidth,
  compositionHeight,
  currentFrame,
}: MakeItemFromAssetOptions): EditorStarterItem => {
  const id = generateRandomId();

  switch (asset.type) {
    case 'video': {
      const durationInFrames = Math.floor(asset.durationInSeconds * fps);
      const { width, height, top, left } = calculateMediaDimensionsForCanvas({
        mediaWidth: asset.width,
        mediaHeight: asset.height,
        containerWidth: compositionWidth,
        containerHeight: compositionHeight,
        dropPosition: null,
      });

      const item: VideoItem = {
        id,
        durationInFrames,
        videoStartFromInSeconds: 0,
        from: currentFrame,
        type: 'video',
        assetId: asset.id,
        isDraggingInTimeline: false,
        top,
        left,
        width,
        height,
        opacity: 1,
        borderRadius: 0,
        rotation: 0,
        decibelAdjustment: 0,
        playbackRate: 1,
        audioFadeInDurationInSeconds: 0,
        audioFadeOutDurationInSeconds: 0,
        fadeInDurationInSeconds: 0,
        fadeOutDurationInSeconds: 0,
        keepAspectRatio: byDefaultKeepAspectRatioMap.video,
      };
      return item;
    }

    case 'audio': {
      const durationInFrames = Math.floor(asset.durationInSeconds * fps);
      const item: AudioItem = {
        id,
        durationInFrames,
        audioStartFromInSeconds: 0,
        from: currentFrame,
        type: 'audio',
        top: 0,
        left: 0,
        width: 100,
        height: 100,
        opacity: 1,
        decibelAdjustment: 0,
        playbackRate: 1,
        audioFadeInDurationInSeconds: 0,
        audioFadeOutDurationInSeconds: 0,
        assetId: asset.id,
        isDraggingInTimeline: false,
      };
      return item;
    }

    case 'image': {
      const durationInFrames = fps * 2; // Default 2 seconds for images
      const { width, height, top, left } = calculateMediaDimensionsForCanvas({
        mediaWidth: asset.width,
        mediaHeight: asset.height,
        containerWidth: compositionWidth,
        containerHeight: compositionHeight,
        dropPosition: null,
      });

      const item: ImageItem = {
        id,
        durationInFrames,
        top,
        left,
        width,
        height,
        from: currentFrame,
        type: 'image',
        opacity: 1,
        borderRadius: 0,
        rotation: 0,
        assetId: asset.id,
        isDraggingInTimeline: false,
        keepAspectRatio: byDefaultKeepAspectRatioMap.image,
        fadeInDurationInSeconds: 0,
        fadeOutDurationInSeconds: 0,
        objectFit: 'fill',
      };
      return item;
    }

    case 'gif': {
      const durationInFrames = Math.floor(asset.durationInSeconds * fps);
      const { width, height, top, left } = calculateMediaDimensionsForCanvas({
        mediaWidth: asset.width,
        mediaHeight: asset.height,
        containerWidth: compositionWidth,
        containerHeight: compositionHeight,
        dropPosition: null,
      });

      const item: GifItem = {
        id,
        durationInFrames,
        top,
        left,
        width,
        height,
        from: currentFrame,
        type: 'gif',
        opacity: 1,
        borderRadius: 0,
        rotation: 0,
        assetId: asset.id,
        isDraggingInTimeline: false,
        keepAspectRatio: byDefaultKeepAspectRatioMap.gif,
        fadeInDurationInSeconds: 0,
        fadeOutDurationInSeconds: 0,
        gifStartFromInSeconds: 0,
        playbackRate: 1,
      };
      return item;
    }

    case 'caption':
      throw new Error('Caption assets cannot be directly added to timeline');

    default:
      throw new Error(`Unknown asset type`);
  }
};
