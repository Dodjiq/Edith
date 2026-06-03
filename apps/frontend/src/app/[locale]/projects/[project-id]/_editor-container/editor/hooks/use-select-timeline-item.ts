import { useCallback } from 'react';
import { setSelectedItems } from '../state/actions/set-selected-items';
import { useAllItems, useWriteContext } from '../utils/use-context';

type SelectTimelineItems = (itemIds: string[]) => void;

export const useSelectTimelineItems = (): SelectTimelineItems => {
  const { setState } = useWriteContext();
  const { items } = useAllItems();

  return useCallback(
    (itemIds: string[]) => {
      const validItemIds = Array.from(
        new Set(itemIds.filter((itemId) => Boolean(items[itemId]))),
      );

      if (validItemIds.length === 0) {
        return;
      }

      setState({
        update: (state) => setSelectedItems(state, validItemIds),
        commitToUndoStack: true,
      });
    },
    [items, setState],
  );
};
