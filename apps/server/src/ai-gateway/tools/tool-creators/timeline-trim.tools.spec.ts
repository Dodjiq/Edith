import { editorToolNames, realtimeMessageTypes } from 'api-types';
import { createTrimTimelineItemsTool } from './timeline-trim.tools';
import type { ToolDependencies } from './types';

describe('timeline trim tools', () => {
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

    return { deps, dispatchMessage, waitForToolResult };
  };

  it('dispatches a semantic first-half trim request', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    const tool = createTrimTimelineItemsTool(deps, { messageId: 'message-1' });

    waitForToolResult.mockResolvedValue({
      status: 'success',
      output: {
        trimmedItems: [
          {
            sourceItemId: 'clip-1',
            itemId: 'clip-1-half',
            trackId: 'main',
            startFrame: 0,
            endFrame: 120,
            startTimeInSeconds: 0,
            endTimeInSeconds: 4,
            removedFrames: 120,
          },
        ],
      },
    });

    const result = await tool.execute?.(
      {
        itemIds: ['clip-1', 'clip-2'],
        mode: 'first_half',
      },
      { toolCallId: 'tool-1', messages: [] },
    );

    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.editor,
        payload: expect.objectContaining({
          tool_name: editorToolNames.trimTimelineItems,
          toolCallId: 'tool-1',
          messageId: 'message-1',
          params: {
            itemIds: ['clip-1', 'clip-2'],
            mode: 'first_half',
            durationInFrames: undefined,
            durationInSeconds: undefined,
          },
        }),
      }),
    );
    expect(result).toEqual({
      status: 'completed',
      requestedItemIds: ['clip-1', 'clip-2'],
      mode: 'first_half',
      trimmedItems: [
        {
          sourceItemId: 'clip-1',
          itemId: 'clip-1-half',
          trackId: 'main',
          startFrame: 0,
          endFrame: 120,
          startTimeInSeconds: 0,
          endTimeInSeconds: 4,
          removedFrames: 120,
        },
      ],
      skippedItemIds: undefined,
      note: 'Timeline item(s) trimmed.',
      error: undefined,
      projectState: undefined,
    });
  });

  it('requires a duration for duration mode', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    const tool = createTrimTimelineItemsTool(deps);

    const result = await tool.execute?.(
      {
        itemIds: ['clip-1'],
        mode: 'duration',
      },
      { toolCallId: 'tool-1', messages: [] },
    );

    expect(dispatchMessage).not.toHaveBeenCalled();
    expect(waitForToolResult).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'skipped',
      requestedItemIds: ['clip-1'],
      mode: 'duration',
      note: 'duration mode requires durationInFrames or durationInSeconds.',
    });
  });
});
