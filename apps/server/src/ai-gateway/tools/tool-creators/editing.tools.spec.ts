/// <reference types="jest" />
import { editorToolNames, realtimeMessageTypes } from 'api-types';
import { createRemoveSilencesTool, createSetCaptionsTool } from './editing.tools';
import type {
  ActionToolDependencies,
  RemoveSilencesResult,
  SetCaptionsResult,
  ToolDependencies,
  ToolsContext,
} from './types';

describe('editing tools', () => {
  const createDeps = () => {
    const dispatchMessage = jest.fn();
    const waitForToolResult = jest.fn().mockResolvedValue({
      toolCallId: 'caption-call-1',
      toolName: editorToolNames.setCaptions,
      status: 'success',
      output: {
        captionItemId: 'caption-1',
        captionAssetId: 'caption-asset-1',
        projectState: { captionItemsInfo: [{ itemId: 'caption-1' }] },
      },
    });

    const deps: ToolDependencies = {
      realtimeService: {
        dispatchMessage,
      } as unknown as ToolDependencies['realtimeService'],
      waitForToolResult,
      getLanguageModel: jest.fn() as unknown as ToolDependencies['getLanguageModel'],
    };

    return { deps, dispatchMessage, waitForToolResult };
  };

  const context: ToolsContext = {
    messageId: 'message-1',
    projectState: {
      projectId: 'project-1',
      tracksInfo: { numberOfTracks: 1, tracks: [] },
      dimensionsInfo: { width: 1920, height: 1080 },
      projectItemsInfo: [],
      selectedItemsInfo: ['video-1'],
      fpsInfo: 30,
    },
  };

  const removeSilencesContext: ToolsContext = {
    messageId: 'message-1',
    projectState: {
      projectId: 'project-1',
      tracksInfo: {
        numberOfTracks: 1,
        tracks: [
          {
            trackId: 'track-1',
            isVisibleOnTimeline: true,
            isMutedOnTimeline: false,
            numberTracksItems: 2,
            itemsTracksIds: ['video-1', 'video-2'],
          },
        ],
      },
      dimensionsInfo: { width: 1920, height: 1080 },
      projectItemsInfo: [
        {
          fileName: 'talking-head.mp4',
          fileType: 'video',
          itemId: 'video-1',
          mimeType: 'video/mp4',
          hasAudioTrack: true,
          remoteUrl: 'https://example.com/talking-head.mp4',
        },
        {
          fileName: 'talking-head.mp4',
          fileType: 'video',
          itemId: 'video-2',
          mimeType: 'video/mp4',
          hasAudioTrack: true,
          remoteUrl: 'https://example.com/talking-head.mp4',
        },
      ],
      selectedItemsInfo: ['video-1'],
      fpsInfo: 30,
    },
  };

  it('describes set_captions as the subtitle tool, not a random text tool', () => {
    const tool = createSetCaptionsTool(createDeps().deps, context);

    expect(tool.description).toContain('add subtitles');
    expect(tool.description).toContain('dynamic subtitles');
    expect(tool.description).toContain('Generates captions from real cached/generated transcription');
    expect(tool.description).toContain('target video/audio item IDs');
  });

  it('dispatches caption generation with dynamic subtitle style overrides', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    const tool = createSetCaptionsTool(deps, context);

    const style = {
      left: 240,
      top: 760,
      width: 1440,
      height: 220,
      fontFamily: 'Roboto',
      fontStyle: { weight: '700' },
      fontSize: 64,
      lineHeight: 1.08,
      align: 'center' as const,
      color: '#ffffff',
      strokeWidth: 8,
      strokeColor: '#000000',
      maxLines: 2,
      pageDurationInMilliseconds: 1200,
      fadeInDurationInSeconds: 0.08,
      fadeOutDurationInSeconds: 0.08,
    };

    const result = (await tool.execute?.(
      { itemIds: ['video-1'], style, reason: 'Add dynamic subtitles.' },
      { toolCallId: 'caption-call-1', messages: [] },
    )) as SetCaptionsResult;

    expect(waitForToolResult).toHaveBeenCalledWith('caption-call-1');
    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.editor,
        payload: expect.objectContaining({
          tool_name: editorToolNames.setCaptions,
          toolCallId: 'caption-call-1',
          params: {
            targetItemIds: ['video-1'],
            replaceExisting: true,
            style,
            captionEdits: undefined,
          },
        }),
      }),
    );
    expect(result).toMatchObject({
      status: 'completed',
      targetItemIds: ['video-1'],
    });
  });

  it('dispatches remove_silences once for many item IDs and reuses one audio detection per asset', async () => {
    const dispatchMessage = jest.fn();
    const waitForToolResult = jest.fn().mockResolvedValue({
      toolCallId: 'silence-call-1',
      toolName: editorToolNames.removeSilences,
      status: 'success',
      output: {
        requestedItemIds: ['video-1', 'video-2'],
        processedItemIds: ['video-1', 'video-2'],
        createdItemIds: ['clip-1', 'clip-2'],
        removedCount: 3,
        removedDurationSeconds: 2.4,
        detectionSourceCounts: { audio: 2, transcription: 0 },
        projectState: {
          projectItemsInfo: [
            { itemId: 'clip-1', hasAudioTrack: true },
            { itemId: 'clip-2', hasAudioTrack: true },
          ],
          tracksInfo: { tracks: [{ itemsTracksIds: ['clip-1', 'clip-2'] }] },
        },
      },
    });
    const detectSilence = jest.fn().mockResolvedValue({
      silentParts: [{ startInSeconds: 1, endInSeconds: 2 }],
      audibleParts: [
        { startInSeconds: 0, endInSeconds: 1 },
        { startInSeconds: 2, endInSeconds: 4 },
      ],
      durationInSeconds: 4,
    });
    const deps: ActionToolDependencies = {
      realtimeService: {
        dispatchMessage,
      } as unknown as ActionToolDependencies['realtimeService'],
      waitForToolResult,
      getLanguageModel: jest.fn() as unknown as ActionToolDependencies['getLanguageModel'],
      audioService: {
        detectSilence,
      } as unknown as ActionToolDependencies['audioService'],
      logger: {
        log: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      },
    };
    const tool = createRemoveSilencesTool(deps, removeSilencesContext);

    const result = (await tool.execute?.(
      {
        itemIds: ['video-1', 'video-2'],
        reason: 'Tighten the remaining talking-head clips.',
      },
      { toolCallId: 'silence-call-1', messages: [] },
    )) as RemoveSilencesResult;

    expect(detectSilence).toHaveBeenCalledTimes(1);
    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.editor,
        payload: expect.objectContaining({
          tool_name: editorToolNames.removeSilences,
          toolCallId: 'silence-call-1',
          params: expect.objectContaining({
            itemIds: ['video-1', 'video-2'],
            detectionMode: 'auto',
            detectionsByItemId: {
              'video-1': expect.any(Object),
              'video-2': expect.any(Object),
            },
          }),
        }),
      }),
    );
    expect(result).toMatchObject({
      status: 'completed',
      targetItemIds: ['video-1', 'video-2'],
      output: {
        removedCount: 3,
        removedDurationSeconds: 2.4,
      },
    });
  });
});
