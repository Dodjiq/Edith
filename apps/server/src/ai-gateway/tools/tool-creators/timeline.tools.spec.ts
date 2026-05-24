/// <reference types="jest" />
import { editorToolNames, realtimeMessageTypes } from 'api-types';
import {
  createPlaceLibraryAssetsOnTimelineTool,
  createPlaceTimelineItemsTool,
} from './timeline.tools';
import type { ToolDependencies, ToolsContext } from './types';

describe('timeline placement tools', () => {
  const createDeps = () => {
    const dispatchMessage = jest.fn();
    const waitForToolResult = jest.fn().mockResolvedValue({
      status: 'success',
      output: {},
    });

    const deps: ToolDependencies = {
      realtimeService: {
        dispatchMessage,
      } as unknown as ToolDependencies['realtimeService'],
      waitForToolResult,
      getLanguageModel: jest.fn() as unknown as ToolDependencies['getLanguageModel'],
      logger: {
        log: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      },
    };

    return { deps, dispatchMessage };
  };

  const emptyTimelineContext: ToolsContext = {
    messageId: 'message-1',
    projectState: {
      tracksInfo: { numberOfTracks: 0, tracks: [] },
      dimensionsInfo: { width: 1920, height: 1080 },
      projectItemsInfo: [],
      selectedItemsInfo: [],
      fpsInfo: 30,
    },
  };

  it('normalizes duplicate placement anchors to startFrame for an empty timeline', async () => {
    const { deps, dispatchMessage } = createDeps();
    const tool = createPlaceLibraryAssetsOnTimelineTool(deps, emptyTimelineContext);

    await tool.execute?.(
      {
        libraryAssetIds: ['asset-1', 'asset-2'],
        startFrame: 0,
        startTimeInSeconds: 0,
        afterItemId: 'unused',
      },
      { toolCallId: 'tool-1', messages: [] },
    );

    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.editor,
        payload: expect.objectContaining({
          tool_name: editorToolNames.placeLibraryAssetsOnTimeline,
          params: {
            libraryAssetIds: ['asset-1', 'asset-2'],
            trackId: undefined,
            startFrame: 0,
          },
        }),
      }),
    );
  });

  it('keeps a valid afterItemId when the model also sends an absolute anchor', async () => {
    const { deps, dispatchMessage } = createDeps();
    const tool = createPlaceTimelineItemsTool(deps, {
      messageId: 'message-1',
      projectState: {
        tracksInfo: {
          numberOfTracks: 1,
          tracks: [
            {
              trackId: 'track-1',
              isVisibleOnTimeline: true,
              isMutedOnTimeline: false,
              numberTracksItems: 1,
              itemsTracksIds: ['clip-1'],
            },
          ],
        },
        dimensionsInfo: { width: 1920, height: 1080 },
        projectItemsInfo: [
          {
            fileName: 'intro.mp4',
            fileType: 'video',
            itemId: 'clip-1',
            mimeType: 'video/mp4',
            durationInSeconds: 10,
            hasAudioTrack: true,
            startFromInSeconds: 0,
            endAtInSeconds: 10,
          },
        ],
        selectedItemsInfo: [],
        fpsInfo: 30,
      },
    });

    await tool.execute?.(
      {
        itemIds: ['clip-2'],
        trackId: 'track-1',
        startFrame: 0,
        afterItemId: 'clip-1',
      },
      { toolCallId: 'tool-2', messages: [] },
    );

    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.editor,
        payload: expect.objectContaining({
          tool_name: editorToolNames.placeTimelineItems,
          params: {
            itemIds: ['clip-2'],
            trackId: 'track-1',
            afterItemId: 'clip-1',
          },
        }),
      }),
    );
  });
});
