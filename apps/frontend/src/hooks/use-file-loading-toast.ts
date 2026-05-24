'use client';

import { useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const useFileLoadingToast = () => {
  const isFilePickerOpenRef = useRef<boolean>(false);
  const loadingToastIdRef = useRef<string | number | null>(null);
  const cancellationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (loadingToastIdRef.current) {
        toast.dismiss(loadingToastIdRef.current);
      }
      if (cancellationTimeoutRef.current) {
        clearTimeout(cancellationTimeoutRef.current);
      }
    };
  }, []);

  const showLoadingToast = useCallback(() => {
    if (loadingToastIdRef.current) return;
    loadingToastIdRef.current = toast.loading('Loading file into browser...', {
      description: 'Large files may take a moment to process',
      position: 'top-right',
    });
  }, []);

  const dismissLoadingToast = useCallback(() => {
    if (loadingToastIdRef.current) {
      toast.dismiss(loadingToastIdRef.current);
      loadingToastIdRef.current = null;
    }
    if (cancellationTimeoutRef.current) {
      clearTimeout(cancellationTimeoutRef.current);
      cancellationTimeoutRef.current = null;
    }
  }, []);

  const updateLoadingToast = useCallback((message: string, description?: string) => {
    if (loadingToastIdRef.current) {
      toast.loading(message, {
        id: loadingToastIdRef.current,
        description,
      });
    }
  }, []);

  const markFilePickerOpen = useCallback(() => {
    isFilePickerOpenRef.current = true;
  }, []);

  const markFilePickerClosed = useCallback(() => {
    isFilePickerOpenRef.current = false;
  }, []);

  // Handle window focus to detect file picker opening (for delayed toast)
  useEffect(() => {
    let focusTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleFocus = () => {
      if (isFilePickerOpenRef.current) {
        focusTimeoutId = setTimeout(() => {
          if (isFilePickerOpenRef.current) {
            showLoadingToast();

            cancellationTimeoutRef.current = setTimeout(() => {
              if (isFilePickerOpenRef.current && loadingToastIdRef.current) {
                dismissLoadingToast();
                isFilePickerOpenRef.current = false;
              }
            }, 500);
          }
        }, 100);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      if (focusTimeoutId) {
        clearTimeout(focusTimeoutId);
      }
    };
  }, [showLoadingToast, dismissLoadingToast]);

  const processFilesWithProgress = useCallback(
    async (files: File[], onFilesReady: (files: File[]) => void | Promise<void>) => {
      const totalSize = files.reduce((acc, f) => acc + f.size, 0);
      const hasLargeFiles = files.some((f) => f.size > LARGE_FILE_THRESHOLD);

      if (hasLargeFiles && totalSize > LARGE_FILE_THRESHOLD) {
        const filePromises = files.map((file) => {
          return new Promise<File>((resolve) => {
            if (file.size < LARGE_FILE_THRESHOLD) {
              resolve(file);
              return;
            }

            const reader = new FileReader();
            let lastUpdate = 0;

            reader.onprogress = (event) => {
              if (event.lengthComputable) {
                const now = Date.now();
                if (now - lastUpdate > 100) {
                  const percent = Math.round((event.loaded / event.total) * 100);
                  updateLoadingToast(
                    `Reading ${file.name}...`,
                    `${percent}% (${formatFileSize(event.loaded)} / ${formatFileSize(event.total)})`,
                  );
                  lastUpdate = now;
                }
              }
            };

            reader.onloadend = () => {
              resolve(file);
            };

            reader.onerror = () => {
              resolve(file);
            };

            reader.readAsArrayBuffer(file);
          });
        });

        await Promise.all(filePromises);
      }

      dismissLoadingToast();
      await onFilesReady(files);
    },
    [dismissLoadingToast, updateLoadingToast],
  );

  return {
    showLoadingToast,
    dismissLoadingToast,
    updateLoadingToast,
    markFilePickerOpen,
    markFilePickerClosed,
    processFilesWithProgress,
    isFilePickerOpenRef,
    cancellationTimeoutRef,
  };
};
