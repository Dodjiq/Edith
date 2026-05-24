/// <reference types="jest" />
import {
  createDelegateImagePictureTaskTool,
  createDelegateMotionDesignTaskTool,
  createDelegateShapeOverlayTaskTool,
  createDelegateTextOverlayTaskTool,
} from './index';
import type { ToolDependencies, ToolsContext } from './types';

type SafeParseResult = { success: boolean };

const safeParseToolInput = (tool: { inputSchema?: unknown }, input: unknown): SafeParseResult =>
  (tool.inputSchema as { safeParse: (value: unknown) => SafeParseResult }).safeParse(input);

describe('delegate tools', () => {
  const deps: ToolDependencies = {
    realtimeService: {
      dispatchMessage: jest.fn(),
    } as unknown as ToolDependencies['realtimeService'],
    waitForToolResult: jest.fn(),
    getLanguageModel: jest.fn() as unknown as ToolDependencies['getLanguageModel'],
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

  it('requires only a short task for every delegate tool', () => {
    const tools = [
      createDelegateTextOverlayTaskTool(deps, context),
      createDelegateImagePictureTaskTool(deps, context),
      createDelegateShapeOverlayTaskTool(deps, context),
      createDelegateMotionDesignTaskTool(deps, context),
    ];

    for (const tool of tools) {
      expect(
        safeParseToolInput(tool, {
          projectId: 'project-1',
        }).success,
      ).toBe(false);

      expect(
        safeParseToolInput(tool, {
          task: 'Add something simple to the timeline.',
          projectId: 'project-1',
        }).success,
      ).toBe(true);
    }
  });

  it('rejects the old bloated delegate payload shape', () => {
    const tool = createDelegateMotionDesignTaskTool(deps, context);

    expect(
      safeParseToolInput(tool, {
        task: 'Add a motion-design intro.',
        userRequest: 'Can you add some motion design on the timeline?',
        projectId: 'project-1',
        projectStateSnapshot: context.projectState,
      }).success,
    ).toBe(false);
  });
});
