'use client';

import { PlayerRef } from '@remotion/player';
import { Plus } from 'lucide-react';
import React, { useCallback } from 'react';
import { Button } from '@/components/buttons/button';
import { useFileLoadingToast } from '@/hooks/use-file-loading-toast';
import { addAsset } from '../assets/add-asset';
import { scrollbarStyle } from '../constants';
import { ImgInspector } from '../inspector/img-inspector';
import { ImageItem } from '../items/image/image-item-type';
import { useAllItems, useCurrentStateAsRef, useSelectedItems, useWriteContext } from '../utils/use-context';
import { useProjectId } from '../utils/use-project-id';

const IMAGE_ACCEPT = 'image/*';

interface ImagePanelProps {
  playerRef: React.RefObject<PlayerRef | null>;
}

export const ImagePanel: React.FC<ImagePanelProps> = ({ playerRef }) => {
  const timelineWriteContext = useWriteContext();
  const { selectedItems } = useSelectedItems();
  const { items } = useAllItems();
  const stateAsRef = useCurrentStateAsRef();
  const projectId = useProjectId();

  const {
    markFilePickerOpen,
    markFilePickerClosed,
    dismissLoadingToast,
    processFilesWithProgress,
    cancellationTimeoutRef,
  } = useFileLoadingToast();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const selectedImageItem = React.useMemo(() => {
    if (selectedItems.length !== 1) return null;
    const item = items[selectedItems[0]];
    if (item?.type === 'image') return item as ImageItem;
    return null;
  }, [selectedItems, items]);

  const handleAddImage = useCallback(() => {
    markFilePickerOpen();
    fileInputRef.current?.click();
  }, [markFilePickerOpen]);

  const handleFilesReady = useCallback(
    async (files: File[]) => {
      const uploadPromises = [];
      for (const file of files) {
        uploadPromises.push(
          addAsset({
            file,
            timelineWriteContext: timelineWriteContext,
            playerRef,
            dropPosition: null,
            fps: stateAsRef.current.undoableState.fps,
            compositionWidth: stateAsRef.current.undoableState.compositionWidth,
            compositionHeight: stateAsRef.current.undoableState.compositionHeight,
            tracks: stateAsRef.current.undoableState.tracks,
            filename: file.name,
            projectId,
          }),
        );
      }
      await Promise.all(uploadPromises);
    },
    [playerRef, projectId, stateAsRef, timelineWriteContext],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      markFilePickerClosed();

      if (cancellationTimeoutRef.current) {
        clearTimeout(cancellationTimeoutRef.current);
        cancellationTimeoutRef.current = null;
      }

      const files = e.target.files;
      if (!files || files.length === 0) {
        dismissLoadingToast();
        return;
      }

      const filesArray = Array.from(files);
      await processFilesWithProgress(filesArray, handleFilesReady);
      e.target.value = '';
    },
    [markFilePickerClosed, cancellationTimeoutRef, dismissLoadingToast, processFilesWithProgress, handleFilesReady],
  );

  return (
    <div
      className="border-r-editor-starter-border bg-editor-starter-panel flex h-full w-[300px] flex-col overflow-y-auto border-r text-white"
      style={scrollbarStyle}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      <div className="border-b border-white/10 p-3">
        <Button onClick={handleAddImage} className="w-full gap-2" size="sm">
          <Plus className="size-4" />
          Add Image
        </Button>
      </div>

      {selectedImageItem && (
        <div className="flex-1 overflow-y-auto">
          <ImgInspector item={selectedImageItem} />
        </div>
      )}
    </div>
  );
};
