import type { RefObject } from 'react';
import { useCallback } from 'react';
import type { PlayerRef } from '@remotion/player';
import api from '@/utils/services/api-frontend';
import { DigestProjectStateRequest, editorToolNames } from 'api-types';
import { EditorState } from '../state/types';
import {
  useAllItems,
  useAssets,
  useAssetStatus,
  useDimensions,
  useFps,
  useSelectedItems,
  useTracks,
} from '../utils/use-context';
import { useEditorAssetsStore } from '../state/editor-assets-store';
import { useLibraryAssets } from '../library';
import { buildProjectStateDigest } from '../utils/build-project-state-digest';
import { useProjectId } from '../utils/use-project-id';

type GetProjectStateOptions = {
  toolCallId?: string;
};

export const useGetProjectState = (playerRef?: RefObject<PlayerRef | null>) => {
  const { items } = useAllItems();
  const { assets } = useAssets();
  const { assetStatus } = useAssetStatus();
  const { libraryAssets } = useLibraryAssets();
  const { tracks } = useTracks();
  const { selectedItems } = useSelectedItems();
  const { fps } = useFps();
  const { compositionWidth, compositionHeight } = useDimensions();
  const projectId = useProjectId();
  const originalAssets = useEditorAssetsStore((state) => state.originalAssets);
  const { mutateAsync: reportToolResult } = api.tools.reportToolResult.useMutation();

  const buildProjectState = useCallback(
    (stateOverride?: EditorState): DigestProjectStateRequest => {
      const sourceUndoableState = stateOverride?.undoableState;
      const sourceFps = sourceUndoableState?.fps ?? fps;
      const currentFrame = playerRef?.current?.getCurrentFrame();

      return buildProjectStateDigest({
        projectId,
        tracks: sourceUndoableState?.tracks ?? tracks,
        assets: sourceUndoableState?.assets ?? assets,
        libraryAssets: sourceUndoableState?.libraryAssets ?? libraryAssets,
        assetStatus: stateOverride?.assetStatus ?? assetStatus,
        items: sourceUndoableState?.items ?? items,
        selectedItems: stateOverride?.selectedItems ?? selectedItems,
        fps: sourceFps,
        compositionWidth: sourceUndoableState?.compositionWidth ?? compositionWidth,
        compositionHeight: sourceUndoableState?.compositionHeight ?? compositionHeight,
        originalAssets,
        currentFrame,
      });
    },
    [
      assetStatus,
      assets,
      compositionHeight,
      compositionWidth,
      fps,
      items,
      libraryAssets,
      originalAssets,
      playerRef,
      projectId,
      selectedItems,
      tracks,
    ],
  );

  const getProjectState = useCallback(
    async (options?: GetProjectStateOptions) => {
      const toolCallId = options?.toolCallId;

      const report = async (status: 'success' | 'error', output?: Record<string, unknown>, error?: string) => {
        if (!toolCallId) return;
        try {
          await reportToolResult({
            body: {
              toolCallId,
              toolName: editorToolNames.getProjectState,
              status,
              output,
              error,
            },
          });
        } catch {
          // Reporting failure should not block the editor.
        }
      };

      try {
        const projectState = buildProjectState();
        await report('success', projectState as unknown as Record<string, unknown>);
        return projectState;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get project state';
        await report('error', undefined, message);
        return null;
      }
    },
    [buildProjectState, reportToolResult],
  );

  return { getProjectState, buildProjectState };
};
