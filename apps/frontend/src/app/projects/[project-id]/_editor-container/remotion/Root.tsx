import React from 'react';
import {Composition} from 'remotion';
import {
	DEFAULT_COMPOSITION_HEIGHT,
	DEFAULT_COMPOSITION_WIDTH,
	DEFAULT_FPS,
} from '../editor/constants';
import {getCompositionDuration} from '../editor/utils/get-composition-duration';
import {COMP_NAME} from './constants';
import {CompositionWithContexts} from './main';
import {EdithAdComposition} from './edith-ad';

export const Root: React.FC = () => {
	return (
		<>
			<Composition
				id={COMP_NAME}
				component={CompositionWithContexts}
				calculateMetadata={({props}) => {
					const framesShown = Math.max(
						1,
						getCompositionDuration(Object.values(props.items)),
					);

					return {
						width: props.compositionWidth,
						height: props.compositionHeight,
						durationInFrames: framesShown,
						fps: DEFAULT_FPS,
					};
				}}
				defaultProps={{
					tracks: [],
					assets: {},
					items: {},
					compositionWidth: DEFAULT_COMPOSITION_WIDTH,
					compositionHeight: DEFAULT_COMPOSITION_HEIGHT,
					fontInfos: {},
				}}
			/>

			<Composition
				id="EdithAd"
				component={EdithAdComposition}
				calculateMetadata={({props}) => {
					const fps = DEFAULT_FPS;
					const totalFrames = Math.max(
						1,
						Math.round((props.totalDurationMs / 1000) * fps),
					);
					return {
						width: props.width,
						height: props.height,
						durationInFrames: totalFrames,
						fps,
					};
				}}
				defaultProps={{
					scenes: [],
					captions: [],
					totalDurationMs: 10000,
					width: 1080,
					height: 1920,
				}}
			/>
		</>
	);
};