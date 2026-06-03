import {useMemo} from 'react';
import {Html5Audio, useVideoConfig} from 'remotion';
import {RequireCachedAsset} from '../../caching/require-cached-asset';
import {usePreferredLocalUrl} from '../../utils/find-asset-by-id';
import {useAssetFromItem} from '../../utils/use-context';
import {volumeFn} from '../../utils/volume-fn';
import {AudioItem} from './audio-item-type';

export const AudioLayer = ({
	item,
	trackMuted,
}: {
	item: AudioItem;
	trackMuted: boolean;
}) => {
	const {fps} = useVideoConfig();
	const startFromInFrames = item.audioStartFromInSeconds * fps;

	const volume = useMemo(() => {
		return volumeFn({
			fps,
			audioFadeInDurationInSeconds: item.audioFadeInDurationInSeconds,
			audioFadeOutDurationInSeconds: item.audioFadeOutDurationInSeconds,
			durationInFrames: item.durationInFrames,
			decibelAdjustment: item.decibelAdjustment,
		});
	}, [
		fps,
		item.audioFadeInDurationInSeconds,
		item.audioFadeOutDurationInSeconds,
		item.durationInFrames,
		item.decibelAdjustment,
	]);

	const asset = useAssetFromItem(item);
	const src = usePreferredLocalUrl(asset);

	return (
		<RequireCachedAsset asset={asset}>
			<Html5Audio
				trimBefore={startFromInFrames}
				src={src}
				volume={volume}
				playbackRate={item.playbackRate}
				muted={trackMuted}
				crossOrigin="anonymous"
				pauseWhenBuffering
				useWebAudioApi
			/>
		</RequireCachedAsset>
	);
};
