import { EditorStarterItem } from './items/item-type';

export const MIN_TIMELINE_ZOOM = 0;
export const MAX_TIMELINE_WIDTH = 40_000; // want higher max zoom? increase this value

export const PLAYHEAD_WIDTH = 19;

// Make enough space for the playhead to be visible, and add some more padding so it is not glued to the left edge
export const TIMELINE_HORIZONTAL_PADDING = Math.ceil(PLAYHEAD_WIDTH / 2) + 5;

export const scrollbarStyle: React.CSSProperties = {
  scrollbarWidth: 'thin',
  scrollbarColor: 'var(--color-editor-starter-scrollbar-thumb) var(--color-editor-starter-scrollbar-track)',
};

export const ITEM_COLORS: Record<EditorStarterItem['type'], string> = {
  image: '#3A7A44',
  gif: '#3A7A44',
  text: '#7A5DE8',
  video: '#347EBF',
  solid: '#B04BCF',
  'motion-design': '#D4942E',
  audio: '#347EBF',
  captions: '#347EBF',
};

export const DEFAULT_COMPOSITION_WIDTH = 1920;
export const DEFAULT_COMPOSITION_HEIGHT = 1080;
export const LEGACY_DEFAULT_COMPOSITION_WIDTH = 1080;
export const LEGACY_DEFAULT_COMPOSITION_HEIGHT = 1920;
export const DEFAULT_FPS = 30;

export const SCROLL_EDGE_THRESHOLD = 200; // px from edge that activates auto-scroll
export const MAX_AUTOSCROLL_SPEED = 10;

export const MAX_FADE_DURATION_SECONDS = Infinity;

// Timeline snapping
// Default pixel threshold used when evaluating proximity to snap points.
export const DEFAULT_TIMELINE_SNAPPING_THRESHOLD_PIXELS = 5;
