import { useCallback } from 'react';
import api from '@/utils/services/api-frontend';
import { Caption, editorToolNames, getMotionDesignTimingCheck, type MotionDesignTimingCheck } from 'api-types';
import { CaptionAsset, EditorStarterAsset } from '../assets/assets';
import { AudioItem } from '../items/audio/audio-item-type';
import { CaptionsItem } from '../items/captions/captions-item-type';
import { GifItem } from '../items/gif/gif-item-type';
import { ImageItem } from '../items/image/image-item-type';
import { EditorStarterItem } from '../items/item-type';
import { MotionDesignItem } from '../items/motion-design/motion-design-item-type';
import { SolidItem } from '../items/solid/solid-item-type';
import { TextItem } from '../items/text/text-item-type';
import { VideoItem } from '../items/video/video-item-type';
import { useAllItems, useAssets, useFps } from '../utils/use-context';

type GetItemsDataOptions = {
  itemIds: string[];
  toolCallId?: string;
};

// Base item data that all items share
type BaseItemData = {
  id: string;
  type: string;
  from: number;
  durationInFrames: number;
  durationInSeconds: number;
  startInSeconds: number;
  endInSeconds: number;
  left: number;
  top: number;
  width: number;
  height: number;
  opacity: number;
};

// Type-specific item data
type VideoItemData = BaseItemData & {
  type: 'video';
  videoStartFromInSeconds: number;
  decibelAdjustment: number;
  playbackRate: number;
  audioFadeInDurationInSeconds: number;
  audioFadeOutDurationInSeconds: number;
  fadeInDurationInSeconds: number;
  fadeOutDurationInSeconds: number;
  borderRadius: number;
  rotation: number;
  keepAspectRatio: boolean;
  assetId: string;
};

type AudioItemData = BaseItemData & {
  type: 'audio';
  audioStartFromInSeconds: number;
  decibelAdjustment: number;
  playbackRate: number;
  audioFadeInDurationInSeconds: number;
  audioFadeOutDurationInSeconds: number;
  assetId: string;
};

type ImageItemData = BaseItemData & {
  type: 'image';
  borderRadius: number;
  rotation: number;
  keepAspectRatio: boolean;
  fadeInDurationInSeconds: number;
  fadeOutDurationInSeconds: number;
  objectFit: 'contain' | 'cover' | 'fill';
  assetId: string;
};

type TextItemData = BaseItemData & {
  type: 'text';
  text: string;
  color: string;
  align: 'left' | 'center' | 'right';
  fontFamily: string;
  fontStyle: { variant: string; weight: string };
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  direction: 'ltr' | 'rtl';
  strokeWidth: number;
  strokeColor: string;
  fadeInDurationInSeconds: number;
  fadeOutDurationInSeconds: number;
  rotation: number;
};

type CaptionsItemData = BaseItemData & {
  type: 'captions';
  fontFamily: string;
  fontStyle: { variant: string; weight: string };
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  align: 'left' | 'center' | 'right';
  color: string;
  highlightColor: string;
  strokeWidth: number;
  strokeColor: string;
  direction: 'ltr' | 'rtl';
  pageDurationInMilliseconds: number;
  captionStartInSeconds: number;
  maxLines: number;
  fadeInDurationInSeconds: number;
  fadeOutDurationInSeconds: number;
  rotation: number;
  assetId: string;
  captions: Caption[];
};

type SolidItemData = BaseItemData & {
  type: 'solid';
  color: string;
  borderRadius: number;
  rotation: number;
  keepAspectRatio: boolean;
  fadeInDurationInSeconds: number;
  fadeOutDurationInSeconds: number;
};

type MotionDesignItemData = BaseItemData & {
  type: 'motion-design';
  templateId: string;
  props: Record<string, unknown>;
  animationCheck: MotionDesignTimingCheck;
  rotation: number;
  fadeInDurationInSeconds: number;
  fadeOutDurationInSeconds: number;
};

type GifItemData = BaseItemData & {
  type: 'gif';
  gifStartFromInSeconds: number;
  playbackRate: number;
  borderRadius: number;
  rotation: number;
  keepAspectRatio: boolean;
  fadeInDurationInSeconds: number;
  fadeOutDurationInSeconds: number;
  assetId: string;
};

type ItemData =
  | VideoItemData
  | AudioItemData
  | ImageItemData
  | TextItemData
  | CaptionsItemData
  | SolidItemData
  | MotionDesignItemData
  | GifItemData;

const isCaptionAsset = (asset: EditorStarterAsset): asset is CaptionAsset => asset.type === 'caption';

const buildBaseItemData = (item: EditorStarterItem, fps: number): BaseItemData => ({
  id: item.id,
  type: item.type,
  from: item.from,
  durationInFrames: item.durationInFrames,
  durationInSeconds: item.durationInFrames / fps,
  startInSeconds: item.from / fps,
  endInSeconds: (item.from + item.durationInFrames) / fps,
  left: item.left,
  top: item.top,
  width: item.width,
  height: item.height,
  opacity: item.opacity,
});

const buildVideoItemData = (item: VideoItem, fps: number): VideoItemData => ({
  ...buildBaseItemData(item, fps),
  type: 'video',
  videoStartFromInSeconds: item.videoStartFromInSeconds,
  decibelAdjustment: item.decibelAdjustment,
  playbackRate: item.playbackRate,
  audioFadeInDurationInSeconds: item.audioFadeInDurationInSeconds,
  audioFadeOutDurationInSeconds: item.audioFadeOutDurationInSeconds,
  fadeInDurationInSeconds: item.fadeInDurationInSeconds,
  fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
  borderRadius: item.borderRadius,
  rotation: item.rotation,
  keepAspectRatio: item.keepAspectRatio,
  assetId: item.assetId,
});

const buildAudioItemData = (item: AudioItem, fps: number): AudioItemData => ({
  ...buildBaseItemData(item, fps),
  type: 'audio',
  audioStartFromInSeconds: item.audioStartFromInSeconds,
  decibelAdjustment: item.decibelAdjustment,
  playbackRate: item.playbackRate,
  audioFadeInDurationInSeconds: item.audioFadeInDurationInSeconds,
  audioFadeOutDurationInSeconds: item.audioFadeOutDurationInSeconds,
  assetId: item.assetId,
});

const buildImageItemData = (item: ImageItem, fps: number): ImageItemData => ({
  ...buildBaseItemData(item, fps),
  type: 'image',
  borderRadius: item.borderRadius,
  rotation: item.rotation,
  keepAspectRatio: item.keepAspectRatio,
  fadeInDurationInSeconds: item.fadeInDurationInSeconds,
  fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
  objectFit: item.objectFit ?? 'fill',
  assetId: item.assetId,
});

const buildTextItemData = (item: TextItem, fps: number): TextItemData => ({
  ...buildBaseItemData(item, fps),
  type: 'text',
  text: item.text,
  color: item.color,
  align: item.align,
  fontFamily: item.fontFamily,
  fontStyle: item.fontStyle,
  fontSize: item.fontSize,
  lineHeight: item.lineHeight,
  letterSpacing: item.letterSpacing,
  direction: item.direction,
  strokeWidth: item.strokeWidth,
  strokeColor: item.strokeColor,
  fadeInDurationInSeconds: item.fadeInDurationInSeconds,
  fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
  rotation: item.rotation,
});

const buildCaptionsItemData = (item: CaptionsItem, fps: number, captionsArray: Caption[]): CaptionsItemData => ({
  ...buildBaseItemData(item, fps),
  type: 'captions',
  fontFamily: item.fontFamily,
  fontStyle: item.fontStyle,
  fontSize: item.fontSize,
  lineHeight: item.lineHeight,
  letterSpacing: item.letterSpacing,
  align: item.align,
  color: item.color,
  highlightColor: item.highlightColor,
  strokeWidth: item.strokeWidth,
  strokeColor: item.strokeColor,
  direction: item.direction,
  pageDurationInMilliseconds: item.pageDurationInMilliseconds,
  captionStartInSeconds: item.captionStartInSeconds,
  maxLines: item.maxLines,
  fadeInDurationInSeconds: item.fadeInDurationInSeconds,
  fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
  rotation: item.rotation,
  assetId: item.assetId,
  captions: captionsArray,
});

const buildSolidItemData = (item: SolidItem, fps: number): SolidItemData => ({
  ...buildBaseItemData(item, fps),
  type: 'solid',
  color: item.color,
  borderRadius: item.borderRadius,
  rotation: item.rotation,
  keepAspectRatio: item.keepAspectRatio,
  fadeInDurationInSeconds: item.fadeInDurationInSeconds,
  fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
});

const buildMotionDesignItemData = (item: MotionDesignItem, fps: number): MotionDesignItemData => ({
  ...buildBaseItemData(item, fps),
  type: 'motion-design',
  templateId: item.templateId,
  props: item.props as Record<string, unknown>,
  animationCheck: getMotionDesignTimingCheck({
    templateId: item.templateId,
    props: item.props,
    durationInFrames: item.durationInFrames,
  }),
  rotation: item.rotation,
  fadeInDurationInSeconds: item.fadeInDurationInSeconds,
  fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
});

const buildGifItemData = (item: GifItem, fps: number): GifItemData => ({
  ...buildBaseItemData(item, fps),
  type: 'gif',
  gifStartFromInSeconds: item.gifStartFromInSeconds,
  playbackRate: item.playbackRate,
  borderRadius: item.borderRadius,
  rotation: item.rotation,
  keepAspectRatio: item.keepAspectRatio,
  fadeInDurationInSeconds: item.fadeInDurationInSeconds,
  fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
  assetId: item.assetId,
});

export const useGetItemsData = () => {
  const { items } = useAllItems();
  const { assets } = useAssets();
  const { fps } = useFps();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();

  const buildItemData = useCallback(
    (item: EditorStarterItem): ItemData | null => {
      switch (item.type) {
        case 'video':
          return buildVideoItemData(item, fps);
        case 'audio':
          return buildAudioItemData(item, fps);
        case 'image':
          return buildImageItemData(item, fps);
        case 'text':
          return buildTextItemData(item, fps);
        case 'solid':
          return buildSolidItemData(item, fps);
        case 'motion-design':
          return buildMotionDesignItemData(item, fps);
        case 'gif':
          return buildGifItemData(item, fps);
        case 'captions': {
          const asset = assets[item.assetId];
          const captionsArray = asset && isCaptionAsset(asset) ? asset.captions : [];
          return buildCaptionsItemData(item, fps, captionsArray);
        }
        default:
          return null;
      }
    },
    [assets, fps],
  );

  const getItemsData = useCallback(
    async (options: GetItemsDataOptions) => {
      const { itemIds, toolCallId } = options;

      const report = async (
        status: 'success' | 'skipped' | 'error',
        output?: Record<string, unknown>,
        error?: string,
      ) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: {
              toolCallId,
              toolName: editorToolNames.getItemsData,
              status,
              output,
              error,
            },
          });
        } catch {
          // Reporting failure should not block
        }
      };

      try {
        const normalizedIds = [...new Set(itemIds.map((id) => id.trim()).filter(Boolean))];

        if (normalizedIds.length === 0) {
          await report('skipped', { reason: 'No valid item IDs provided' });
          return null;
        }

        const foundItems: ItemData[] = [];
        const notFoundIds: string[] = [];

        for (const itemId of normalizedIds) {
          const item = items[itemId];
          if (!item) {
            notFoundIds.push(itemId);
            continue;
          }

          const itemData = buildItemData(item);
          if (itemData) {
            foundItems.push(itemData);
          }
        }

        const output = {
          items: foundItems,
          requestedCount: normalizedIds.length,
          foundCount: foundItems.length,
          notFoundIds: notFoundIds.length > 0 ? notFoundIds : undefined,
        };

        await report('success', output as unknown as Record<string, unknown>);
        return output;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get items data';
        await report('error', undefined, message);
        return null;
      }
    },
    [buildItemData, items, reportToolResult],
  );

  return { getItemsData };
};
