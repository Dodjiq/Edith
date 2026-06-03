'use client';

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useQueryState, parseAsBoolean } from 'nuqs';

type DevModeContextValue = {
  isDevMode: boolean;
  setDevMode: (value: boolean | null) => void;
  toggleDevMode: () => void;
};

const DevModeContext = createContext<DevModeContextValue | null>(null);

const isProductionBuild = process.env.NODE_ENV === 'production';

export const DevModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Don't use withDefault so we can distinguish "not set" (null) from "explicitly set"
  const [devModeParam, setDevModeParam] = useQueryState('devMode', parseAsBoolean);

  // When param is null (not in URL):
  //   - Development: devMode is ON by default
  //   - Production: devMode is OFF by default
  // When param is explicitly set, use that value
  const isDevMode = devModeParam ?? !isProductionBuild;

  const toggleDevMode = useCallback(() => {
    setDevModeParam((current) => !(current ?? !isProductionBuild));
  }, [setDevModeParam]);

  const value = useMemo(
    () => ({
      isDevMode,
      setDevMode: setDevModeParam,
      toggleDevMode,
    }),
    [isDevMode, setDevModeParam, toggleDevMode]
  );

  return <DevModeContext.Provider value={value}>{children}</DevModeContext.Provider>;
};

export const useDevMode = (): DevModeContextValue => {
  const context = useContext(DevModeContext);

  if (!context) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }

  return context;
};

export const useIsDevMode = (): boolean => {
  const { isDevMode } = useDevMode();
  return isDevMode;
};
