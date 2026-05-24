import { useSyncExternalStore } from 'react';
import { EditorStarterAsset } from '../assets/assets';

type AssetDownloadFailure = {
  assetId: string;
  filename: string;
  title: string;
  description: string;
};

let failures: AssetDownloadFailure[] = [];
let listeners: Array<() => void> = [];

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners = [...listeners, listener];

  return () => {
    listeners = listeners.filter((currentListener) => currentListener !== listener);
  };
};

const getSnapshot = () => {
  return failures[0] ?? null;
};

const getAssetLabel = (asset: EditorStarterAsset) => {
  if (asset.type === 'video') {
    return 'video';
  }

  if (asset.type === 'audio') {
    return 'audio file';
  }

  return 'file';
};

export const reportMissingRemoteAsset = (asset: EditorStarterAsset) => {
  const alreadyQueued = failures.some((failure) => failure.assetId === asset.id);

  if (alreadyQueued) {
    return;
  }

  const assetLabel = getAssetLabel(asset);

  failures = [
    ...failures,
    {
      assetId: asset.id,
      filename: asset.filename,
      title: 'Imported file unavailable',
      description: `The ${assetLabel} "${asset.filename}" is no longer available, so it was removed from the timeline. Upload it again to keep editing.`,
    },
  ];

  emitChange();
};

export const dismissAssetDownloadFailure = () => {
  if (failures.length === 0) {
    return;
  }

  failures = failures.slice(1);
  emitChange();
};

export const useAssetDownloadFailure = () => {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
};
