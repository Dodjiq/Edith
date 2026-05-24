import { AudioItem } from '../../../items/audio/audio-item-type';
import { CaptionsItem } from '../../../items/captions/captions-item-type';
import { GifItem } from '../../../items/gif/gif-item-type';
import { EditorStarterItem } from '../../../items/item-type';
import { VideoItem } from '../../../items/video/video-item-type';

/**
 * Gets the current source offset in seconds for time-based items.
 */
export const getSourceOffsetInSeconds = (item: EditorStarterItem): number => {
  switch (item.type) {
    case 'video':
      return (item as VideoItem).videoStartFromInSeconds ?? 0;
    case 'audio':
      return (item as AudioItem).audioStartFromInSeconds ?? 0;
    case 'gif':
      return (item as GifItem).gifStartFromInSeconds ?? 0;
    case 'captions':
      return (item as CaptionsItem).captionStartInSeconds ?? 0;
    default:
      return 0;
  }
};

/**
 * Creates a copy of the item with an adjusted source offset.
 * For items without source offsets (image, text, solid), returns the item unchanged.
 */
export const setSourceOffsetInSeconds = (
  item: EditorStarterItem,
  offsetInSeconds: number,
): EditorStarterItem => {
  const copy = { ...item };

  switch (copy.type) {
    case 'video':
      (copy as VideoItem).videoStartFromInSeconds = offsetInSeconds;
      break;
    case 'audio':
      (copy as AudioItem).audioStartFromInSeconds = offsetInSeconds;
      break;
    case 'gif':
      (copy as GifItem).gifStartFromInSeconds = offsetInSeconds;
      break;
    case 'captions':
      (copy as CaptionsItem).captionStartInSeconds = offsetInSeconds;
      break;
    default:
      // Items without source offset (image, text, solid) remain unchanged
      break;
  }

  return copy;
};
