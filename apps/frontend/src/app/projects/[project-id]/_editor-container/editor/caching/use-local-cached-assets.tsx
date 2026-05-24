import React, {useEffect, useSyncExternalStore} from 'react';
import {FEATURE_CACHE_ASSETS_LOCALLY} from '../flags';
import {useLibraryAssets} from '../library';
import {getKeysCache, onKeysChanged} from './indexeddb';
import {loadToBlobUrlOnce} from './load-to-blob-url';

const onServer = () => null;

export const UseLocalCachedAssets: React.FC = () => {
	const keys = useSyncExternalStore(onKeysChanged, getKeysCache, onServer);
	const {libraryAssets} = useLibraryAssets();

	useEffect(() => {
		if (!keys) {
			// IDB not yet loaded
			return;
		}

		if (!FEATURE_CACHE_ASSETS_LOCALLY) {
			return;
		}

		for (const assetId of Object.keys(libraryAssets)) {
			const isDownloaded = keys.includes(assetId);
			if (isDownloaded) {
				void loadToBlobUrlOnce(libraryAssets[assetId]).catch(() => undefined);
			}
		}
	}, [keys, libraryAssets]);

	return null;
};
