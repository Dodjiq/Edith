import { EditorStarterItem } from '../../../items/item-type';

/**
 * Represents a segment of the source item to keep after splicing.
 */
export type KeepRange = {
  /** Frame position on the timeline where this segment starts (absolute) */
  timelineStartFrame: number;
  /** Frame offset in the source media where this segment starts */
  sourceOffsetInFrames: number;
  /** Duration of this segment in frames */
  durationInFrames: number;
};

export type SpliceItemParams = {
  /** The item ID to splice */
  itemId: string;
  /** Track ID where the item lives */
  trackId: string;
  /** Frame ranges to keep (segments to preserve) */
  keepRanges: KeepRange[];
  /** Frames per second for offset calculations */
  fps: number;
};

export type SpliceItemResult = {
  /** The original item that was removed */
  sourceItem: EditorStarterItem;
  /** New items created from the kept ranges */
  createdItems: EditorStarterItem[];
  /** Total frames removed (gaps between kept ranges + trimmed edges) */
  totalRemovedFrames: number;
};
