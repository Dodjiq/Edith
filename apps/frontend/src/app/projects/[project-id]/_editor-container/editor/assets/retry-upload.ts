import {getObject} from '../caching/indexeddb';
import {SetState} from '../context-provider';
import {performAssetUpload} from '../utils/asset-upload-utils';
import {EditorStarterAsset} from './assets';

export const retryAssetUpload = async ({
	asset,
	setState,
	projectId,
}: {
	asset: EditorStarterAsset;
	setState: SetState;
	projectId: string;
}) => {
	// Retrieve the cached file from IndexedDB
	const file = await getObject({key: asset.id});
	if (!file) {
		throw new Error('Cached file not found');
	}

	// Set status to pending first
	setState({
		update: (state) => {
			return {
				...state,
				assetStatus: {
					...state.assetStatus,
					[asset.id]: {
						type: 'pending-upload',
					},
				},
			};
		},
		commitToUndoStack: false,
	});

	// Upload directly to Rust media processor
	await performAssetUpload({setState, asset, file, projectId});
};
