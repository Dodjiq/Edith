import React from 'react';
import {
	FEATURE_ALIGNMENT_CONTROL,
	FEATURE_BORDER_RADIUS_CONTROL,
	FEATURE_DIMENSIONS_CONTROL,
	FEATURE_OPACITY_CONTROL,
	FEATURE_PLAYBACKRATE_CONTROL,
	FEATURE_POSITION_CONTROL,
	FEATURE_ROTATION_CONTROL,
	FEATURE_SOURCE_CONTROL,
	FEATURE_VISUAL_FADE_CONTROL,
} from '../flags';
import {GifItem} from '../items/gif/gif-item-type';
import {InspectorLabel} from './components/inspector-label';
import {
	InspectorDivider,
	InspectorSection,
} from './components/inspector-section';
import {AlignmentControls} from './controls/alignment-controls';
import {BorderRadiusControl} from './controls/border-radius-controls';
import {DimensionsControls} from './controls/dimensions-controls';
import {FadeControls} from './controls/fade-controls';
import {OpacityControls} from './controls/opacity-controls';
import {PlaybackRateControls} from './controls/playback-rate-controls';
import {PositionControl} from './controls/position-control';
import {RotationControl} from './controls/rotation-controls';
import {SourceControls} from './controls/source-info/source-info';

const GifInspectorUnmemoized: React.FC<{
	item: GifItem;
}> = ({item}) => {
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
				<InspectorLabel>GIF</InspectorLabel>
				{FEATURE_PLAYBACKRATE_CONTROL && (
					<PlaybackRateControls
						playbackRate={item.playbackRate}
						itemId={item.id}
						assetId={item.assetId}
					/>
				)}
			</InspectorSection>
			{FEATURE_VISUAL_FADE_CONTROL && (
				<>
					<InspectorDivider />
					<InspectorSection>
						<InspectorLabel>Fade</InspectorLabel>
						<FadeControls
							fadeInDuration={item.fadeInDurationInSeconds}
							fadeOutDuration={item.fadeOutDurationInSeconds}
							itemId={item.id}
							durationInFrames={item.durationInFrames}
						/>
					</InspectorSection>
				</>
			)}
		</div>
	);
};

export const GifInspector = React.memo(GifInspectorUnmemoized);
