import type { ImageItemInput, ImageItemPatchInput } from 'api-types';
import type { EditorStarterAsset } from '../assets/assets';
import type { ImageItem } from '../items/image/image-item-type';
import type { EditorStarterItem } from '../items/item-type';

export const resolveFramePair = ({
  frame,
  seconds,
  fps,
  fallback,
  label,
}: {
  frame?: number;
  seconds?: number;
  fps: number;
  fallback: number;
  label: string;
}): number => {
  if (frame !== undefined && seconds !== undefined) {
    const secondsFrame = Math.round(seconds * fps);
    if (Math.round(frame) !== secondsFrame) {
      throw new Error(`${label} frame and seconds values do not match`);
    }
  }

  if (frame !== undefined) return Math.max(0, Math.round(frame));
  if (seconds !== undefined) return Math.max(0, Math.round(seconds * fps));
  return fallback;
};

export const isReadyImageAsset = (
  asset: EditorStarterAsset | undefined,
  statusType?: string,
): asset is EditorStarterAsset & { type: 'image' } => {
  if (!asset || asset.type !== 'image') return false;
  return statusType === undefined || statusType === 'uploaded';
};

export const applyImageStyle = ({
  item,
  input,
}: {
  item: ImageItem;
  input: ImageItemInput | { style?: ImageItemPatchInput; xOnCanvas?: number; yOnCanvas?: number };
}): ImageItem => {
  const style = input.style;
  const width = style?.width ?? item.width;
  const height = style?.height ?? item.height;
  const left = style?.left ?? (input.xOnCanvas !== undefined ? input.xOnCanvas - width / 2 : item.left);
  const top = style?.top ?? (input.yOnCanvas !== undefined ? input.yOnCanvas - height / 2 : item.top);

  return {
    ...item,
    left,
    top,
    width,
    height,
    opacity: style?.opacity ?? item.opacity,
    rotation: style?.rotation ?? item.rotation,
    borderRadius: style?.borderRadius ?? item.borderRadius,
    keepAspectRatio: style?.keepAspectRatio ?? item.keepAspectRatio,
    fadeInDurationInSeconds: style?.fadeInDurationInSeconds ?? item.fadeInDurationInSeconds,
    fadeOutDurationInSeconds: style?.fadeOutDurationInSeconds ?? item.fadeOutDurationInSeconds,
    objectFit: style?.objectFit ?? item.objectFit ?? 'fill',
  };
};

export const isImageItem = (item: EditorStarterItem | undefined): item is ImageItem => item?.type === 'image';
