import React, {useEffect, useMemo, useRef} from 'react';
import {TimelineTrack} from './timeline-track/timeline-track';
import {TimelineTrackAndLayout} from './utils/drag/calculate-track-heights';
import {useEditorInitialized} from '../utils/use-context';

const TIMELINE_ITEM_ENTRY_STAGGER_SECONDS = 0.05;

const TimelineTracksUnmemoized: React.FC<{
	tracks: TimelineTrackAndLayout[];
	visibleFrames: number;
}> = ({tracks, visibleFrames}) => {
	const isInitialized = useEditorInitialized();
	const prevItemIdsRef = useRef<Set<string> | null>(null);
	const currentItemIdsRef = useRef<Set<string>>(new Set());

	const entryAnimationDelays = useMemo(() => {
		const currentItemIds = new Set<string>();
		const newItemIds: string[] = [];

		for (const trackAndLayout of tracks) {
			for (const itemId of trackAndLayout.track.items) {
				currentItemIds.add(itemId);
				if (prevItemIdsRef.current && !prevItemIdsRef.current.has(itemId)) {
					newItemIds.push(itemId);
				}
			}
		}

		currentItemIdsRef.current = currentItemIds;

		if (!isInitialized || !prevItemIdsRef.current || newItemIds.length === 0) {
			return {};
		}

		const delays: Record<string, number> = {};
		newItemIds.forEach((itemId, index) => {
			delays[itemId] = index * TIMELINE_ITEM_ENTRY_STAGGER_SECONDS;
		});

		return delays;
	}, [isInitialized, tracks]);

	useEffect(() => {
		if (!isInitialized) {
			return;
		}

		prevItemIdsRef.current = currentItemIdsRef.current;
	}, [isInitialized, tracks]);

	return tracks.map((trackAndLayout) => {
		return (
			<TimelineTrack
				key={trackAndLayout.track.id}
				track={trackAndLayout.track}
				visibleFrames={visibleFrames}
				top={trackAndLayout.top}
				height={trackAndLayout.height}
				entryAnimationDelays={entryAnimationDelays}
			/>
		);
	});
};

export const TimelineTracks = React.memo(TimelineTracksUnmemoized);
