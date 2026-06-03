'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAllItems, useSelectedItems } from '../utils/use-context';
import { StateInitializedContext } from '../context-provider';

export type SidebarPanelType = 'assets' | 'text' | 'solid' | 'image' | 'captions' | 'motion-design' | 'inspector';

interface SidebarPanelContextType {
  activePanel: SidebarPanelType;
  setActivePanel: (panel: SidebarPanelType) => void;
}

const SidebarPanelContext = createContext<SidebarPanelContextType>({
  activePanel: 'assets',
  setActivePanel: () => {},
});

export const useSidebarPanel = () => {
  const context = useContext(SidebarPanelContext);
  if (!context) {
    throw new Error('useSidebarPanel must be used within a SidebarPanelProvider');
  }
  return context;
};

// Helper to determine panel type based on item type
const getPanelForItemType = (itemType: string): SidebarPanelType => {
  if (itemType === 'text') return 'text';
  if (itemType === 'solid') return 'solid';
  if (itemType === 'image') return 'image';
  if (itemType === 'captions') return 'captions';
  if (itemType === 'motion-design') return 'motion-design';
  // video, audio, gif use inspector
  return 'inspector';
};

export const SidebarPanelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePanel, setActivePanel] = useState<SidebarPanelType>('assets');
  const { selectedItems } = useSelectedItems();
  const { items } = useAllItems();
  const initialized = useContext(StateInitializedContext);

  // Auto-switch panel based on selected item
  useEffect(() => {
    if (!initialized) return;

    if (selectedItems.length === 1) {
      const item = items[selectedItems[0]];
      if (item) {
        const panelForItem = getPanelForItemType(item.type);
        setActivePanel(panelForItem);
      }
    } else if (selectedItems.length === 0) {
      // Default to assets when nothing selected
      setActivePanel('assets');
    }
  }, [selectedItems, items, initialized]);

  const value = useMemo(
    () => ({
      activePanel,
      setActivePanel,
    }),
    [activePanel],
  );

  return <SidebarPanelContext.Provider value={value}>{children}</SidebarPanelContext.Provider>;
};
