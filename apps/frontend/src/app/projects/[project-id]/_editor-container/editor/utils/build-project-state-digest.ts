import { getMotionDesignTemplate, getMotionDesignTimingCheck } from 'api-types';
import type { AssetStatusInfo, DigestProjectStateRequest, OriginalAssetInfo } from 'api-types';
import type { AssetState, EditorStarterAsset } from '../assets/assets';
import type { EditorStarterItem } from '../items/item-type';
import type { OriginalAssetRecord } from '../state/editor-assets-store';
import type { TrackType } from '../state/types';

type AssetBackedItem = EditorStarterItem & { assetId: string; durationInFrames: number; from: number };
type VisualItemSummary = NonNullable<DigestProjectStateRequest['visibleImageItemsInfo']>[number];

export type BuildProjectStateDigestInput = {
  projectId?: string;
  tracks: TrackType[];
  assets: Record<string, EditorStarterAsset>;
  libraryAssets: Record<string, EditorStarterAsset>;
  assetStatus: Record<string, AssetState>;
  items: Record<string, EditorStarterItem>;
  selectedItems: string[];
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
  originalAssets: Record<string, OriginalAssetRecord>;
  currentFrame?: number;
};

const isAssetBackedItem = (item: EditorStarterItem): item is AssetBackedItem => 'assetId' in item;
const roundSeconds = (value: number | undefined) => (value === undefined ? undefined : Number(value.toFixed(3)));
const roundSecondsStrict = (value: number) => Number(value.toFixed(3));

const getAssetStatus = (status?: AssetState): AssetStatusInfo['status'] => {
  if (!status || status.type === 'pending-upload') return 'pending-upload';
  if (status.type === 'in-progress') return 'uploading';
  if (status.type === 'transcribing') return 'transcribing';
  if (status.type === 'error') return 'error';
  return 'ready';
};

const getVisualSummary = (
  item: EditorStarterItem,
  fps: number,
  assets: Record<string, EditorStarterAsset>,
): VisualItemSummary | null => {
  const asset = isAssetBackedItem(item) ? assets[item.assetId] : undefined;
  const base = {
    itemId: item.id,
    type: item.type,
    assetId: isAssetBackedItem(item) ? item.assetId : undefined,
    fileName: asset?.filename,
    mimeType: asset?.mimeType,
    from: item.from,
    durationInFrames: item.durationInFrames,
    startTimeInSeconds: roundSecondsStrict(item.from / fps),
    endTimeInSeconds: roundSecondsStrict((item.from + item.durationInFrames) / fps),
    left: item.left,
    top: item.top,
    width: item.width,
    height: item.height,
    opacity: item.opacity,
  };

  if (item.type === 'image') {
    return {
      ...base,
      type: 'image',
      rotation: item.rotation,
      borderRadius: item.borderRadius,
      keepAspectRatio: item.keepAspectRatio,
      fadeInDurationInSeconds: item.fadeInDurationInSeconds,
      fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
      objectFit: item.objectFit,
    };
  }

  if (item.type === 'solid') {
    return {
      ...base,
      type: 'solid',
      shapeKind: item.borderRadius >= Math.min(item.width, item.height) / 2 ? 'ellipse' : 'rectangle',
      fillColor: item.color,
      color: item.color,
      rotation: item.rotation,
      borderRadius: item.borderRadius,
      keepAspectRatio: item.keepAspectRatio,
      fadeInDurationInSeconds: item.fadeInDurationInSeconds,
      fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
    };
  }

  if (item.type === 'text') {
    return {
      ...base,
      type: 'text',
      text: item.text,
      color: item.color,
      rotation: item.rotation,
      fontFamily: item.fontFamily,
      fontSize: item.fontSize,
      align: item.align,
      direction: item.direction,
      strokeWidth: item.strokeWidth,
      strokeColor: item.strokeColor,
      fadeInDurationInSeconds: item.fadeInDurationInSeconds,
      fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
    };
  }

  if (item.type === 'motion-design') {
    const template = getMotionDesignTemplate(item.templateId);
    return {
      ...base,
      type: 'motion-design',
      templateId: item.templateId,
      templateLabel: template?.label,
      props: item.props,
      animationCheck: getMotionDesignTimingCheck({
        templateId: item.templateId,
        props: item.props,
        durationInFrames: item.durationInFrames,
      }),
      text: item.props.text ?? item.props.label,
      rotation: item.rotation,
      fadeInDurationInSeconds: item.fadeInDurationInSeconds,
      fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
    };
  }

  if (item.type === 'captions') {
    return {
      ...base,
      type: 'captions',
      color: item.color,
      rotation: item.rotation,
      fontFamily: item.fontFamily,
      fontSize: item.fontSize,
      align: item.align,
      direction: item.direction,
      strokeWidth: item.strokeWidth,
      strokeColor: item.strokeColor,
      fadeInDurationInSeconds: item.fadeInDurationInSeconds,
      fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
    };
  }

  if (item.type === 'video' || item.type === 'gif') {
    return {
      ...base,
      type: item.type,
      rotation: item.rotation,
      borderRadius: item.borderRadius,
      keepAspectRatio: item.keepAspectRatio,
      fadeInDurationInSeconds: item.fadeInDurationInSeconds,
      fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
    };
  }

  return null;
};

export const buildProjectStateDigest = ({
  projectId,
  tracks,
  assets,
  libraryAssets,
  assetStatus,
  items,
  selectedItems,
  fps,
  compositionWidth,
  compositionHeight,
  originalAssets,
  currentFrame,
}: BuildProjectStateDigestInput): DigestProjectStateRequest => {
  const trackDetails = tracks.map((track) => ({
    trackId: track.id,
    isVisibleOnTimeline: !track.hidden,
    isMutedOnTimeline: track.muted,
    numberTracksItems: track.items.length,
    itemsTracksIds: track.items,
  }));

  const assetsStatusInfo: AssetStatusInfo[] = Object.values(libraryAssets)
    .filter((asset) => !asset.parentAssetId)
    .map((asset) => {
      const status = assetStatus[asset.id];
      const simplifiedStatus = getAssetStatus(status);

      return {
        assetId: asset.id,
        fileName: asset.filename,
        fileType: asset.type,
        status: simplifiedStatus,
        uploadProgressPercent: status?.type === 'in-progress' ? Math.round(status.progress.progress * 100) : undefined,
        errorMessage: status?.type === 'error' ? (status.error?.message ?? 'Unknown error') : undefined,
        canRetry: status?.type === 'error' ? status.canRetry : undefined,
        isOnTimeline: Boolean(assets[asset.id]),
        isReadyForPlacement: simplifiedStatus === 'ready',
        width: 'width' in asset ? asset.width : undefined,
        height: 'height' in asset ? asset.height : undefined,
        durationInSeconds: 'durationInSeconds' in asset ? roundSeconds(asset.durationInSeconds) : undefined,
      };
    });

  const originalAssetsInfo: OriginalAssetInfo[] = Object.values(originalAssets).map((record) => ({
    assetId: record.assetId,
    remoteUrl: record.remoteUrl,
    fileName: record.fileName,
    originalDurationInSeconds: roundSecondsStrict(record.originalDurationInSeconds),
    removedSegments: record.removedSegments.map((segment) => ({
      sourceStartInSeconds: roundSecondsStrict(segment.sourceStartInSeconds),
      sourceEndInSeconds: roundSecondsStrict(segment.sourceEndInSeconds),
      durationInSeconds: roundSecondsStrict(segment.durationInSeconds),
    })),
    lastModifiedAt: record.lastModifiedAt,
  }));

  const projectItemsInfo = Object.values(items)
    .filter(isAssetBackedItem)
    .map((item) => {
      const asset = assets[item.assetId];
      const status = assetStatus[item.assetId];
      const isReady = !status || status.type === 'uploaded';

      if (!asset || !isReady) return null;

      const durationInSeconds = 'durationInSeconds' in asset ? roundSeconds(asset.durationInSeconds) : undefined;
      const hasAudioTrack = asset.type === 'audio' || (asset.type === 'video' ? asset.hasAudioTrack : false);
      const itemHasNoTranscription =
        'hasNoTranscription' in item ? (item as { hasNoTranscription?: boolean }).hasNoTranscription : undefined;
      const assetHasNoTranscription =
        asset.type === 'video' || asset.type === 'audio' ? asset.hasNoTranscription : undefined;

      return {
        fileName: asset.filename,
        fileType: asset.type,
        itemId: item.id,
        mimeType: asset.mimeType,
        durationInSeconds,
        hasAudioTrack: Boolean(hasAudioTrack),
        startFromInSeconds: roundSeconds(item.from / fps),
        endAtInSeconds: roundSeconds((item.from + item.durationInFrames) / fps),
        remoteUrl: asset.remoteUrl ?? null,
        originalAssetId: originalAssets[item.assetId] ? item.assetId : undefined,
        hasNoTranscription: itemHasNoTranscription ?? assetHasNoTranscription,
        left: item.left,
        top: item.top,
        width: item.width,
        height: item.height,
        opacity: item.opacity,
        rotation: 'rotation' in item ? item.rotation : undefined,
        borderRadius: 'borderRadius' in item ? item.borderRadius : undefined,
        keepAspectRatio: 'keepAspectRatio' in item ? item.keepAspectRatio : undefined,
        fadeInDurationInSeconds: 'fadeInDurationInSeconds' in item ? item.fadeInDurationInSeconds : undefined,
        fadeOutDurationInSeconds: 'fadeOutDurationInSeconds' in item ? item.fadeOutDurationInSeconds : undefined,
        objectFit: item.type === 'image' ? item.objectFit : undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const visibleTimelineItemIds = new Set(tracks.filter((track) => !track.hidden).flatMap((track) => track.items));
  const visualItems = Object.values(items)
    .map((item) => getVisualSummary(item, fps, assets))
    .filter((item): item is VisualItemSummary => Boolean(item));
  const visibleVisualItems = visualItems.filter((item) => visibleTimelineItemIds.has(item.itemId));
  const visibleImageItemsInfo = visibleVisualItems.filter((item) => item.type === 'image');
  const visibleShapeItemsInfo = visibleVisualItems.filter((item) => item.type === 'solid');
  const textItemsInfo = visibleVisualItems.filter((item) => item.type === 'text');
  const captionItemsInfo = visibleVisualItems.filter((item) => item.type === 'captions');
  const motionDesignItemsInfo = visibleVisualItems.filter((item) => item.type === 'motion-design');
  const backgroundItemsInfo = visibleVisualItems.filter(
    (item) => item.type === 'video' || item.type === 'image' || item.type === 'gif' || item.type === 'solid',
  );
  const nearbyOverlayItemsInfo = visibleVisualItems.filter(
    (item) => item.type === 'text' || item.type === 'captions' || item.type === 'motion-design',
  );
  const imageAssetsInfo = Object.values(libraryAssets)
    .filter((asset) => asset.type === 'image')
    .map((asset) => {
      const status = getAssetStatus(assetStatus[asset.id]);
      return {
        assetId: asset.id,
        fileName: asset.filename,
        fileType: 'image' as const,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
        status,
        isReadyForPlacement: status === 'ready',
        isOnTimeline: Boolean(assets[asset.id]),
      };
    });

  const durationInFrames = Object.values(items).reduce(
    (maxDuration, item) => Math.max(maxDuration, item.from + item.durationInFrames),
    0,
  );

  return {
    projectId,
    tracksInfo: {
      numberOfTracks: tracks.length,
      tracks: trackDetails,
    },
    dimensionsInfo: {
      width: compositionWidth,
      height: compositionHeight,
    },
    currentPlayheadFrame: currentFrame,
    currentPlayheadTimeInSeconds: currentFrame === undefined ? undefined : roundSeconds(currentFrame / fps),
    durationInFrames,
    durationInSeconds: roundSeconds(durationInFrames / fps),
    projectItemsInfo,
    selectedItemsInfo: selectedItems,
    fpsInfo: fps,
    originalAssetsInfo: originalAssetsInfo.length > 0 ? originalAssetsInfo : undefined,
    assetsStatusInfo: assetsStatusInfo.length > 0 ? assetsStatusInfo : undefined,
    visibleImageItemsInfo: visibleImageItemsInfo.length > 0 ? visibleImageItemsInfo : undefined,
    visibleTextItemIds: textItemsInfo.length > 0 ? textItemsInfo.map((item) => item.itemId) : undefined,
    textItemsInfo: textItemsInfo.length > 0 ? textItemsInfo : undefined,
    captionItemsInfo: captionItemsInfo.length > 0 ? captionItemsInfo : undefined,
    visibleMotionDesignItemsInfo: motionDesignItemsInfo.length > 0 ? motionDesignItemsInfo : undefined,
    visibleShapeItemsInfo: visibleShapeItemsInfo.length > 0 ? visibleShapeItemsInfo : undefined,
    backgroundItemsInfo: backgroundItemsInfo.length > 0 ? backgroundItemsInfo : undefined,
    imageAssetsInfo: imageAssetsInfo.length > 0 ? imageAssetsInfo : undefined,
    nearbyOverlayItemsInfo: nearbyOverlayItemsInfo.length > 0 ? nearbyOverlayItemsInfo : undefined,
  };
};
