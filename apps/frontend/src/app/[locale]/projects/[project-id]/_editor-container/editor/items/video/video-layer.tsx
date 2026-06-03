import React, {useMemo} from 'react';
import {OffthreadVideo, useCurrentFrame, useVideoConfig} from 'remotion';
import {RequireCachedAsset} from '../../caching/require-cached-asset';
import {usePreferredLocalUrl} from '../../utils/find-asset-by-id';
import {useAssetFromItem} from '../../utils/use-context';
import {volumeFn} from '../../utils/volume-fn';
import {
	calculateFadeInOpacity,
	calculateFadeOutOpacity,
} from './calculate-fade';
import {VideoItem} from './video-item-type';

export const VideoLayer = ({
	item,
	trackMuted,
}: {
	item: VideoItem;
	trackMuted: boolean;
}) => {
	if (item.type !== 'video') {
		throw new Error('Item is not a video');
	}

	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

	const volume = useMemo(() => {
		return volumeFn({
			fps,
			audioFadeInDurationInSeconds: item.audioFadeInDurationInSeconds,
			audioFadeOutDurationInSeconds: item.audioFadeOutDurationInSeconds,
			durationInFrames: item.durationInFrames,
			decibelAdjustment: item.decibelAdjustment,
		});
	}, [
		item.audioFadeInDurationInSeconds,
		item.audioFadeOutDurationInSeconds,
		item.decibelAdjustment,
		item.durationInFrames,
		fps,
	]);

	const asset = useAssetFromItem(item);
	const src = usePreferredLocalUrl(asset);

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
	}, [
		item.fadeInDurationInSeconds,
		fps,
		frame,
		item.opacity,
		durationInFrames,
		item.fadeOutDurationInSeconds,
	]);

	const innerStyle: React.CSSProperties = useMemo(() => {
		return {
			objectFit: 'fill',
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

	const startFrom = item.videoStartFromInSeconds * fps;

	return (
		<div style={outerStyle}>
			<RequireCachedAsset asset={asset}>
				<OffthreadVideo
					volume={volume}
					trimBefore={startFrom}
					src={src}
					style={innerStyle}
					muted={trackMuted}
					playbackRate={item.playbackRate}
					crossOrigin="anonymous"
					pauseWhenBuffering
					useWebAudioApi
				/>
			</RequireCachedAsset>
		</div>
	);
};
