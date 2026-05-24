/// <reference types="jest" />
import { editorToolNames, realtimeMessageTypes } from 'api-types';
import { createAddShapeItemsTool, createUpdateShapeItemsTool } from './shape.tools';
import type { ToolDependencies, ToolsContext } from './types';

type SafeParseResult = { success: boolean };

const safeParseToolInput = (tool: { inputSchema?: unknown }, input: unknown): SafeParseResult =>
  (tool.inputSchema as { safeParse: (value: unknown) => SafeParseResult }).safeParse(input);

describe('shape overlay tools', () => {
  const createDeps = () => {
    const dispatchMessage = jest.fn();
    const waitForToolResult = jest.fn().mockResolvedValue({
      toolCallId: 'shape-call-1',
      toolName: editorToolNames.addShapeItems,
      status: 'success',
      output: {
        createdItems: [{ itemId: 'shape-1', shapeKind: 'rounded_rectangle', trackId: 'track-1' }],
        createdItemIds: ['shape-1'],
        selectedItemIds: ['shape-1'],
        projectState: { visibleShapeItemsInfo: [{ itemId: 'shape-1', type: 'solid' }] },
      },
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

    return { deps, dispatchMessage, waitForToolResult };
  };

  const context: ToolsContext = {
    messageId: 'message-1',
    projectState: {
      projectId: 'project-1',
      tracksInfo: { numberOfTracks: 0, tracks: [] },
      dimensionsInfo: { width: 1920, height: 1080 },
      projectItemsInfo: [],
      selectedItemsInfo: [],
      fpsInfo: 30,
    },
  };

  it('rejects unsupported shape kinds and invalid dimensions', () => {
    const { deps } = createDeps();
    const tool = createAddShapeItemsTool(deps, context);

    expect(
      safeParseToolInput(tool, {
        items: [{ shapeKind: 'arrow', startFrame: 0, durationInFrames: 30 }],
      }).success,
    ).toBe(false);

    expect(
      safeParseToolInput(tool, {
        items: [
          {
            shapeKind: 'rectangle',
            startFrame: 0,
            durationInFrames: 30,
            style: { width: -10, height: 80 },
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('returns a clear error for conflicting add timing fields', async () => {
    const { deps, dispatchMessage } = createDeps();
    const tool = createAddShapeItemsTool(deps, context);

    const result = await tool.execute?.(
      {
        items: [
          {
            shapeKind: 'rectangle',
            startFrame: 15,
            startTimeInSeconds: 1,
            durationInFrames: 60,
          },
        ],
      },
      { toolCallId: 'shape-call-1', messages: [] },
    );

    expect(dispatchMessage).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: 'error',
      requestedCount: 1,
      error: expect.stringContaining('Conflicting timing fields'),
    });
  });

  it('dispatches add_shape_items through the editor realtime channel', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    const tool = createAddShapeItemsTool(deps, context);

    const result = await tool.execute?.(
      {
        items: [
          {
            shapeKind: 'rounded_rectangle',
            startFrame: 0,
            durationInFrames: 90,
            style: { width: 600, height: 140, fillColor: '#000000', opacity: 0.4 },
          },
        ],
      },
      { toolCallId: 'shape-call-1', messages: [] },
    );

    expect(waitForToolResult).toHaveBeenCalledWith('shape-call-1');
    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.editor,
        payload: expect.objectContaining({
          tool_name: editorToolNames.addShapeItems,
          toolCallId: 'shape-call-1',
          params: {
            items: [
              {
                shapeKind: 'rounded_rectangle',
                startFrame: 0,
                durationInFrames: 90,
                style: { width: 600, height: 140, fillColor: '#000000', opacity: 0.4 },
              },
            ],
          },
        }),
      }),
    );
    expect(result).toMatchObject({
      status: 'completed',
      createdItemIds: ['shape-1'],
      selectedItemIds: ['shape-1'],
    });
  });

  it('requires update targets and a non-empty patch', () => {
    const { deps } = createDeps();
    const tool = createUpdateShapeItemsTool(deps, context);

    expect(safeParseToolInput(tool, { itemIds: [], patch: { opacity: 0.4 } }).success).toBe(false);
    expect(safeParseToolInput(tool, { itemIds: ['shape-1'], patch: {} }).success).toBe(false);
  });

  it('dispatches update_shape_items through the editor realtime channel', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    waitForToolResult.mockResolvedValueOnce({
      toolCallId: 'shape-call-2',
      toolName: editorToolNames.updateShapeItems,
      status: 'success',
      output: {
        updatedItems: [{ itemId: 'shape-1', startFrame: 0, endFrame: 90 }],
        updatedItemIds: ['shape-1'],
        selectedItemIds: ['shape-1'],
        projectState: { visibleShapeItemsInfo: [{ itemId: 'shape-1', opacity: 0.25 }] },
      },
    });
    const tool = createUpdateShapeItemsTool(deps, context);

    const result = await tool.execute?.(
      {
        itemIds: ['shape-1'],
        patch: { opacity: 0.25, borderRadius: 32 },
        selectionBehavior: 'select_updated',
      },
      { toolCallId: 'shape-call-2', messages: [] },
    );

    expect(waitForToolResult).toHaveBeenCalledWith('shape-call-2');
    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.editor,
        payload: expect.objectContaining({
          tool_name: editorToolNames.updateShapeItems,
          toolCallId: 'shape-call-2',
          params: {
            itemIds: ['shape-1'],
            patch: { opacity: 0.25, borderRadius: 32 },
            selectionBehavior: 'select_updated',
          },
        }),
      }),
    );
    expect(result).toMatchObject({
      status: 'completed',
      updatedItemIds: ['shape-1'],
      selectedItemIds: ['shape-1'],
    });
  });
});
