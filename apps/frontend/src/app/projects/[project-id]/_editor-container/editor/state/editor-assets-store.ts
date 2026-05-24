'use client';

//! This store is used to store the assets and the original assets that Remotion can't provide

import { create } from 'zustand';
import { EditorStarterAsset } from '../assets/assets';
import { EditorStarterItem } from '../items/item-type';
import { TrackType } from './types';

export type EditorAssetRecord = {
  id: string;
  rawTranscription: string;
  trackId: string | null;
  durationInFrames: number;
  durationInSeconds: number;
  startFrame: number;
  endFrame: number;
  startSeconds: number;
  endSeconds: number;
  fileName: string;
  type: EditorStarterAsset['type'];
};

/** Segment removed from source media (timestamps relative to original source) */
export type RemovedSegmentFromSource = {
  /** Start time in the original source file (seconds) */
  sourceStartInSeconds: number;
  /** End time in the original source file (seconds) */
  sourceEndInSeconds: number;
  /** Duration of the removed segment (seconds) */
  durationInSeconds: number;
};

/** Tracks modifications made to an original asset */
export type OriginalAssetRecord = {
  assetId: string;
  remoteUrl: string;
  /** Original file name of the asset */
  fileName: string;
  /** Total duration of the original source file in seconds */
  originalDurationInSeconds: number;
  /** Segments that have been removed from this source (e.g. silences) */
  removedSegments: RemovedSegmentFromSource[];
  /** When segments were last modified */
  lastModifiedAt: number;
};

type SyncInput = {
  items: Record<string, EditorStarterItem>;
  assets: Record<string, EditorStarterAsset>;
  fps: number;
  tracks: TrackType[] | undefined;
};

type RegisterRemovedSegmentsInput = {
  assetId: string;
  remoteUrl: string;
  fileName: string;
  originalDurationInSeconds: number;
  removedSegments: RemovedSegmentFromSource[];
};

type EditorAssetsStore = {
  assets: EditorAssetRecord[];
  /** Original assets with their modification history (removed segments, etc.) */
  originalAssets: Record<string, OriginalAssetRecord>;
  syncFromEditorState: (input: SyncInput) => void;
  setTranscriptionKey: (itemId: string, transcriptionKey: string) => void;
  /** Register removed segments for an original asset (e.g. after silence removal) */
  registerRemovedSegments: (input: RegisterRemovedSegmentsInput) => void;
  /** Get the original asset record for an asset ID */
  getOriginalAsset: (assetId: string) => OriginalAssetRecord | undefined;
  setOriginalAssets: (originalAssets: Record<string, OriginalAssetRecord>) => void;
  reset: () => void;
};

const buildTrackIndex = (tracks: TrackType[] | undefined | null) => {
  const index = new Map<string, string>();
  if (!Array.isArray(tracks)) {
    return index;
  }

  for (const track of tracks) {
    for (const itemId of track.items) {
      index.set(itemId, track.id);
    }
  }
  return index;
};

const buildAssets = ({ items, assets, fps, tracks }: SyncInput, previous: EditorAssetRecord[]) => {
  const transcriptionMap = new Map(previous.map(({ id, rawTranscription }) => [id, rawTranscription]));

  const trackIndex = buildTrackIndex(tracks);

  return Object.values(items)
    .filter((item): item is EditorStarterItem & { assetId: string } => 'assetId' in item)
    .map<EditorAssetRecord | null>((item) => {
      const asset = assets[item.assetId];
      if (!asset) {
        return null;
      }

      return {
        id: item.id,
        rawTranscription: transcriptionMap.get(item.id) ?? '',
        trackId: trackIndex.get(item.id) ?? null,
        durationInFrames: item.durationInFrames,
        durationInSeconds: item.durationInFrames / fps,
        startFrame: item.from,
        endFrame: item.from + item.durationInFrames,
        startSeconds: item.from / fps,
        endSeconds: (item.from + item.durationInFrames) / fps,
        fileName: asset.filename,
        type: asset.type,
      };
    })
    .filter((entry): entry is EditorAssetRecord => Boolean(entry));
};

//! Store only to get information that remotion store can't provide
export const useEditorAssetsStore = create<EditorAssetsStore>()((set, get) => ({
  assets: [],
  originalAssets: {},
  syncFromEditorState: (input) =>
    set((state) => ({
      assets: buildAssets(input, state.assets),
    })),
  setTranscriptionKey: (itemId, transcriptionKey) =>
    set((state) => ({
      assets: state.assets.map((asset) => (asset.id === itemId ? { ...asset, transcriptionKey } : asset)),
    })),
  registerRemovedSegments: (input) =>
    set((state) => {
      const existing = state.originalAssets[input.assetId];
      const mergedSegments = existing
        ? mergeRemovedSegments([...existing.removedSegments, ...input.removedSegments])
        : input.removedSegments;

      return {
        originalAssets: {
          ...state.originalAssets,
          [input.assetId]: {
            assetId: input.assetId,
            remoteUrl: input.remoteUrl,
            fileName: input.fileName,
            originalDurationInSeconds: input.originalDurationInSeconds,
            removedSegments: mergedSegments,
            lastModifiedAt: Date.now(),
          },
        },
      };
    }),
  getOriginalAsset: (assetId) => get().originalAssets[assetId],
  setOriginalAssets: (originalAssets) => set({ originalAssets }),
  reset: () => set({ assets: [], originalAssets: {} }),
}));

/** Merge overlapping or adjacent removed segments */
const mergeRemovedSegments = (segments: RemovedSegmentFromSource[]): RemovedSegmentFromSource[] => {
  if (segments.length === 0) return [];

  const sorted = [...segments].sort((a, b) => a.sourceStartInSeconds - b.sourceStartInSeconds);
  const merged: RemovedSegmentFromSource[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];

    if (current.sourceStartInSeconds <= last.sourceEndInSeconds) {
      last.sourceEndInSeconds = Math.max(last.sourceEndInSeconds, current.sourceEndInSeconds);
      last.durationInSeconds = last.sourceEndInSeconds - last.sourceStartInSeconds;
    } else {
      merged.push(current);
    }
  }

  return merged;
};
