'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/buttons/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  dismissAssetDownloadFailure,
  useAssetDownloadFailure,
} from './caching/asset-download-failure-store';
import { clearAssetLocalState } from './caching/load-to-blob-url';
import { removeUnavailableAsset } from './state/actions/remove-unavailable-asset';
import { useWriteContext } from './utils/use-context';

export const AssetDownloadFailureModal: React.FC = () => {
  const failure = useAssetDownloadFailure();
  const { setState } = useWriteContext();
  const handledAssetIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!failure) {
      return;
    }

    if (handledAssetIdsRef.current.has(failure.assetId)) {
      return;
    }

    handledAssetIdsRef.current.add(failure.assetId);

    void clearAssetLocalState(failure.assetId);

    setState({
      update: (state) => removeUnavailableAsset({ state, assetId: failure.assetId }),
      commitToUndoStack: false,
    });
  }, [failure, setState]);

  if (!failure) {
    return null;
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && dismissAssetDownloadFailure()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{failure.title}</DialogTitle>
          <DialogDescription>{failure.description}</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/70">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{failure.filename}</p>
        </div>
        <DialogFooter>
          <Button onClick={dismissAssetDownloadFailure}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
