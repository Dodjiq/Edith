import { EditorState } from '../../../state/types';

type ShiftFollowingItemsParams = {
  trackIndex: number;
  pivotFrame: number;
  shiftBy: number;
};

export const shiftFollowingItems = ({ trackIndex, pivotFrame, shiftBy }: ShiftFollowingItemsParams) => {
  return (prevState: EditorState): EditorState => {
    const { tracks, items } = prevState.undoableState;
    const track = tracks[trackIndex];
    const nextItems = { ...items };

    for (const id of track.items) {
      const item = nextItems[id];
      if (!item) continue;

      if (item.from >= pivotFrame) {
        nextItems[id] = {
          ...item,
          from: Math.max(0, item.from - shiftBy),
        };
      }
    }

    return {
      ...prevState,
      undoableState: {
        ...prevState.undoableState,
        items: nextItems,
      },
    };
  };
};
