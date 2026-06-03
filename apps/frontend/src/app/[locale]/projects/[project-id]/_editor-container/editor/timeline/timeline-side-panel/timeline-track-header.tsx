import { useMemo } from 'react';
import { FEATURE_HIDE_TRACKS, FEATURE_MUTE_TRACKS } from '../../flags';
import { TimelineTrackAndLayout } from '../utils/drag/calculate-track-heights';
import { TimelineHideTrack } from './timeline-hide-track';
import { TimelineMuteTrack } from './timeline-mute-track';

const isDev = process.env.NODE_ENV === 'development';

export const TrackHeader = ({ name, trackAndLayout }: { name: string; trackAndLayout: TimelineTrackAndLayout }) => {
  const style = useMemo(() => {
    return {
      height: trackAndLayout.height,
    };
  }, [trackAndLayout]);

  return (
    <div
      className="bg-editor-starter-bg group flex w-full shrink-0 items-center gap-2 truncate pl-4 text-xs"
      style={style}
    >
      {isDev ? (
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-1 z-50 rounded bg-black/30 px-1 py-0.5 font-mono text-[10px] text-white"
        >
          {trackAndLayout.track.id}
        </div>
      ) : null}
      <div className="w-4 text-right text-white/50">{name}</div>
      <div className="flex">
        {FEATURE_HIDE_TRACKS && <TimelineHideTrack track={trackAndLayout.track} />}
        {FEATURE_MUTE_TRACKS && <TimelineMuteTrack track={trackAndLayout.track} />}
      </div>
    </div>
  );
};
