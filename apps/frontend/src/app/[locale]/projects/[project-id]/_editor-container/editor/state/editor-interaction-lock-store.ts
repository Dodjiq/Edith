'use client';

import { create } from 'zustand';
import type { ChatInteractionLockState } from '../../../_chatbot/utils/chat-activity';

type EditorInteractionLockStore = {
  lock: ChatInteractionLockState;
  setLock: (lock: ChatInteractionLockState) => void;
};

export const useEditorInteractionLockStore = create<EditorInteractionLockStore>()((set) => ({
  lock: null,
  setLock: (lock) => set({ lock }),
}));
