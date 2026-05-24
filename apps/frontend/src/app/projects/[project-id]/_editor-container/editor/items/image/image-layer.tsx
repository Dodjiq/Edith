import React, { useCallback, useMemo } from 'react';
import { cancelRender, getRemotionEnvironment, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { RequireCachedAsset } from '../../caching/require-cached-asset';
import { usePreferredLocalUrl } from '../../utils/find-asset-by-id';
import { useAssetFromItem } from '../../utils/use-context';
import { calculateFadeInOpacity, calculateFadeOutOpacity } from '../video/calculate-fade';
import { ImageItem } from './image-item-type';

const ImageItemUnmemoized: React.FC<{
  item: ImageItem;
}> = ({ item }) => {
  if (item.type !== 'image') {
    throw new Error('Item is not an image');
  }

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const asset = useAssetFromItem(item);

  const opacity = useMemo(() => {
    const inOpacity = calculateFadeInOpacity({
      currentFrame: frame,
      fadeInDurationInSeconds: item.fadeInDurationInSeconds,
      framesPerSecond: fps,
    });
    const outOpacity = calculateFadeOutOpacity({
      currentFrame: frame,
      fadeOutDurationInSeconds: item.fadeOutDurationInSeconds,
      framesPerSecond: fps,
      totalDurationInFrames: durationInFrames,
    });
    return inOpacity * outOpacity * item.opacity;
  }, [item.fadeInDurationInSeconds, fps, frame, item.opacity, durationInFrames, item.fadeOutDurationInSeconds]);

  const innerStyle: React.CSSProperties = useMemo(() => {
    return {
      objectFit: item.objectFit ?? 'fill',
      width: item.width,
      height: item.height,
      borderRadius: item.borderRadius,
    };
  }, [item]);

  const outerStyle: React.CSSProperties = useMemo(() => {
    return {
      position: 'absolute',
      left: item.left,
      top: item.top,
      transform: `rotate(${item.rotation}deg)`,
      opacity,
      ...innerStyle,
    };
  }, [innerStyle, item.left, item.top, item.rotation, opacity]);

  const src = usePreferredLocalUrl(asset);

  // Log the URL being used during rendering for debugging
  const isRendering = getRemotionEnvironment().isRendering;

  const onError = useCallback(
    (error: React.SyntheticEvent<HTMLImageElement, Event>) => {
      console.log('Image load error:', error);
      const errorMessage = `Failed to load image: ${asset.id} from ${src?.substring(0, 100)}...`;
      console.error('[ImageLayer] Image load error:', errorMessage);
      if (isRendering) {
        cancelRender(new Error(errorMessage));
      }
    },
    [asset.id, src, isRendering],
  );

  return (
    <div style={outerStyle}>
      <RequireCachedAsset asset={asset}>
        <Img pauseWhenLoading style={innerStyle} src={src} onError={onError} crossOrigin="anonymous" />
      </RequireCachedAsset>
    </div>
  );
};

export const ImageLayer = React.memo(ImageItemUnmemoized);
