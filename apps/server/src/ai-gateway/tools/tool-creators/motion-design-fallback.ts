import type {
  AddMotionDesignItemsInput,
  AddMotionDesignItemsResult,
  DelegateMotionDesignTaskInput,
  DelegateMotionDesignTaskResult,
  ToolsContext,
} from './types';

const hasAddIntent = (task: string) =>
  /\b(add|create|make|build|implement|insert|showcase|montage|library)\b/i.test(task);

const resolveStartFrame = ({ input, fps }: { input: DelegateMotionDesignTaskInput; fps: number }) => {
  if (input.timeRange?.startFrame !== undefined) return input.timeRange.startFrame;
  if (input.timeRange?.startTimeInSeconds !== undefined) {
    return Math.round(input.timeRange.startTimeInSeconds * fps);
  }
  return 0;
};

const resolveTotalFrames = ({ input, fps }: { input: DelegateMotionDesignTaskInput; fps: number }) => {
  const startFrame = resolveStartFrame({ input, fps });
  if (input.timeRange?.endFrame !== undefined && input.timeRange.endFrame > startFrame) {
    return input.timeRange.endFrame - startFrame;
  }
  if (input.timeRange?.endTimeInSeconds !== undefined) {
    const endFrame = Math.round(input.timeRange.endTimeInSeconds * fps);
    if (endFrame > startFrame) return endFrame - startFrame;
  }
  return fps * 12;
};

const getTitle = (task: string) => {
  if (/gaia/i.test(task)) return 'Gaia motion system';
  if (/chat|social|mockup|chart/i.test(task)) return 'Product motion kit';
  return 'Motion design';
};

export const shouldUseDirectMotionDesignFallback = ({
  input,
  context,
}: {
  input: DelegateMotionDesignTaskInput;
  context?: ToolsContext;
}) => {
  const hasTargets = (input.targetItemIds?.length ?? 0) > 0;
  const hasItems = (context?.projectState?.projectItemsInfo?.length ?? 0) > 0;
  return hasAddIntent(input.task) && !hasTargets && !hasItems;
};

export const shouldFallbackAfterMotionDesignSubagent = ({
  input,
  output,
}: {
  input: DelegateMotionDesignTaskInput;
  output: DelegateMotionDesignTaskResult;
}) =>
  hasAddIntent(input.task) &&
  output.createdItemIds.length === 0 &&
  output.updatedItemIds.length === 0 &&
  (output.status === 'error' || output.status === 'needs_clarification');

export const createFallbackMotionDesignItems = ({
  input,
  fps,
}: {
  input: DelegateMotionDesignTaskInput;
  fps: number;
}): AddMotionDesignItemsInput['items'] => {
  const startFrame = resolveStartFrame({ input, fps });
  const totalFrames = Math.max(fps * 6, resolveTotalFrames({ input, fps }));
  const itemCount = totalFrames >= fps * 15 ? 3 : totalFrames >= fps * 8 ? 2 : 1;
  const segmentFrames = Math.max(fps * 3, Math.floor(totalFrames / itemCount));
  const title = getTitle(input.task);

  const items: AddMotionDesignItemsInput['items'] = [
    {
      templateId: 'blur-word-title',
      startFrame,
      durationInFrames: segmentFrames,
      props: {
        text: title,
        primaryColor: '#ffffff',
        accentColor: '#38bdf8',
        fontSize: 92,
        staggerFrames: 3,
      },
    },
    {
      templateId: 'card-stack-3d',
      startFrame: startFrame + segmentFrames,
      durationInFrames: segmentFrames,
      props: {
        items: ['Scenes', 'Charts', 'Chat', 'Social'],
        primaryColor: '#ffffff',
        accentColor: '#a78bfa',
        backgroundColor: '#111827',
        staggerFrames: 8,
      },
    },
    {
      templateId: 'lower-third-slide',
      startFrame: startFrame + segmentFrames * 2,
      durationInFrames: segmentFrames,
      props: {
        text: 'Frames & mockups',
        secondaryText: 'Text animation ready',
        primaryColor: '#ffffff',
        accentColor: '#34d399',
        backgroundColor: '#0f172a',
        fontSize: 52,
      },
    },
  ];

  return items.slice(0, itemCount);
};

export const buildDelegateResultFromFallbackAdd = (
  result: AddMotionDesignItemsResult | undefined,
): DelegateMotionDesignTaskResult => {
  if (!result) {
    return {
      status: 'error',
      createdItemIds: [],
      updatedItemIds: [],
      deletedItemIds: [],
      selectedItemIds: [],
      usedTemplateIds: [],
      summary: 'Motion design fallback did not return a result.',
      unresolvedIssue: 'No response received from fallback add tool.',
    };
  }

  const createdItemIds = result.createdItemIds ?? result.createdItems?.map((item) => item.itemId) ?? [];
  const usedTemplateIds = result.createdItems?.map((item) => item.templateId) ?? [];
  const isSuccess = result.status === 'completed' && createdItemIds.length > 0;

  return {
    status: isSuccess ? 'success' : 'error',
    createdItemIds,
    updatedItemIds: [],
    deletedItemIds: [],
    selectedItemIds: result.selectedItemIds ?? createdItemIds,
    usedTemplateIds,
    summary: isSuccess
      ? `Added ${createdItemIds.length} motion-design item(s) from the built-in library.`
      : 'Motion design fallback could not add items.',
    unresolvedIssue: isSuccess ? undefined : (result.error ?? result.note ?? 'Fallback add failed.'),
  };
};
