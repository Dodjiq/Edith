import { TIMELINE_HORIZONTAL_PADDING } from '../constants';
import { TICKS_HEIGHT } from '../timeline/ticks/constants';
import { SIDE_PANEL_WIDTH } from '../timeline/timeline-side-panel/timeline-side-panel';
import { EditorState } from '../state/types';
import { getVisibleFrames } from './get-visible-frames';
import { getCompositionDuration } from './get-composition-duration';
import { getItemLeftOffset, getOffsetOfTrack } from './position-utils';
import { timelineScrollContainerRef, timelineScrollableContainerRef } from './restore-scroll-after-zoom';

export const revealTimelinePosition = ({ state, frame, trackId }: { state: EditorState; frame: number; trackId: string }) => {
  const scrollContainer = timelineScrollContainerRef.current;
  const scrollableContainer = timelineScrollableContainerRef.current;

  if (!scrollContainer || !scrollableContainer) {
    return;
  }

  const timelineWidth = scrollableContainer.clientWidth - TIMELINE_HORIZONTAL_PADDING * 2;
  if (!Number.isFinite(timelineWidth) || timelineWidth <= 0) {
    return;
  }

  const durationInFrames = getCompositionDuration(Object.values(state.undoableState.items));
  const visibleFrames = getVisibleFrames({
    fps: state.undoableState.fps,
    totalDurationInFrames: durationInFrames,
  });

  const clampedFrame = Math.max(0, Math.min(visibleFrames - 1, Math.round(frame)));

  const leftWithinTimeline =
    getItemLeftOffset({
      timelineWidth,
      totalDurationInFrames: visibleFrames,
      from: clampedFrame,
    }) + TIMELINE_HORIZONTAL_PADDING;

  const timelineViewportWidth = Math.max(0, scrollContainer.clientWidth - SIDE_PANEL_WIDTH);
  const desiredScrollLeft = leftWithinTimeline - timelineViewportWidth / 2;
  const maxScrollLeft = Math.max(0, scrollContainer.scrollWidth - scrollContainer.clientWidth);
  const clampedScrollLeft = Math.max(0, Math.min(maxScrollLeft, desiredScrollLeft));

  const tracks = state.undoableState.tracks;
  const trackIndex = tracks.findIndex((t) => t.id === trackId);
  const trackOffset = trackIndex === -1 ? 0 : getOffsetOfTrack({ trackIndex, tracks, items: state.undoableState.items });

  const timelineViewportHeight = Math.max(0, scrollContainer.clientHeight - TICKS_HEIGHT);
  const desiredScrollTop = TICKS_HEIGHT + trackOffset - timelineViewportHeight / 2;
  const maxScrollTop = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
  const clampedScrollTop = Math.max(0, Math.min(maxScrollTop, desiredScrollTop));

  scrollContainer.scrollTo({
    left: clampedScrollLeft,
    top: clampedScrollTop,
    behavior: 'smooth',
  });
};

