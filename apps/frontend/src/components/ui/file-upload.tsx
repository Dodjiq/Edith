'use client';

import type React from 'react';
import { useRef, useCallback } from 'react';
import { Button } from '@/components/buttons/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/cards/card';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  X,
  CheckCircle,
  Loader2,
  Video,
  Music,
  Image as ImageIcon,
  File,
  AudioLines,
  AlertCircle,
} from 'lucide-react';
import { MEDIA_UPLOAD_CONFIG, getMediaType } from '@/config/media-upload';
import { useFileLoadingToast } from '@/hooks/use-file-loading-toast';

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'transcribing' | 'completed' | 'error';
}

interface FileUploadProps {
  uploads: UploadItem[];
  onFilesAdded: (files: File[]) => void;
  onRemoveUpload?: (id: string) => void;
  accept?: string;
}

const getFileIcon = (filename: string) => {
  const mediaType = getMediaType(filename);

  switch (mediaType) {
    case 'video':
      return <Video className="size-4" />;
    case 'audio':
      return <Music className="size-4" />;
    case 'image':
      return <ImageIcon className="size-4" />;
    default:
      return <File className="size-4" />;
  }
};

export const FileUpload: React.FC<FileUploadProps> = ({
  uploads,
  onFilesAdded,
  onRemoveUpload,
  accept = MEDIA_UPLOAD_CONFIG.accept,
}) => {
  const filePickerRef = useRef<HTMLInputElement>(null);
  const {
    showLoadingToast,
    dismissLoadingToast,
    markFilePickerOpen,
    markFilePickerClosed,
    processFilesWithProgress,
    cancellationTimeoutRef,
  } = useFileLoadingToast();

  const openFilePicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    markFilePickerOpen();
    filePickerRef.current?.click();
  };

  const onFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      markFilePickerClosed();

      if (cancellationTimeoutRef.current) {
        clearTimeout(cancellationTimeoutRef.current);
        cancellationTimeoutRef.current = null;
      }

      const selectedFiles = event.target.files;

      if (selectedFiles && selectedFiles.length > 0) {
        const filesArray = Array.from(selectedFiles);
        await processFilesWithProgress(filesArray, onFilesAdded);
        event.target.value = '';
      } else {
        dismissLoadingToast();
      }
    },
    [dismissLoadingToast, markFilePickerClosed, processFilesWithProgress, onFilesAdded, cancellationTimeoutRef],
  );

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const onDropFiles = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      const droppedFiles = event.dataTransfer.files;

      if (droppedFiles && droppedFiles.length > 0) {
        const filesArray = Array.from(droppedFiles);
        showLoadingToast();
        await processFilesWithProgress(filesArray, onFilesAdded);
      }
    },
    [processFilesWithProgress, showLoadingToast, onFilesAdded],
  );

  const activeUploads = uploads.filter((file) => file.status === 'uploading');
  const transcribingUploads = uploads.filter((file) => file.status === 'transcribing');
  const completedUploads = uploads.filter((file) => file.status === 'completed');
  const errorUploads = uploads.filter((file) => file.status === 'error');

  return (
    <div className="flex w-full flex-col gap-y-6">
      <Card
        className="hover:bg-muted/50 group flex max-h-[200px] w-full cursor-pointer flex-col items-center justify-center gap-4 border-dashed py-8 text-sm transition-colors"
        onDragOver={onDragOver}
        onDrop={onDropFiles}
        onClick={openFilePicker}
      >
        <div className="grid space-y-3">
          <div className="text-muted-foreground flex items-center gap-x-2">
            <Upload className="size-5" />
            <div>
              Drop files here or{' '}
              <Button variant="link" className="text-primary h-auto p-0 font-normal" onClick={openFilePicker}>
                browse files
              </Button>{' '}
              to add
            </div>
          </div>
        </div>
        <input
          ref={filePickerRef}
          type="file"
          className="hidden"
          multiple
          accept={accept}
          onChange={onFileInputChange}
        />
        <span className="text-muted-foreground mt-2 block text-base/6 group-disabled:opacity-50 sm:text-xs">
          Supported: {MEDIA_UPLOAD_CONFIG.description} (max 5 GB per file)
        </span>
      </Card>

      {uploads.length > 0 && (
        <div className="flex flex-col gap-y-4">
          {activeUploads.length > 0 && (
            <div>
              <h2 className="text-foreground mb-4 flex items-center font-mono text-lg font-normal uppercase sm:text-xs">
                <Loader2 className="mr-1 size-4 animate-spin" />
                Uploading
              </h2>
              <div className="-mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
                {activeUploads.map((file) => (
                  <div key={file.id} className="group/item flex items-center py-4">
                    <div className="bg-muted text-muted-foreground relative mr-3 grid size-10 shrink-0 place-content-center rounded border">
                      <span className="group-hover/item:hidden">{getFileIcon(file.name)}</span>
                      {onRemoveUpload ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground absolute inset-0 hidden size-full p-0 group-hover/item:flex"
                          onClick={() => onRemoveUpload(file.id)}
                          aria-label="Cancel"
                        >
                          <X className="size-4" />
                        </Button>
                      ) : (
                        <span className="hidden group-hover/item:block">{getFileIcon(file.name)}</span>
                      )}
                    </div>
                    <div className="mb-1 flex w-full flex-col">
                      <div className="flex justify-between">
                        <span className="text-foreground max-w-[200px] select-none truncate text-base/6 group-disabled:opacity-50 sm:text-sm/6">
                          {file.name}
                        </span>
                        <span className="text-muted-foreground text-sm tabular-nums">{Math.round(file.progress)}%</span>
                      </div>
                      <Progress value={file.progress} className="mt-1 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeUploads.length > 0 && (transcribingUploads.length > 0 || completedUploads.length > 0) && (
            <Separator className="my-0" />
          )}

          {transcribingUploads.length > 0 && (
            <div>
              <h2 className="text-foreground mb-4 flex items-center font-mono text-lg font-normal uppercase sm:text-xs">
                <AudioLines className="mr-1 size-4 animate-pulse" />
                Processing
              </h2>
              <div className="-mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
                {transcribingUploads.map((file) => (
                  <div key={file.id} className="group/item flex items-center py-4">
                    <div className="bg-muted text-muted-foreground relative mr-3 grid size-10 shrink-0 place-content-center rounded border">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="mb-1 flex w-full flex-col">
                      <div className="flex justify-between">
                        <span className="text-foreground max-w-[200px] select-none truncate text-base/6 group-disabled:opacity-50 sm:text-sm/6">
                          {file.name}
                        </span>
                        <span className="text-muted-foreground text-sm">Processing...</span>
                      </div>
                      <div className="bg-muted mt-1 h-2 w-full overflow-hidden rounded-full">
                        <div className="bg-primary h-full w-full origin-left animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transcribingUploads.length > 0 && completedUploads.length > 0 && <Separator className="my-0" />}

          {completedUploads.length > 0 && (
            <div>
              <h2 className="text-foreground mb-4 flex items-center font-mono text-lg font-normal uppercase sm:text-xs">
                <CheckCircle className="mr-1 size-4" />
                Finished
              </h2>
              <div className="-mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
                {completedUploads.map((file) => (
                  <div key={file.id} className="group/item flex items-center py-4">
                    <div className="bg-muted text-muted-foreground relative mr-3 grid size-10 shrink-0 place-content-center rounded border-amber-300">
                      <span className="group-hover/item:hidden">{getFileIcon(file.name)}</span>
                      {onRemoveUpload ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground absolute inset-0 hidden size-full p-0 group-hover/item:flex"
                          onClick={() => onRemoveUpload(file.id)}
                          aria-label="Remove"
                        >
                          <X className="size-4" />
                        </Button>
                      ) : (
                        <span className="hidden group-hover/item:block">{getFileIcon(file.name)}</span>
                      )}
                    </div>
                    <div className="mb-1 flex w-full flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-foreground max-w-[300px] select-none truncate text-base/6 group-disabled:opacity-50 sm:text-sm/6">
                          {file.name}
                        </span>
                        <CheckCircle className="size-4 shrink-0 text-green-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedUploads.length > 0 && errorUploads.length > 0 && <Separator className="my-0" />}

          {errorUploads.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center font-mono text-lg font-normal uppercase text-red-500 sm:text-xs">
                <AlertCircle className="mr-1 size-4" />
                Failed
              </h2>
              <div className="-mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
                {errorUploads.map((file) => (
                  <div key={file.id} className="group/item flex items-center py-4">
                    <div className="relative mr-3 grid size-10 shrink-0 place-content-center rounded border border-red-500/30 bg-red-500/10 text-red-500">
                      <span className="group-hover/item:hidden">{getFileIcon(file.name)}</span>
                      {onRemoveUpload ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute inset-0 hidden size-full p-0 text-red-500 hover:text-red-400 group-hover/item:flex"
                          onClick={() => onRemoveUpload(file.id)}
                          aria-label="Remove"
                        >
                          <X className="size-4" />
                        </Button>
                      ) : (
                        <span className="hidden group-hover/item:block">{getFileIcon(file.name)}</span>
                      )}
                    </div>
                    <div className="mb-1 flex w-full flex-col">
                      <div className="flex items-center justify-between gap-2">
                        <span className="max-w-[300px] select-none truncate text-base/6 text-red-500 sm:text-sm/6">
                          {file.name}
                        </span>
                        <AlertCircle className="size-4 shrink-0 text-red-500" />
                      </div>
                      <span className="text-muted-foreground mt-1 text-xs">Upload or transcription failed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
