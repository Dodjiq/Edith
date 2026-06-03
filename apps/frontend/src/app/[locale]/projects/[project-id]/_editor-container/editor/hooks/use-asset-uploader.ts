import type {PlayerRef} from '@remotion/player';
import {useCallback, type RefObject} from 'react';
import {addAsset} from '../assets/add-asset';
import {useDimensions, useFps, useTracks, useWriteContext} from '../utils/use-context';
import {useProjectId} from '../utils/use-project-id';

export const useAssetUploader = (
	playerRef: RefObject<PlayerRef | null>,
): ((files: File[]) => Promise<void>) => {
	const timelineWriteContext = useWriteContext();
	const {fps} = useFps();
	const {compositionWidth, compositionHeight} = useDimensions();
	const {tracks} = useTracks();
	const projectId = useProjectId();

	return useCallback(
		async (files: File[]) => {
			for (const file of files) {
				await addAsset({
					file,
					filename: file.name,
					timelineWriteContext,
					playerRef,
					dropPosition: null,
					fps,
					compositionWidth,
					compositionHeight,
					tracks,
					projectId,
				});
			}
		},
		[
			compositionHeight,
			compositionWidth,
			fps,
			playerRef,
			projectId,
			timelineWriteContext,
			tracks,
		],
	);
};
