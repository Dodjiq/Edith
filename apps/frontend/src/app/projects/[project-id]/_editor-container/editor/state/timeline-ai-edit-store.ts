'use client';

import { create } from 'zustand';

type TimelineAiEditStore = {
  activeItemIds: Set<string>;
  setActiveItemIds: (itemIds: string[]) => void;
  clearActiveItemIds: () => void;
};

export const useTimelineAiEditStore = create<TimelineAiEditStore>()((set) => ({
  activeItemIds: new Set(),
  setActiveItemIds: (itemIds) => set({ activeItemIds: new Set(itemIds) }),
  clearActiveItemIds: () => set({ activeItemIds: new Set() }),
}));

