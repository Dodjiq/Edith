/// <reference types="jest" />
import { editorToolNames, getMotionDesignTimingCheck, realtimeMessageTypes } from 'api-types';
import {
  createAddMotionDesignItemsTool,
  createDelegateMotionDesignTaskTool,
  createGetMotionDesignPresetDetailsTool,
  createGetMotionDesignTemplatesTool,
  MOTION_DESIGN_EDITOR_RESULT_TIMEOUT_MS,
  createUpdateMotionDesignItemsTool,
} from './motion-design.tools';
import { parseMotionDesignDelegateResult } from './motion-design-agent';
import type { GetMotionDesignPresetDetailsResult, GetMotionDesignTemplatesResult, ToolDependencies, ToolsContext } from './types';

type SafeParseResult = { success: boolean };

const task = 'Add a clean six-second motion-design intro at the start of the timeline.';

const safeParseToolInput = (tool: { inputSchema?: unknown }, input: unknown): SafeParseResult =>
  (tool.inputSchema as { safeParse: (value: unknown) => SafeParseResult }).safeParse(input);

describe('motion design tools', () => {
  const createDeps = () => {
    const dispatchMessage = jest.fn();
    const waitForToolResult = jest.fn().mockResolvedValue({
      toolCallId: 'motion-call-1',
      toolName: editorToolNames.addMotionDesignItems,
      status: 'success',
      output: {
        createdItems: [{ itemId: 'motion-1', templateId: 'blur-word-title', startFrame: 0, endFrame: 90 }],
        createdItemIds: ['motion-1'],
        selectedItemIds: ['motion-1'],
        projectState: { visibleMotionDesignItemsInfo: [{ itemId: 'motion-1', type: 'motion-design' }] },
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

  it('lists templates from the shared catalog', async () => {
    const tool = createGetMotionDesignTemplatesTool();

    const result = (await tool.execute?.(
      { search: 'counter' },
      { toolCallId: 'templates-call', messages: [] },
    )) as GetMotionDesignTemplatesResult;

    expect(result?.status).toBe('completed');
    expect(result?.count).toBeGreaterThan(0);
    expect(result?.templates.some((template) => template.id === 'counter-pop')).toBe(true);
    expect(result?.templates.every((template) => template.agentDescription.length > 20)).toBe(true);
  });

  it('searches templates by agent selection descriptions', async () => {
    const tool = createGetMotionDesignTemplatesTool();

    const result = (await tool.execute?.(
      { search: 'speaker names' },
      { toolCallId: 'templates-call', messages: [] },
    )) as GetMotionDesignTemplatesResult;

    expect(result?.templates.some((template) => template.id === 'lower-third-slide')).toBe(true);
  });

  it('returns full preset details for Motion Studio presets', async () => {
    const tool = createGetMotionDesignPresetDetailsTool();

    const result = (await tool.execute?.(
      { templateId: 'ms-title-popup' },
      { toolCallId: 'details-call', messages: [] },
    )) as GetMotionDesignPresetDetailsResult;

    expect(result.status).toBe('completed');
    expect(result.template?.motionStudioId).toBe('TitlePopup');
    expect(result.supportedPropKeys).toContain('headline');
    expect(result.effects?.some((effect) => effect.id === 'Pop')).toBe(true);
  });

  it('rejects unknown templates and invalid props', () => {
    const { deps } = createDeps();
    const tool = createAddMotionDesignItemsTool(deps, context);

    expect(
      safeParseToolInput(tool, {
        items: [{ templateId: 'unknown-template', startFrame: 0, durationInFrames: 30 }],
      }).success,
    ).toBe(false);

    expect(
      safeParseToolInput(tool, {
        items: [{ templateId: 'counter-pop', props: { endValue: 'a lot' } }],
      }).success,
    ).toBe(false);
  });

  it('rejects props that are unsupported by the selected template', () => {
    const { deps } = createDeps();
    const tool = createAddMotionDesignItemsTool(deps, context);

    expect(
      safeParseToolInput(tool, {
        items: [{ templateId: 'typing-code-block', props: { intensity: 1.75 } }],
      }).success,
    ).toBe(false);

    expect(
      safeParseToolInput(tool, {
        items: [{ templateId: 'typing-code-block', props: { typingSpeed: 1.75 } }],
      }).success,
    ).toBe(true);
  });

  it('maps completed delegate JSON and nullable unresolved issue to success', () => {
    const result = parseMotionDesignDelegateResult(
      JSON.stringify({
        status: 'completed',
        createdItemIds: [],
        updatedItemIds: ['motion-1'],
        deletedItemIds: [],
        selectedItemIds: ['motion-1'],
        usedTemplateIds: ['typing-code-block'],
        summary: 'Updated timing.',
        unresolvedIssue: null,
      }),
    );

    expect(result).toMatchObject({
      status: 'success',
      updatedItemIds: ['motion-1'],
    });
    expect(result.unresolvedIssue).toBeUndefined();
  });

  it('fills missing delegate result arrays from plain JSON text', () => {
    const result = parseMotionDesignDelegateResult(
      JSON.stringify({
        status: 'success',
        summary: 'Added a title accent.',
      }),
    );

    expect(result).toMatchObject({
      status: 'success',
      createdItemIds: [],
      updatedItemIds: [],
      deletedItemIds: [],
      selectedItemIds: [],
      usedTemplateIds: [],
      unresolvedIssue: undefined,
    });
  });

  it('keeps invalid delegate JSON as a compact parse error', () => {
    const result = parseMotionDesignDelegateResult('not json');

    expect(result).toMatchObject({
      status: 'error',
      summary: 'not json',
      unresolvedIssue: 'Invalid specialist output.',
    });
  });

  it('auto-fits a six-line typing code block into 180 frames', () => {
    const code = Array.from({ length: 6 }, () => 'await editor.addMotionDesign();').join('\n');
    const result = getMotionDesignTimingCheck({
      templateId: 'typing-code-block',
      props: { code, typingSpeed: 1 },
      durationInFrames: 180,
    });

    expect(result.contentUnits).toBe(191);
    expect(result.completesBeforeEnd).toBe(true);
    expect(result.autoFitApplied).toBe(true);
    expect(result.completionFrame).toBeLessThanOrEqual(174);
    expect(result.effectiveFramesPerUnit).toBeLessThan(1);
  });

  it('honors explicit speed and line interval timing controls', () => {
    const fastTyping = getMotionDesignTimingCheck({
      templateId: 'typing-code-block',
      props: { code: 'abcd', typingSpeed: 2 },
      durationInFrames: 180,
    });
    const lineReveal = getMotionDesignTimingCheck({
      templateId: 'basic-code-block',
      props: { code: 'a\nb\nc', lineRevealIntervalFrames: 4 },
      durationInFrames: 180,
    });

    expect(fastTyping.effectiveFramesPerUnit).toBe(1);
    expect(lineReveal.effectiveFramesPerUnit).toBe(4);
    expect(lineReveal.completionFrame).toBe(8);
  });

  it('returns a structured delegate error when model configuration is missing', async () => {
    const { deps } = createDeps();
    const tool = createDelegateMotionDesignTaskTool(deps, context);

    const result = await tool.execute?.(
      {
        task: 'Restyle the existing motion design item.',
        projectId: 'project-1',
        targetItemIds: ['motion-1'],
      },
      { toolCallId: 'motion-delegate-call', messages: [] },
    );

    expect(deps.getLanguageModel).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: 'error',
      summary: 'Motion design specialist could not start.',
      unresolvedIssue: 'No model configuration was provided.',
    });
  });

  it('uses a direct built-in library fallback for additive empty-project requests', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    const tool = createDelegateMotionDesignTaskTool(deps, context);

    const result = await tool.execute?.(
      {
        task,
        projectId: 'project-1',
        timeRange: { startFrame: 0, endFrame: 900 },
      },
      { toolCallId: 'motion-delegate-call', messages: [] },
    );

    expect(deps.getLanguageModel).not.toHaveBeenCalled();
    expect(waitForToolResult).toHaveBeenCalledWith(
      expect.stringMatching(/^motion-design-fallback-/),
      MOTION_DESIGN_EDITOR_RESULT_TIMEOUT_MS,
    );
    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          tool_name: editorToolNames.addMotionDesignItems,
          params: expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({ templateId: 'blur-word-title' }),
              expect.objectContaining({ templateId: 'card-stack-3d' }),
              expect.objectContaining({ templateId: 'lower-third-slide' }),
            ]),
          }),
        }),
      }),
    );
    expect(result).toMatchObject({
      status: 'success',
      createdItemIds: ['motion-1'],
      usedTemplateIds: ['blur-word-title'],
    });
  });

  it('requires a short task before delegating motion design', () => {
    const { deps } = createDeps();
    const tool = createDelegateMotionDesignTaskTool(deps, context);

    expect(
      safeParseToolInput(tool, {
        projectId: 'project-1',
      }).success,
    ).toBe(false);

    expect(
      safeParseToolInput(tool, {
        task,
        projectId: 'project-1',
      }).success,
    ).toBe(true);
  });

  it('returns a clear error for conflicting add timing fields', async () => {
    const { deps, dispatchMessage } = createDeps();
    const tool = createAddMotionDesignItemsTool(deps, context);

    const result = await tool.execute?.(
      {
        items: [{ templateId: 'blur-word-title', startFrame: 15, startTimeInSeconds: 1 }],
      },
      { toolCallId: 'motion-call-1', messages: [] },
    );

    expect(dispatchMessage).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: 'error',
      requestedCount: 1,
      error: expect.stringContaining('Conflicting timing fields'),
    });
  });

  it('dispatches add_motion_design_items through the editor realtime channel', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    const tool = createAddMotionDesignItemsTool(deps, context);

    const result = await tool.execute?.(
      {
        items: [
          {
            templateId: 'blur-word-title',
            startFrame: 0,
            durationInFrames: 90,
            props: { text: 'Launch Week' },
          },
        ],
      },
      { toolCallId: 'motion-call-1', messages: [] },
    );

    expect(waitForToolResult).toHaveBeenCalledWith('motion-call-1', MOTION_DESIGN_EDITOR_RESULT_TIMEOUT_MS);
    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.editor,
        payload: expect.objectContaining({
          tool_name: editorToolNames.addMotionDesignItems,
          toolCallId: 'motion-call-1',
          params: {
            items: [
              {
                templateId: 'blur-word-title',
                startFrame: 0,
                durationInFrames: 90,
                props: { text: 'Launch Week' },
              },
            ],
          },
        }),
      }),
    );
    expect(result).toMatchObject({
      status: 'completed',
      createdItemIds: ['motion-1'],
      selectedItemIds: ['motion-1'],
    });
  });

  it('requires update targets and a non-empty patch', () => {
    const { deps } = createDeps();
    const tool = createUpdateMotionDesignItemsTool(deps, context);

    expect(safeParseToolInput(tool, { itemIds: [], patch: { opacity: 0.8 } }).success).toBe(false);
    expect(safeParseToolInput(tool, { itemIds: ['motion-1'], patch: {} }).success).toBe(false);
  });

  it('rejects unsupported update props before dispatching when template context is known', async () => {
    const { deps, dispatchMessage } = createDeps();
    const tool = createUpdateMotionDesignItemsTool(deps, {
      ...context,
      projectState: {
        ...context.projectState!,
        visibleMotionDesignItemsInfo: [
          {
            itemId: 'motion-1',
            type: 'motion-design',
            templateId: 'typing-code-block',
            from: 0,
            durationInFrames: 180,
            startTimeInSeconds: 0,
            endTimeInSeconds: 6,
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            opacity: 1,
          },
        ],
      },
    });

    const result = await tool.execute?.(
      {
        itemIds: ['motion-1'],
        patch: { props: { intensity: 1.75 } },
      },
      { toolCallId: 'motion-call-2', messages: [] },
    );

    expect(dispatchMessage).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: 'error',
      rejectedProps: ['intensity'],
      error: expect.stringContaining('intensity'),
    });
  });

  it('dispatches update_motion_design_items through the editor realtime channel', async () => {
    const { deps, dispatchMessage, waitForToolResult } = createDeps();
    waitForToolResult.mockResolvedValueOnce({
      toolCallId: 'motion-call-2',
      toolName: editorToolNames.updateMotionDesignItems,
      status: 'success',
      output: {
        updatedItems: [{ itemId: 'motion-1', templateId: 'counter-pop', startFrame: 0, endFrame: 120 }],
        updatedItemIds: ['motion-1'],
        selectedItemIds: ['motion-1'],
        projectState: { visibleMotionDesignItemsInfo: [{ itemId: 'motion-1', templateId: 'counter-pop' }] },
      },
    });
    const tool = createUpdateMotionDesignItemsTool(deps, context);

    const result = await tool.execute?.(
      {
        itemIds: ['motion-1'],
        patch: { templateId: 'counter-pop', props: { endValue: 1000, suffix: '+' } },
        selectionBehavior: 'select_updated',
      },
      { toolCallId: 'motion-call-2', messages: [] },
    );

    expect(waitForToolResult).toHaveBeenCalledWith('motion-call-2', MOTION_DESIGN_EDITOR_RESULT_TIMEOUT_MS);
    expect(dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.editor,
        payload: expect.objectContaining({
          tool_name: editorToolNames.updateMotionDesignItems,
          toolCallId: 'motion-call-2',
          params: {
            itemIds: ['motion-1'],
            patch: { templateId: 'counter-pop', props: { endValue: 1000, suffix: '+' } },
            selectionBehavior: 'select_updated',
          },
        }),
      }),
    );
    expect(result).toMatchObject({
      status: 'completed',
      updatedItemIds: ['motion-1'],
      selectedItemIds: ['motion-1'],
    });
  });
});
