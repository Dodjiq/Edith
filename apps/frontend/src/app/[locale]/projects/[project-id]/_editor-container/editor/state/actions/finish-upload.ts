import {Caption} from '@remotion/captions';
import {AudioAsset, EditorStarterAsset, VideoAsset} from '../../assets/assets';
import {EditorState} from '../types';

export const finishUpload = ({
	asset,
	remoteUrl: remoteUrl,
	state,
	remoteFileKey,
	transcription,
}: {
	state: EditorState;
	asset: EditorStarterAsset;
	remoteUrl: string;
	remoteFileKey: string;
	transcription?: Caption[];
}): EditorState => {
	// Look in both assets and libraryAssets (library-only assets won't be in assets)
	const existingAsset = state.undoableState.assets[asset.id] ?? state.undoableState.libraryAssets[asset.id];

	if (!existingAsset) {
		console.warn('[finishUpload] Asset not found:', asset.id);
		return state;
	}

	// Build updated asset with transcription if applicable
	let updatedAsset: EditorStarterAsset = {
		...existingAsset,
		remoteUrl,
		remoteFileKey,
	};

	// Add transcription to video/audio assets
	if (transcription && (existingAsset.type === 'video' || existingAsset.type === 'audio')) {
		updatedAsset = {
			...updatedAsset,
			transcription,
		} as VideoAsset | AudioAsset;
	}

	// Update in assets if present there
	const newAssets = state.undoableState.assets[asset.id]
		? { ...state.undoableState.assets, [asset.id]: updatedAsset }
		: state.undoableState.assets;

	// Always update in libraryAssets (source of truth for all uploaded assets)
	const newLibraryAssets = state.undoableState.libraryAssets[asset.id]
		? { ...state.undoableState.libraryAssets, [asset.id]: updatedAsset }
		: state.undoableState.libraryAssets;

	return {
		...state,
		undoableState: {
			...state.undoableState,
			assets: newAssets,
			libraryAssets: newLibraryAssets,
		},
		assetStatus: {
			...state.assetStatus,
			[asset.id]: {type: 'uploaded'},
		},
	};
};
