import {PlayerRef} from '@remotion/player';
import {toast} from 'sonner';
import {TimelineWriteOnlyContext} from '../context-provider';
import {makeItem} from '../items/make-item';
import {addAssetToState} from '../state/actions/add-asset-to-state';
import {addItem} from '../state/actions/add-item';
import {addAssetToLibrary} from '../state/actions/library-assets';
import {useSilentTranscriptionStore} from '../state/silent-transcription-store';
import {TrackType} from '../state/types';
import {getErrorStack, performAssetUpload} from '../utils/asset-upload-utils';
import {isTimelineEmpty} from '../utils/is-timeline-empty';
import {makeAssetOnly} from './make-asset-only';

export type DropPosition = {
	x: number;
	y: number;
};

const innerAddAsset = async ({
	file,
	timelineWriteContext,
	playerRef,
	dropPosition,
	fps,
	compositionWidth,
	compositionHeight,
	tracks,
	filename,
	projectId,
	silent,
}: {
	file: Blob;
	timelineWriteContext: TimelineWriteOnlyContext;
	playerRef: React.RefObject<PlayerRef | null>;
	dropPosition: DropPosition | null;
	fps: number;
	compositionWidth: number;
	compositionHeight: number;
	tracks: TrackType[];
	filename: string;
	projectId: string;
	silent?: boolean;
}) => {
	const {setState} = timelineWriteContext;

	const {item, asset} = await makeItem({
		file,
		fps,
		compositionWidth,
		compositionHeight,
		playerRef,
		dropPosition,
		remoteUrl: null,
		remoteFileKey: null,
		filename,
	});

	// Mark asset as silent to suppress transcription toast
	if (silent) {
		useSilentTranscriptionStore.getState().addSilentAsset(asset.id);
	}

	const isEmpty = isTimelineEmpty(tracks);

	// Add asset to both library and timeline, then add item
	setState({
		update: (state) => {
			// First add to library (source of truth)
			const withLibraryAsset = addAssetToLibrary({ state, asset });
			// Then add to timeline assets
			const withAsset = addAssetToState({ state: withLibraryAsset, asset });
			// Finally add the item
			const withItem = addItem({
				state: withAsset,
				item: item,
				select: true,
				position: { type: 'front' },
			});
			return withItem;
		},
		commitToUndoStack: true,
	});

	if (isEmpty) {
		setState({
			update: (state) => {
				return {
					...state,
					compositionWidth: item.width,
					compositionHeight: item.height,
				};
			},
			commitToUndoStack: true,
		});
	}

	// Upload directly to Rust media processor
	await performAssetUpload({setState, asset, file, projectId});
};

export const addAsset = async ({
	file,
	filename,
	timelineWriteContext,
	playerRef,
	dropPosition,
	fps,
	compositionWidth,
	compositionHeight,
	tracks,
	projectId,
	silent,
}: {
	file: Blob;
	filename: string;
	timelineWriteContext: TimelineWriteOnlyContext;
	playerRef: React.RefObject<PlayerRef | null>;
	dropPosition: DropPosition | null;
	fps: number;
	compositionWidth: number;
	compositionHeight: number;
	tracks: TrackType[];
	projectId: string;
	/** When true, suppresses transcription completion toast */
	silent?: boolean;
}) => {
	try {
		await innerAddAsset({
			file,
			fps,
			compositionWidth,
			compositionHeight,
			tracks,
			timelineWriteContext,
			playerRef,
			dropPosition,
			filename,
			projectId,
			silent,
		});
	} catch (error: unknown) {
		const message = getErrorStack(error);
		toast.error('Error processing asset', {
			description: message,
		});
	}
};

/** Add asset to library only (without placing on timeline) */
export const addAssetToLibraryOnly = async ({
	file,
	filename,
	timelineWriteContext,
	projectId,
	silent,
}: {
	file: Blob;
	filename: string;
	timelineWriteContext: TimelineWriteOnlyContext;
	projectId: string;
	/** When true, suppresses transcription completion toast */
	silent?: boolean;
}) => {
	const { setState } = timelineWriteContext;

	try {
		const asset = await makeAssetOnly({
			file,
			filename,
			remoteUrl: null,
			remoteFileKey: null,
		});

		// Mark asset as silent to suppress transcription toast
		if (silent) {
			useSilentTranscriptionStore.getState().addSilentAsset(asset.id);
		}

		// Add asset to library only
		setState({
			update: (state) => addAssetToLibrary({ state, asset }),
			commitToUndoStack: true,
		});

		// Upload to cloud
		await performAssetUpload({ setState, asset, file, projectId });

		return asset;
	} catch (error: unknown) {
		const message = getErrorStack(error);
		toast.error('Error processing asset', {
			description: message,
		});
		return null;
	}
};
