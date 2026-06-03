'use client';

import { create } from 'zustand';

type SilentTranscriptionStore = {
  /** Asset IDs that should not show transcription toasts */
  silentAssetIds: Set<string>;
  /** Whether the AI agent is currently processing (tool calls in progress) */
  isAiAgentActive: boolean;
  /** Mark an asset as silent (no transcription toast) */
  addSilentAsset: (assetId: string) => void;
  /** Remove an asset from silent list */
  removeSilentAsset: (assetId: string) => void;
  /** Check if an asset should be silent */
  isSilentAsset: (assetId: string) => boolean;
  /** Set AI agent active state */
  setAiAgentActive: (isActive: boolean) => void;
  /** Check if transcription toast should be suppressed for this asset */
  shouldSuppressToast: (assetId: string) => boolean;
  /** Reset the store */
  reset: () => void;
};

export const useSilentTranscriptionStore = create<SilentTranscriptionStore>()((set, get) => ({
  silentAssetIds: new Set(),
  isAiAgentActive: false,
  addSilentAsset: (assetId) =>
    set((state) => ({
      silentAssetIds: new Set([...state.silentAssetIds, assetId]),
    })),
  removeSilentAsset: (assetId) =>
    set((state) => {
      const newSet = new Set(state.silentAssetIds);
      newSet.delete(assetId);
      return { silentAssetIds: newSet };
    }),
  isSilentAsset: (assetId) => get().silentAssetIds.has(assetId),
  setAiAgentActive: (isActive) => set({ isAiAgentActive: isActive }),
  shouldSuppressToast: (assetId) => {
    const state = get();
    return state.silentAssetIds.has(assetId) || state.isAiAgentActive;
  },
  reset: () => set({ silentAssetIds: new Set(), isAiAgentActive: false }),
}));
