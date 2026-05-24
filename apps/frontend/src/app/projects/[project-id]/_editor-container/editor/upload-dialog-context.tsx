'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface UploadDialogContextType {
  isUploadDialogOpen: boolean;
  openUploadDialog: () => void;
  closeUploadDialog: () => void;
}

const UploadDialogContext = createContext<UploadDialogContextType | null>(null);

export const UploadDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(true);

  const openUploadDialog = useCallback(() => {
    setIsUploadDialogOpen(true);
  }, []);

  const closeUploadDialog = useCallback(() => {
    setIsUploadDialogOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isUploadDialogOpen,
      openUploadDialog,
      closeUploadDialog,
    }),
    [isUploadDialogOpen, openUploadDialog, closeUploadDialog],
  );

  return <UploadDialogContext.Provider value={value}>{children}</UploadDialogContext.Provider>;
};

export const useUploadDialog = (): UploadDialogContextType => {
  const context = useContext(UploadDialogContext);
  if (!context) {
    throw new Error('useUploadDialog must be used within a UploadDialogProvider');
  }
  return context;
};

