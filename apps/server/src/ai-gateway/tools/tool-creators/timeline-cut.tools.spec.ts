import { editorToolNames, realtimeMessageTypes } from 'api-types';
import { createCutFrameRangeTool, createCutTimeRangesTool } from './timeline-cut.tools';
import type { ToolDependencies } from './types';

describe('timeline cut tools', () => {
  const createDeps = () => {
    const dispatchMessage = jest.fn();
    const waitForToolResult = jest.fn();

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

    return {
      deps,
      dispatchMessage,
      waitForToolResult,
    };
  };

  it('batches time ranges into one cut_frame_range editor call', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    const tool = createCutTimeRangesTool(deps, {
      messageId: 'message-1',
      projectState: {
        fpsInfo: 30,
      } as never,
    });

    waitForToolResult.mockResolvedValue({
      status: 'success',
      output: {
        removedFrames: 63,
      },
    });

    const result = await tool.execute?.(
      {
        trackId: 'track-1',
        ranges: [
          { startTimeInSeconds: 1, endTimeInSeconds: 2 },
          { startTimeInSeconds: 2, endTimeInSeconds: 2.3 },
          { startTimeInSeconds: 5.2, endTimeInSeconds: 6 },
        ],
      },
      { toolCallId: 'tool-1', messages: [] },
    );

    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.editor,
        payload: expect.objectContaining({
          tool_name: editorToolNames.cutFrameRange,
          toolCallId: 'tool-1',
          messageId: 'message-1',
          params: {
            trackId: 'track-1',
            ranges: [
              { startFrame: 30, endFrame: 69 },
              { startFrame: 156, endFrame: 180 },
            ],
          },
        }),
      }),
    );
    expect(waitForToolResult).toHaveBeenCalledWith('tool-1');
    expect(result).toEqual({
      status: 'completed',
      trackId: 'track-1',
      ranges: [
        { startTimeInSeconds: 1, endTimeInSeconds: 2 },
        { startTimeInSeconds: 2, endTimeInSeconds: 2.3 },
        { startTimeInSeconds: 5.2, endTimeInSeconds: 6 },
      ],
      appliedFrameRanges: [
        { startFrame: 30, endFrame: 69 },
        { startFrame: 156, endFrame: 180 },
      ],
      removedFrames: 63,
      removedSeconds: 2.1,
      note: 'Cut 2.10s on the timeline using 3 requested range(s) merged into 2 cut(s).',
      projectState: undefined,
    });
  });

  it('asks for project state when fps is missing', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    const tool = createCutTimeRangesTool(deps);

    const result = await tool.execute?.(
      {
        trackId: 'track-1',
        ranges: [{ startTimeInSeconds: 1, endTimeInSeconds: 2 }],
      },
      { toolCallId: 'tool-1', messages: [] },
    );

    expect(dispatchMessage).not.toHaveBeenCalled();
    expect(waitForToolResult).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'skipped',
      trackId: 'track-1',
      ranges: [{ startTimeInSeconds: 1, endTimeInSeconds: 2 }],
      note: 'FPS info is required to convert time ranges. Call get_project_state before cut_time_ranges.',
    });
  });

  it('normalizes overlapping frame ranges before dispatching', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    const tool = createCutFrameRangeTool(deps);

    waitForToolResult.mockResolvedValue({
      status: 'success',
      output: {},
    });

    const result = await tool.execute?.(
      {
        trackId: 'track-1',
        ranges: [
          { startFrame: 100, endFrame: 140 },
          { startFrame: 120, endFrame: 180 },
          { startFrame: 200, endFrame: 240 },
        ],
      },
      { toolCallId: 'tool-1', messages: [] },
    );

    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          params: {
            trackId: 'track-1',
            ranges: [
              { startFrame: 100, endFrame: 180 },
              { startFrame: 200, endFrame: 240 },
            ],
          },
        }),
      }),
    );
    expect(result).toEqual({
      status: 'completed',
      trackId: 'track-1',
      ranges: [
        { startFrame: 100, endFrame: 180 },
        { startFrame: 200, endFrame: 240 },
      ],
      removedFrames: 120,
      note: 'Cut 120 frames across 2 range(s), ripple-deleted gaps.',
      projectState: undefined,
    });
  });
});
