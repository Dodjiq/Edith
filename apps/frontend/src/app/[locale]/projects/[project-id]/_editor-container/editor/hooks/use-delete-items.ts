import { useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/utils/services/api-frontend';
import { editorToolNames } from 'api-types';
import { deleteItems } from '../state/actions/delete-items';
import { EditorState } from '../state/types';
import { useAllItems, useWriteContext } from '../utils/use-context';
import { useGetProjectState } from './use-get-project-state';

type DeleteItemsOptions = {
  itemIds: string[];
  toolCallId?: string;
};

export const useDeleteItems = () => {
  const { items } = useAllItems();
  const { setState } = useWriteContext();
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();
  const { buildProjectState } = useGetProjectState();

  const deleteItemsFromTimeline = useCallback(
    async (options: DeleteItemsOptions) => {
      const { itemIds, toolCallId } = options;

      const report = async (
        status: 'success' | 'skipped' | 'error',
        output?: Record<string, unknown>,
        error?: string,
      ) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: {
              toolCallId,
              toolName: editorToolNames.deleteItems,
              status,
              output,
              error,
            },
          });
        } catch {
          // Reporting failure should not block
        }
      };

      const validItemIds = itemIds.filter((id) => Boolean(items[id]));

      if (validItemIds.length === 0) {
        toast.error('No valid items to delete');
        await report('error', undefined, 'No valid item IDs provided');
        return;
      }

      try {
        let updatedState: EditorState | null = null;
        setState({
          update: (state) => {
            const nextState = deleteItems(state, validItemIds);
            updatedState = nextState;
            return nextState;
          },
          commitToUndoStack: true,
        });

        const deletedCount = validItemIds.length;
        toast.success(`Deleted ${deletedCount} item${deletedCount > 1 ? 's' : ''}`, {
          position: 'top-right',
        });

        await report('success', {
          deletedItemIds: validItemIds,
          deletedCount,
          projectState: buildProjectState(updatedState ?? undefined),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete items';
        toast.error('Failed to delete items', { description: message });
        await report('error', undefined, message);
      }
    },
    [buildProjectState, items, reportToolResult, setState],
  );

  return { deleteItems: deleteItemsFromTimeline };
};
