import type { RefObject } from 'react';
import { useCallback } from 'react';
import type { PlayerRef } from '@remotion/player';
import api from '@/utils/services/api-frontend';
import { editorToolNames, type MotionDesignItemInput } from 'api-types';
import { addItem } from '../state/actions/add-item';
import { revealTimelinePosition } from '../utils/reveal-timeline-position';
import { useCurrentStateAsRef, useWriteContext } from '../utils/use-context';
import { createMotionDesignItem } from '../items/motion-design/create-motion-design-item';
import { summarizeMotionDesignItem } from './motion-design-tool-utils';
import { useGetProjectState } from './use-get-project-state';

export type AddMotionDesignItemsOptions = {
  items: MotionDesignItemInput[];
  toolCallId?: string;
};

export const useAddMotionDesignItems = (playerRef?: RefObject<PlayerRef | null>) => {
  const { setState } = useWriteContext();
  const stateAsRef = useCurrentStateAsRef();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState(playerRef);

  const addMotionDesignItems = useCallback(
    async (options: AddMotionDesignItemsOptions) => {
      const toolCallId = options.toolCallId;
      const reportResult = async (
        status: 'success' | 'skipped' | 'error',
        output?: Record<string, unknown>,
        error?: string,
      ) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: { toolCallId, toolName: editorToolNames.addMotionDesignItems, status, output, error },
          });
        } catch {
          console.error('Failed to report add motion design tool result', { toolCallId, status });
        }
      };

      if (options.items.length === 0) {
        await reportResult('error', { error: 'No motion design items provided' }, 'No motion design items provided');
        return;
      }

      try {
        const currentState = stateAsRef.current;
        const { fps, compositionWidth, compositionHeight } = currentState.undoableState;
        const currentFrame = playerRef?.current?.getCurrentFrame() ?? 0;
        let nextState = currentState;
        const createdItems: ReturnType<typeof summarizeMotionDesignItem>[] = [];

        for (const request of options.items) {
          const item = createMotionDesignItem({
            templateId: request.templateId,
            from: currentFrame,
            fps,
            compositionWidth,
            compositionHeight,
            request,
          });

          nextState = addItem({ state: nextState, item, select: false, position: { type: 'front' } });
          createdItems.push(summarizeMotionDesignItem(item, fps));
        }

        nextState = { ...nextState, selectedItems: createdItems.map((item) => item.itemId) };
        setState({ update: nextState, commitToUndoStack: true });

        const firstCreated = createdItems[0];
        const trackId = firstCreated
          ? nextState.undoableState.tracks.find((track) => track.items.includes(firstCreated.itemId))?.id
          : undefined;
        if (firstCreated && trackId) {
          revealTimelinePosition({ state: nextState, frame: firstCreated.startFrame, trackId });
        }

        await reportResult('success', {
          createdItems,
          createdItemIds: createdItems.map((item) => item.itemId),
          selectedItemIds: nextState.selectedItems,
          animationCheck: createdItems.map((item) => item.animationCheck),
          changedFields: ['templateId', 'props', 'durationInFrames', 'layout'],
          projectState: buildProjectState(nextState),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add motion design items';
        await reportResult('error', { error: message }, message);
      }
    },
    [buildProjectState, playerRef, reportToolResult, setState, stateAsRef],
  );

  return { addMotionDesignItems };
};
