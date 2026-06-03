import React, { memo, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { FEATURE_VISUAL_FADE_CONTROL } from '../../flags';
import { AudioItem } from '../../items/audio/audio-item-type';
import { EditorStarterItem } from '../../items/item-type';
import { VideoItem } from '../../items/video/video-item-type';
import { TRACK_PADDING } from '../../state/items';
import { getCanFadeVisual } from '../../utils/fade';
import { getItemLeftOffset, getItemRoundedPosition, getItemWidth } from '../../utils/position-utils';
import { useSelectedItems } from '../../utils/use-context';
import { useFadeControlHoverState } from '../../utils/use-fade-control-hover-state';
import { useTimelineSize } from '../utils/use-timeline-size';
import { TimelineItemContent } from './timeline-item-content';
import { ItemContextMenuTrigger } from './timeline-item-context-menu-trigger';
import { TimelineItemExtendHandles } from './timeline-item-extend-handles/timeline-item-extend-handles';
import { ItemFadeHandles } from './timeline-item-fade-control/item-fade-handles';
import { shouldShowAudioFadeControl } from './timeline-item-fade-control/should-show-audio-fade-control';
import { TimelineItemIsBeingTrimmedIndicator } from './timeline-item-is-being-trimmed-indicator';
import { TimelineItemContainer } from './timeline-item-layout';
import { getWaveformHeight } from './timeline-item-waveform';

type TimelineItemProps = {
  item: EditorStarterItem;
  visibleFrames: number;
  top: number;
  height: number;
  trackMuted: boolean;
  entryAnimationDelaySeconds?: number;
};

const TimelineItemInner = memo(
  ({ item, visibleFrames, top, height, trackMuted, entryAnimationDelaySeconds }: TimelineItemProps) => {
    const { timelineWidth } = useTimelineSize();
    if (timelineWidth === null) {
      throw new Error('Timeline width is null');
    }

    const { selectedItems } = useSelectedItems();

    const timelineItemWidth = getItemWidth({
      itemDurationInFrames: item.durationInFrames,
      timelineWidth,
      totalDurationInFrames: visibleFrames,
    });

    const timelineItemLeft = getItemLeftOffset({
      timelineWidth,
      totalDurationInFrames: visibleFrames,
      from: item.from,
    });

    const pixelsPerFrame = timelineWidth / visibleFrames;

    const { roundedLeft, width, roundedDifference } = getItemRoundedPosition(timelineItemLeft, timelineItemWidth);

    const style: React.CSSProperties = useMemo(() => {
      return {
        width,
        left: roundedLeft,
        top: top + TRACK_PADDING / 2,
        height: height - TRACK_PADDING,
        position: 'absolute',
      };
    }, [width, roundedLeft, top, height]);

    const isSelected = selectedItems.includes(item.id);
    const hoverRef = useRef<HTMLDivElement | null>(null);
    const hover = useFadeControlHoverState(hoverRef, getWaveformHeight({ item, trackHeight: height }));

    const itemWidthPx = item.durationInFrames * pixelsPerFrame;

    const entryAnimation = useMemo(() => {
      if (entryAnimationDelaySeconds === undefined) {
        return {
          initial: false,
          animate: { opacity: 1, scale: 1, y: 0 },
          transition: { duration: 0 },
        };
      }

      return {
        initial: { opacity: 0, scale: 0.98, y: 6 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: {
          duration: 0.2,
          ease: 'easeOut' as const,
          delay: entryAnimationDelaySeconds,
        },
      };
    }, [entryAnimationDelaySeconds]);

    return (
      <ItemContextMenuTrigger item={item}>
        <motion.div
          ref={hoverRef}
          style={style}
          initial={entryAnimation.initial}
          animate={entryAnimation.animate}
          transition={entryAnimation.transition}
        >
          <TimelineItemContainer isSelected={isSelected} item={item}>
            <TimelineItemContent
              item={item}
              height={height}
              width={width}
              roundedDifference={roundedDifference}
              trackMuted={trackMuted}
            />
            <TimelineItemIsBeingTrimmedIndicator item={item} side="left" />
            <TimelineItemIsBeingTrimmedIndicator item={item} side="right" />
          </TimelineItemContainer>
          <TimelineItemExtendHandles item={item} width={width} timelineWidth={timelineWidth} height={height} />
          {shouldShowAudioFadeControl({ item }) ? (
            <ItemFadeHandles
              item={item as AudioItem | VideoItem}
              width={itemWidthPx}
              itemHeight={height}
              hovered={hover === 'audio-section'}
              fadeType="audio"
            />
          ) : null}
          {getCanFadeVisual(item) && FEATURE_VISUAL_FADE_CONTROL ? (
            <ItemFadeHandles
              item={item}
              width={itemWidthPx}
              itemHeight={height}
              hovered={hover === 'video-section'}
              fadeType="visual"
            />
          ) : null}
        </motion.div>
      </ItemContextMenuTrigger>
    );
},
);

TimelineItemInner.displayName = 'TimelineItemInner';

export const TimelineItem = memo(
  ({
    item,
    visibleFrames,
    top,
    height,
    trackMuted,
    entryAnimationDelaySeconds,
  }: {
    item: EditorStarterItem;
    visibleFrames: number;
    top: number;
    height: number;
    trackMuted: boolean;
    entryAnimationDelaySeconds?: number;
  }) => {
    // Hide the item if it's being dragged
    if (item.isDraggingInTimeline) {
      return null;
    }

    return (
      <TimelineItemInner
        item={item}
        visibleFrames={visibleFrames}
        top={top}
        height={height}
        trackMuted={trackMuted}
        entryAnimationDelaySeconds={entryAnimationDelaySeconds}
      />
    );
  },
);

TimelineItem.displayName = 'TimelineItem';
