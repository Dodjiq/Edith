import { PlayerRef } from '@remotion/player';
import { TimelineWriteOnlyContext } from '../context-provider';
import { placeLibraryAssetsOnTimelineWithNewItems } from './place-library-assets-on-timeline';

type AddLibraryAssetToTimelineOptions = {
  assetId: string;
  timelineWriteContext: TimelineWriteOnlyContext;
  playerRef: React.RefObject<PlayerRef | null>;
};

export const addLibraryAssetToTimelineWithItem = ({
  assetId,
  timelineWriteContext,
  playerRef,
}: AddLibraryAssetToTimelineOptions) => {
  const { setState } = timelineWriteContext;

  setState({
    update: (state) => {
      const startFrame = playerRef.current?.getCurrentFrame() ?? 0;

      const result = placeLibraryAssetsOnTimelineWithNewItems({
        state,
        libraryAssetIds: [assetId],
        startFrame,
        mode: 'auto-track',
        selectNewItems: true,
      });

      return result.state;
    },
    commitToUndoStack: true,
  });
};
