import React from 'react';
import {GenerateCaptionSection} from '../captioning/caption-section';
import {
	FEATURE_ALIGNMENT_CONTROL,
	FEATURE_AUDIO_FADE_CONTROL,
	FEATURE_BORDER_RADIUS_CONTROL,
	FEATURE_DIMENSIONS_CONTROL,
	FEATURE_OPACITY_CONTROL,
	FEATURE_PLAYBACKRATE_CONTROL,
	FEATURE_POSITION_CONTROL,
	FEATURE_ROTATION_CONTROL,
	FEATURE_SOURCE_CONTROL,
	FEATURE_VISUAL_FADE_CONTROL,
	FEATURE_VOLUME_CONTROL,
} from '../flags';
import {VideoItem} from '../items/video/video-item-type';
import {useAssetFromItem} from '../utils/use-context';
import {InspectorLabel} from './components/inspector-label';
import {
	InspectorDivider,
	InspectorSection,
} from './components/inspector-section';
import {AlignmentControls} from './controls/alignment-controls';
import {AudioFadeControls} from './controls/audio-fade-controls';
import {BorderRadiusControl} from './controls/border-radius-controls';
import {DimensionsControls} from './controls/dimensions-controls';
import {FadeControls} from './controls/fade-controls';
import {OpacityControls} from './controls/opacity-controls';
import {PlaybackRateControls} from './controls/playback-rate-controls';
import {PositionControl} from './controls/position-control';
import {RotationControl} from './controls/rotation-controls';
import {SourceControls} from './controls/source-info/source-info';
import {VolumeControls} from './controls/volume-controls';

const VideoInspectorUnmemoized: React.FC<{
	item: VideoItem;
}> = ({item}) => {
	const asset = useAssetFromItem(item);

	if (asset.type !== 'video') {
		throw new Error('Video inspector not supported for video assets');
	}

	return (
		<div>
			{FEATURE_SOURCE_CONTROL && <SourceControls item={item} />}
			<InspectorSection>
				<InspectorLabel>Layout</InspectorLabel>
				{FEATURE_ALIGNMENT_CONTROL && <AlignmentControls itemId={item.id} />}
				{FEATURE_POSITION_CONTROL && (
					<PositionControl left={item.left} top={item.top} itemId={item.id} />
				)}
				{FEATURE_DIMENSIONS_CONTROL && (
					<DimensionsControls
						itemId={item.id}
						height={item.height}
						width={item.width}
					/>
				)}
				{FEATURE_ROTATION_CONTROL && (
					<RotationControl rotation={item.rotation} itemId={item.id} />
				)}
			</InspectorSection>
			<InspectorDivider />
			<InspectorSection>
				<InspectorLabel>Fill</InspectorLabel>
				{FEATURE_OPACITY_CONTROL && (
					<OpacityControls opacity={item.opacity} itemId={item.id} />
				)}
				{FEATURE_BORDER_RADIUS_CONTROL && (
					<BorderRadiusControl
						borderRadius={item.borderRadius}
						itemId={item.id}
					/>
				)}
			</InspectorSection>
			<InspectorDivider />
			<InspectorSection>
				<InspectorLabel>Video</InspectorLabel>
				{FEATURE_PLAYBACKRATE_CONTROL && (
					<PlaybackRateControls
						playbackRate={item.playbackRate}
						itemId={item.id}
						assetId={item.assetId}
					/>
				)}
				{FEATURE_VISUAL_FADE_CONTROL && (
					<FadeControls
						fadeInDuration={item.fadeInDurationInSeconds}
						fadeOutDuration={item.fadeOutDurationInSeconds}
						itemId={item.id}
						durationInFrames={item.durationInFrames}
					/>
				)}
			</InspectorSection>

			{asset.hasAudioTrack ? (
				<>
					<InspectorDivider />
					<InspectorSection>
						<InspectorLabel>Audio</InspectorLabel>
						{FEATURE_VOLUME_CONTROL && (
							<VolumeControls
								decibelAdjustment={item.decibelAdjustment}
								itemId={item.id}
							/>
						)}
						{FEATURE_AUDIO_FADE_CONTROL && (
							<AudioFadeControls
								fadeInDuration={item.audioFadeInDurationInSeconds}
								fadeOutDuration={item.audioFadeOutDurationInSeconds}
								itemId={item.id}
								durationInFrames={item.durationInFrames}
							/>
						)}
					</InspectorSection>
					<InspectorDivider />
					<GenerateCaptionSection item={item} />
				</>
			) : null}
		</div>
	);
};

export const VideoInspector = React.memo(VideoInspectorUnmemoized);
