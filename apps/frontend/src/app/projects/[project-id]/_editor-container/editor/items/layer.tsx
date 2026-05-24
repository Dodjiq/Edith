import React, {useMemo} from 'react';
import {Sequence, useVideoConfig} from 'remotion';
import {useItem} from '../utils/use-context';
import {InnerLayer} from './inner-layer';

export const Layer: React.FC<{
	itemId: string;
	trackMuted: boolean;
}> = ({itemId, trackMuted}) => {
	const {fps} = useVideoConfig();
	const item = useItem(itemId);

	const sequenceStyle: React.CSSProperties = useMemo(
		() => ({
			display: 'contents',
			opacity: item.opacity,
		}),
		[item.opacity],
	);

	const styleWhilePremounted: React.CSSProperties = useMemo(
		() => ({
			display: 'block',
		}),
		[],
	);

	return (
		<>
			<Sequence
				key={item.id}
				from={item.from}
				style={sequenceStyle}
				durationInFrames={item.durationInFrames}
				styleWhilePremounted={styleWhilePremounted}
				premountFor={1.5 * fps}
			>
				<InnerLayer item={item} trackMuted={trackMuted} />
			</Sequence>
		</>
	);
};
