import type { RefObject } from 'react';
import { useMemo } from 'react';
import type { PlayerRef } from '@remotion/player';
import { DigestProjectStateRequest } from 'api-types';
import {
  AllItemsContext,
  AssetsContext,
  AssetStatusContext,
  DimensionsContext,
  FpsContext,
  LibraryAssetsContext,
  SelectedItemsContext,
  TimelineContext,
  TracksContext,
} from '../../_editor-container/editor/context-provider';
import { useEditorAssetsStore } from '../../_editor-container/editor/state/editor-assets-store';
import { buildProjectStateDigest } from '../../_editor-container/editor/utils/build-project-state-digest';
import { useProjectId } from '../../_editor-container/editor/utils/use-project-id';

type BuildProjectStateInput = {
  timelineContext: TimelineContext;
  dimensionsContext: DimensionsContext;
  projectsAssets: AssetsContext;
  libraryAssets: LibraryAssetsContext;
  assetsStatus: AssetStatusContext;
  tracks: TracksContext;
  selectedItems: SelectedItemsContext;
  fps: FpsContext;
  items: AllItemsContext;
  playerRef?: RefObject<PlayerRef | null>;
};

const useBuildProjectState = ({
  timelineContext,
  dimensionsContext,
  projectsAssets,
  libraryAssets,
  assetsStatus,
  tracks,
  selectedItems,
  fps,
  items,
  playerRef,
}: BuildProjectStateInput): DigestProjectStateRequest => {
  const projectId = useProjectId();
  const originalAssets = useEditorAssetsStore((state) => state.originalAssets);

  return useMemo(() => {
    void timelineContext;

    return buildProjectStateDigest({
      projectId,
      tracks: tracks.tracks,
      assets: projectsAssets.assets,
      libraryAssets: libraryAssets.libraryAssets,
      assetStatus: assetsStatus.assetStatus,
      items: items.items,
      selectedItems: selectedItems.selectedItems,
      fps: fps.fps,
      compositionWidth: dimensionsContext.compositionWidth,
      compositionHeight: dimensionsContext.compositionHeight,
      originalAssets,
      currentFrame: playerRef?.current?.getCurrentFrame(),
    });
  }, [
    assetsStatus.assetStatus,
    dimensionsContext.compositionHeight,
    dimensionsContext.compositionWidth,
    fps.fps,
    items.items,
    libraryAssets.libraryAssets,
    originalAssets,
    playerRef,
    projectId,
    projectsAssets.assets,
    selectedItems.selectedItems,
    timelineContext,
    tracks.tracks,
  ]);
};

export default useBuildProjectState;
