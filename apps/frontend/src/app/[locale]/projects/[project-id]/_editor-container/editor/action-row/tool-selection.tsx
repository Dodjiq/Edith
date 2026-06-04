'use client';

import { PlayerRef } from '@remotion/player';
import { useTranslations } from 'next-intl';
import React, { useCallback, useContext } from 'react';
import { IconButton } from '@/components/buttons/IconButton';
import { Tooltip, TooltipTrigger, TooltipPanel } from '@/components/ui/tooltip';
import { MEDIA_UPLOAD_CONFIG } from '@/config/media-upload';
import { useFileLoadingToast } from '@/hooks/use-file-loading-toast';
import { addAsset } from '../assets/add-asset';
import { EditModeContext } from '../edit-mode';
import { EditModeIcon } from '../icons/edit-mode';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import { useProjectId } from '../utils/use-project-id';

export const ToolSelection: React.FC<{
  playerRef: React.RefObject<PlayerRef | null>;
}> = ({ playerRef }) => {
  const t = useTranslations('projects_editor.tools');
  const timelineWriteContext = useWriteContext();
  const projectId = useProjectId();
  const { editMode, setEditMode } = useContext(EditModeContext);
  const { markFilePickerClosed, dismissLoadingToast, processFilesWithProgress, cancellationTimeoutRef } =
    useFileLoadingToast();

  const setSelectEditMode = useCallback(() => {
    setEditMode('select');
  }, [setEditMode]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const stateAsRef = useCurrentStateAsRef();

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
      // Allow for more files to be added
      e.target.value = '';
    },
    [markFilePickerClosed, cancellationTimeoutRef, dismissLoadingToast, processFilesWithProgress, handleFilesReady],
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={MEDIA_UPLOAD_CONFIG.accept}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
      <div className="flex items-center gap-1 overflow-hidden rounded bg-white/5">
        <Tooltip delay={1500}>
          <TooltipTrigger asChild>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={setSelectEditMode}
              aria-label={t('cursor')}
              data-active={editMode === 'select'}
              className="text-white data-[active=true]:bg-white/10"
            >
              <EditModeIcon fill="none" stroke="currentColor" strokeWidth="2" className="w-4" />
            </IconButton>
          </TooltipTrigger>
          <TooltipPanel>{t('cursor')}</TooltipPanel>
        </Tooltip>
      </div>
    </>
  );
};
