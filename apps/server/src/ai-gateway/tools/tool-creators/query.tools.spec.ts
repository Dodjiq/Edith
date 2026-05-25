import { editorToolNames, realtimeMessageTypes } from 'api-types';
import { createGetDetailedTranscriptionTool } from './query.tools';
import type { ToolDependencies } from './types';

describe('createGetDetailedTranscriptionTool', () => {
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

  it('documents the 10-minute limit explicitly', () => {
    const { deps } = createDeps();
    const tool = createGetDetailedTranscriptionTool(deps);

    expect(tool.description).toContain('limited to 10 minutes per call');
    expect(tool.description).toContain('20-minute video');
  });

  it('skips requests longer than 10 minutes before dispatching to the editor', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    const tool = createGetDetailedTranscriptionTool(deps);

    const result = await tool.execute?.(
      { minutes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
      { toolCallId: 'tool-oversized', messages: [] },
    );

    expect(result).toEqual({
      status: 'skipped',
      minutes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      note: 'Detailed transcription is limited to 10 minutes per call. Split longer requests into multiple calls.',
    });
    expect(dispatchMessage).not.toHaveBeenCalled();
    expect(waitForToolResult).not.toHaveBeenCalled();
  });

  it('dispatches zero-indexed minutes for valid requests', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    const tool = createGetDetailedTranscriptionTool(deps, { messageId: 'message-1' });

    waitForToolResult.mockResolvedValue({
      status: 'success',
      output: {
        wordCount: 42,
        words: [],
        targetItemIds: ['item-1'],
      },
    });

    const result = await tool.execute?.(
      { minutes: [3, 4], itemIds: ['item-1'] },
      { toolCallId: 'tool-1', messages: [] },
    );

    expect(waitForToolResult).toHaveBeenCalledWith('tool-1');
    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.editor,
        payload: expect.objectContaining({
          tool_name: editorToolNames.getDetailedTranscription,
          toolCallId: 'tool-1',
          messageId: 'message-1',
          params: {
            minutes: [2, 3],
            itemIds: ['item-1'],
          },
        }),
      }),
    );
    expect(result).toEqual({
      status: 'completed',
      minutes: [3, 4],
      targetItemIds: ['item-1'],
      wordCount: 42,
      transcription: [],
      generalization:
        'No transcript words are currently available. The audio may still be processing, silent, or missing from the selected timeline scope.',
      note: 'Retrieved 42 words for minute(s): 3, 4.',
    });
  });
});
