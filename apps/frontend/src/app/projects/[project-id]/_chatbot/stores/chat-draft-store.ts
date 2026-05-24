'use client';

import { create } from 'zustand';

type ChatDraftStore = {
  draftInput: string;
  setDraftInput: (value: string) => void;
  clearDraftInput: () => void;
};

export const useChatDraftStore = create<ChatDraftStore>()((set) => ({
  draftInput: '',
  setDraftInput: (value) => set({ draftInput: value }),
  clearDraftInput: () => set({ draftInput: '' }),
}));

