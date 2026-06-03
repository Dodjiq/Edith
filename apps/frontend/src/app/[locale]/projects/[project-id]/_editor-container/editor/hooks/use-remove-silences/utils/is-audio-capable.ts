import { EditorStarterItem } from '../../../items/item-type';
import { AudioCapableItem } from '../types';

export const isAudioCapable = (item: EditorStarterItem | undefined): item is AudioCapableItem =>
  Boolean(item && (item.type === 'video' || item.type === 'audio'));
