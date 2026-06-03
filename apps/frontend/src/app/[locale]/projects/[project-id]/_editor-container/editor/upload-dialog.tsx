'use client';

import type { PlayerRef } from '@remotion/player';
import { useMemo, useCallback, useState } from 'react';
import { Button } from '@/components/buttons/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/inputs/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload, type UploadItem } from '@/components/ui/file-upload';
import { addAsset, addAssetToLibraryOnly } from './assets/add-asset';
import { useWriteContext, useAssetStatus, useFps, useDimensions, useTracks } from './utils/use-context';
import { useLibraryAssets } from './library';
import { useProjectId } from './utils/use-project-id';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  playerRef: React.RefObject<PlayerRef | null>;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({ isOpen, onClose, playerRef }) => {
  const timelineWriteContext = useWriteContext();
  const projectId = useProjectId();
  const { libraryAssets } = useLibraryAssets();
  const { assetStatus } = useAssetStatus();
  const { fps } = useFps();
  const { compositionWidth, compositionHeight } = useDimensions();
  const { tracks } = useTracks();
  const [addToTimeline, setAddToTimeline] = useState<boolean>(false);

  const uploads: UploadItem[] = useMemo(() => {
    return Object.values(libraryAssets).map((asset) => {
      const status = assetStatus[asset.id];
      let uploadStatus: UploadItem['status'] = 'completed';
      let progress = 100;

      if (status) {
        if (status.type === 'pending-upload' || status.type === 'in-progress') {
          uploadStatus = 'uploading';
          progress = status.type === 'in-progress' ? status.progress.progress * 100 : 0;
        } else if (status.type === 'transcribing') {
          uploadStatus = 'transcribing';
          progress = 100;
        } else if (status.type === 'error') {
          uploadStatus = 'error';
          progress = 0;
        }
      }

      return {
        id: asset.id,
        name: asset.filename,
        progress,
        status: uploadStatus,
      };
    });
  }, [libraryAssets, assetStatus]);

  const handleFilesAdded = useCallback(
    (files: File[]) => {
      const uploadPromises = files.map((file) => {
        if (addToTimeline) {
          // Add to both library and timeline
          return addAsset({
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
            silent: true,
          });
        } else {
          // Add to library only
          return addAssetToLibraryOnly({
            file,
            filename: file.name,
            timelineWriteContext,
            projectId,
            silent: true,
          });
        }
      });
      // Use allSettled to ensure all uploads run independently (one failure won't affect others)
      void Promise.allSettled(uploadPromises);
    },
    [addToTimeline, timelineWriteContext, playerRef, fps, compositionWidth, compositionHeight, tracks, projectId],
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Create a new project</DialogTitle>
        <div className="shrink-0 p-6 pb-4">
          <h2 className="text-foreground text-lg font-medium">Create a new project</h2>
          <p className="text-muted-foreground mt-1 text-sm">Upload your assets to get started with your project.</p>
        </div>

        <div className="shrink-0 px-6 pb-4">
          <Label htmlFor="project-name" className="mb-2">
            Project name
          </Label>
          <Input id="project-name" placeholder="My Project" isDisabled className="w-full" />
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-4">
          <FileUpload uploads={uploads} onFilesAdded={handleFilesAdded} />
        </div>

        <div className="shrink-0 border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={addToTimeline} onCheckedChange={(checked) => setAddToTimeline(checked === true)} />
            <span className="text-muted-foreground text-sm">Add to timeline immediately</span>
          </label>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 px-6 py-3">
          <Button onClick={onClose}>Continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
