import React, { useMemo } from 'react';
import { FEATURE_HIDE_TRACKS, FEATURE_ROLLING_EDITS } from '../../flags';
import { TrackType } from '../../state/types';
import { useAllItems } from '../../utils/use-context';
import { TimelineItem } from '../timeline-item/timeline-item';
import { TimelineTrackRollingEdits } from './timeline-track-rolling-edits';

const isDev = process.env.NODE_ENV === 'development';

const TimelineTrackUnmemoized = ({
  track,
  visibleFrames,
  top,
  height,
  entryAnimationDelays,
}: {
  track: TrackType;
  visibleFrames: number;
  top: number;
  height: number;
  entryAnimationDelays: Record<string, number>;
}) => {
  const { items } = useAllItems();

  const style = useMemo((): React.CSSProperties => {
    if (!FEATURE_HIDE_TRACKS) {
      return {};
    }

    return {
      opacity: track.hidden ? 0.3 : 1,
    };
  }, [track.hidden]);

  return (
    <div className="relative" data-hidden={track.hidden} style={style}>
      {isDev ? (
        <div
          aria-hidden
          className="pointer-events-none absolute left-[-120px] z-50 font-mono text-[7px] text-white"
          style={{ top: top + 2 }}
        >
          {track.id}
        </div>
      ) : null}
      {track.items.map((item) => {
        return (
          <TimelineItem
            key={item}
            item={items[item]}
            visibleFrames={visibleFrames}
            top={top}
            height={height}
            trackMuted={track.muted}
            entryAnimationDelaySeconds={entryAnimationDelays[item]}
          />
        );
      })}
      {FEATURE_ROLLING_EDITS && (
        <TimelineTrackRollingEdits
          items={track.items}
          allItems={items}
          visibleFrames={visibleFrames}
          top={top}
          height={height}
        />
      )}
    </div>
  );
};

export const TimelineTrack = React.memo(TimelineTrackUnmemoized);
