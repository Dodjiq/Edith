import type { RefObject } from 'react';
import { useCallback } from 'react';
import type { PlayerRef } from '@remotion/player';
import api from '@/utils/services/api-frontend';
import { editorToolNames, type MotionDesignItemPatchInput, type MotionDesignSelectionBehavior } from 'api-types';
import { changeItem } from '../state/actions/change-item';
import { revealTimelinePosition } from '../utils/reveal-timeline-position';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import {
  applyMotionDesignPatch,
  getMotionDesignChangedFields,
  hasMotionDesignPatchValue,
  isMotionDesignItem,
  summarizeMotionDesignItem,
} from './motion-design-tool-utils';
import { useGetProjectState } from './use-get-project-state';

export type UpdateMotionDesignItemsOptions = {
  itemIds: string[];
  patch: MotionDesignItemPatchInput;
  selectionBehavior?: MotionDesignSelectionBehavior;
  toolCallId?: string;
};

export const useUpdateMotionDesignItems = (playerRef?: RefObject<PlayerRef | null>) => {
  const { setState } = useWriteContext();
  const stateAsRef = useCurrentStateAsRef();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState(playerRef);

  const updateMotionDesignItems = useCallback(
    async (options: UpdateMotionDesignItemsOptions) => {
      const toolCallId = options.toolCallId;
      const reportResult = async (
        status: 'success' | 'skipped' | 'error',
        output?: Record<string, unknown>,
        error?: string,
      ) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: { toolCallId, toolName: editorToolNames.updateMotionDesignItems, status, output, error },
          });
        } catch {
          console.error('Failed to report update motion design tool result', { toolCallId, status });
        }
      };

      const itemIds = [...new Set(options.itemIds.map((id) => id.trim()).filter(Boolean))];
      if (itemIds.length === 0 || !hasMotionDesignPatchValue(options.patch)) {
        await reportResult('error', { error: 'No motion design item IDs or patch values provided' });
        return;
      }

      try {
        const currentState = stateAsRef.current;
        const { fps } = currentState.undoableState;
        const itemErrors: { itemId: string; error: string }[] = [];
        const updateableIds: string[] = [];

        for (const itemId of itemIds) {
          const item = currentState.undoableState.items[itemId];
          if (!item) {
            itemErrors.push({ itemId, error: 'Item not found' });
            continue;
          }
          if (!isMotionDesignItem(item)) {
            itemErrors.push({ itemId, error: `Item is ${item.type}, not a motion design item` });
            continue;
          }
          updateableIds.push(itemId);
        }

        if (updateableIds.length === 0) {
          await reportResult('error', { itemErrors, error: 'No motion design items could be updated' });
          return;
        }

        let nextState = currentState;
        for (const itemId of updateableIds) {
          nextState = changeItem(nextState, itemId, (item) => {
            if (!isMotionDesignItem(item)) return item;
            return applyMotionDesignPatch({ item, patch: options.patch, fps });
          });
        }

        const selectionBehavior = options.selectionBehavior ?? 'select_updated';
        nextState = {
          ...nextState,
          selectedItems:
            selectionBehavior === 'select_updated'
              ? updateableIds
              : selectionBehavior === 'none'
                ? []
                : currentState.selectedItems,
        };

        setState({ update: nextState, commitToUndoStack: true });

        const firstUpdatedId = updateableIds[0];
        const firstUpdated = firstUpdatedId ? nextState.undoableState.items[firstUpdatedId] : undefined;
        const trackId = firstUpdatedId
          ? nextState.undoableState.tracks.find((track) => track.items.includes(firstUpdatedId))?.id
          : undefined;
        if (firstUpdated && trackId) {
          revealTimelinePosition({ state: nextState, frame: firstUpdated.from, trackId });
        }

        const updatedItems = updateableIds
          .map((itemId) => nextState.undoableState.items[itemId])
          .filter(isMotionDesignItem)
          .map((item) => summarizeMotionDesignItem(item, fps));

        await reportResult('success', {
          updatedItemIds: updateableIds,
          selectedItemIds: nextState.selectedItems,
          updatedItems,
          animationCheck: updatedItems.map((item) => item.animationCheck),
          changedFields: getMotionDesignChangedFields(options.patch),
          itemErrors: itemErrors.length > 0 ? itemErrors : undefined,
          projectState: buildProjectState(nextState),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update motion design items';
        await reportResult('error', { error: message }, message);
      }
    },
    [buildProjectState, reportToolResult, setState, stateAsRef],
  );

  return { updateMotionDesignItems };
};
