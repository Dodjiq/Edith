import {
  editorToolNames,
  getMotionDesignSupportedPropKeys,
  getMotionDesignTemplateForAgent,
  motionDesignEffects,
  motionDesignCategories,
  motionDesignTemplatesForAgents,
  realtimeMessageTypes,
  type EditorAddMotionDesignItemsPayload,
  type EditorUpdateMotionDesignItemsPayload,
} from 'api-types';
import { stepCountIs, Tool, ToolLoopAgent } from 'ai';
import { z } from 'zod';
import { buildProviderOptions, getModelHeaders } from '../../models-config';
import { createGetItemsDataTool, createGetProjectStateTool } from './query.tools';
import { createSubagentDebugReporter } from './subagent-debug';
import {
  buildMotionDesignDelegateModelOutput,
  buildMotionDesignSpecialistPrompt,
  defaultMotionDesignDelegateResult,
  parseMotionDesignDelegateResult,
} from './motion-design-agent';
import {
  buildDelegateResultFromFallbackAdd,
  createFallbackMotionDesignItems,
  shouldFallbackAfterMotionDesignSubagent,
  shouldUseDirectMotionDesignFallback,
} from './motion-design-fallback';
import {
  motionDesignItemInputSchema,
  motionDesignPatchSchema,
  validateMotionDesignPatchProps,
  validateMotionDesignTimings,
} from './motion-design-validation';
import { extractErrorDetail, mapToolResultStatus, stripUrlsFromProjectState } from './utils';
import type {
  AddMotionDesignItemsInput,
  AddMotionDesignItemsResult,
  DelegateMotionDesignTaskInput,
  DelegateMotionDesignTaskResult,
  GetMotionDesignTemplatesInput,
  GetMotionDesignTemplatesResult,
  GetMotionDesignPresetDetailsInput,
  GetMotionDesignPresetDetailsResult,
  ToolDependencies,
  ToolsContext,
  UpdateMotionDesignItemsInput,
  UpdateMotionDesignItemsResult,
} from './types';

export const MOTION_DESIGN_AGENT_TIMEOUT_MS = 120 * 1000;
export const MOTION_DESIGN_EDITOR_RESULT_TIMEOUT_MS = 90 * 1000;

const createMotionDesignSpecialistTools = (
  deps: ToolDependencies,
  context?: ToolsContext,
): Record<string, Tool> => ({
  [editorToolNames.getProjectState]: createGetProjectStateTool(deps, context),
  [editorToolNames.getItemsData]: createGetItemsDataTool(deps, context),
  [editorToolNames.getMotionDesignTemplates]: createGetMotionDesignTemplatesTool(),
  [editorToolNames.getMotionDesignPresetDetails]: createGetMotionDesignPresetDetailsTool(),
  [editorToolNames.addMotionDesignItems]: createAddMotionDesignItemsTool(deps, context),
  [editorToolNames.updateMotionDesignItems]: createUpdateMotionDesignItemsTool(deps, context),
});

export function createDelegateMotionDesignTaskTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<DelegateMotionDesignTaskInput, DelegateMotionDesignTaskResult> {
  return {
    description: 'Delegate a simple Remotion motion-design task to a specialist subagent.',
    inputSchema: z
      .object({
        task: z
          .string()
          .trim()
          .min(1)
          .max(700)
          .describe(
            'Short instruction for the motion-design specialist. Example: "Add a clean 5 second animated title intro."',
          ),
        projectId: z.string().trim().min(1),
        targetItemIds: z.array(z.string().trim().min(1)).optional(),
        timeRange: z
          .object({
            startTimeInSeconds: z.number().min(0).optional(),
            endTimeInSeconds: z.number().min(0).optional(),
            startFrame: z.number().int().min(0).optional(),
            endFrame: z.number().int().min(0).optional(),
          })
          .optional(),
        reason: z.string().trim().max(200).optional(),
      })
      .strict(),
    execute: async (
      input: DelegateMotionDesignTaskInput,
      { abortSignal, toolCallId }: { abortSignal?: AbortSignal; toolCallId?: string },
    ) => {
      const addFallbackItems = async (reason: string) => {
        const addResult = await createAddMotionDesignItemsTool(deps, context).execute?.(
          {
            items: createFallbackMotionDesignItems({
              input,
              fps: context?.projectState?.fpsInfo ?? 30,
            }),
            reason,
          },
          { toolCallId: `motion-design-fallback-${Date.now()}`, messages: [] },
        );
        return buildDelegateResultFromFallbackAdd(addResult as AddMotionDesignItemsResult | undefined);
      };

      if (shouldUseDirectMotionDesignFallback({ input, context })) {
        deps.logger?.debug('Using direct motion design library fallback.', { projectId: input.projectId });
        return addFallbackItems('Add built-in motion design library items for an empty project.');
      }

      const modelId = context?.modelId;
      if (!modelId) {
        return defaultMotionDesignDelegateResult(
          'Motion design specialist could not start.',
          'No model configuration was provided.',
        );
      }

      deps.logger?.debug('Starting motion design subagent.', { projectId: input.projectId });
      const agent = new ToolLoopAgent({
        model: deps.getLanguageModel(modelId),
        instructions: buildMotionDesignSpecialistPrompt({
          input,
        }),
        tools: createMotionDesignSpecialistTools(deps, context),
        stopWhen: stepCountIs(8),
        providerOptions: buildProviderOptions(modelId, context?.mode),
        headers: getModelHeaders(modelId),
      });

      const debugReporter = createSubagentDebugReporter({
        context,
        subagentName: 'motion-design-specialist',
        parentToolCallId: toolCallId,
        modelId,
      });
      debugReporter.started(input);

      try {
        const result = await agent.generate({
          prompt: input.task,
          abortSignal,
          timeout: MOTION_DESIGN_AGENT_TIMEOUT_MS,
          onStepFinish: debugReporter.onStepFinish,
        });
        const output = parseMotionDesignDelegateResult(result.text);
        debugReporter.completed({ finalText: result.text, output });
        deps.logger?.log('Motion design subagent completed.');
        if (shouldFallbackAfterMotionDesignSubagent({ input, output })) {
          deps.logger?.debug('Motion design subagent produced no usable edit; using fallback.', {
            projectId: input.projectId,
          });
          return addFallbackItems('Fallback after motion design specialist returned no usable edit.');
        }

        return output;
      } catch (error) {
        if (abortSignal?.aborted) {
          throw error;
        }

        const message = error instanceof Error ? error.message : 'Motion design specialist failed.';
        debugReporter.error(error);
        deps.logger?.warn(`Motion design subagent failed: ${message}`);
        return defaultMotionDesignDelegateResult('Motion design specialist failed.', message);
      }
    },
    toModelOutput: ({ output }: { output: DelegateMotionDesignTaskResult }) =>
      buildMotionDesignDelegateModelOutput(output),
  } as unknown as Tool<DelegateMotionDesignTaskInput, DelegateMotionDesignTaskResult>;
}

export function createGetMotionDesignTemplatesTool(): Tool<
  GetMotionDesignTemplatesInput,
  GetMotionDesignTemplatesResult
> {
  return {
    description: 'List the available Remotion motion-design templates and their editable controls.',
    inputSchema: z.object({
      category: z.enum(motionDesignCategories).optional(),
      search: z.string().trim().max(80).optional(),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async ({ category, search }: GetMotionDesignTemplatesInput) => {
      const normalizedSearch = search?.trim().toLowerCase();
      const templates = motionDesignTemplatesForAgents.filter((template) => {
        const matchesCategory = !category || template.category === category;
        const matchesSearch =
          !normalizedSearch ||
          [
            template.id,
            template.label,
            template.description,
            template.agentDescription,
            template.category,
            ...template.tags,
          ]
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch);
        return matchesCategory && matchesSearch;
      });

      return {
        status: 'completed',
        templates,
        count: templates.length,
      };
    },
  } as unknown as Tool<GetMotionDesignTemplatesInput, GetMotionDesignTemplatesResult>;
}

export function createGetMotionDesignPresetDetailsTool(): Tool<
  GetMotionDesignPresetDetailsInput,
  GetMotionDesignPresetDetailsResult
> {
  return {
    description:
      'Get full details for one motion design preset: behavior, parameters, editable fields, effects, and agent tips.',
    inputSchema: z.object({
      templateId: z.string().trim().min(1),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async ({ templateId }: GetMotionDesignPresetDetailsInput) => {
      const template = getMotionDesignTemplateForAgent(templateId);
      if (!template) {
        return {
          status: 'error',
          templateId,
          error: `Unknown motion design preset: ${templateId}`,
        };
      }

      return {
        status: 'completed',
        templateId,
        template,
        supportedPropKeys: [...getMotionDesignSupportedPropKeys(templateId)],
        effects: template.supportsEffects ? [...motionDesignEffects] : [],
        tips: [
          'Use only keys listed in supportedPropKeys when setting props.',
          'Use defaultProps as the safest starting point and patch only the values needed for the user request.',
          template.source === 'motion-studio'
            ? 'This is a Motion Studio scene. Prefer full-frame placement unless the user asks for a smaller overlay.'
            : 'This is a legacy Edith preset. It uses the existing lightweight renderer.',
          template.supportsEffects
            ? 'Effects are optional. Pass effects as an array with id, effectId, and props when the user asks for extra entrance, exit, range, or loop motion.'
            : 'This preset does not support Motion Studio effect wrappers.',
        ],
      };
    },
  } as unknown as Tool<GetMotionDesignPresetDetailsInput, GetMotionDesignPresetDetailsResult>;
}

export function createAddMotionDesignItemsTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<AddMotionDesignItemsInput, AddMotionDesignItemsResult> {
  return {
    description: 'Add one or more Remotion motion-design items to the timeline.',
    inputSchema: z.object({
      items: z.array(motionDesignItemInputSchema).nonempty('Provide at least one motion design item'),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async (
      { items, reason }: AddMotionDesignItemsInput,
      { toolCallId }: { toolCallId?: string },
    ) => {
      const fps = context?.projectState?.fpsInfo ?? 30;
      const timingError = validateMotionDesignTimings({ items, fps });
      if (timingError) {
        return { status: 'error', requestedCount: items.length, note: timingError, error: timingError };
      }

      const resolvedToolCallId = toolCallId ?? `add-motion-design-items-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(
        resolvedToolCallId,
        MOTION_DESIGN_EDITOR_RESULT_TIMEOUT_MS,
      );
      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: {
          tool_name: editorToolNames.addMotionDesignItems,
          params: { items },
          toolCallId: resolvedToolCallId,
          messageId: context?.messageId,
          requestedAt: new Date().toISOString(),
        } satisfies EditorAddMotionDesignItemsPayload,
        timestamp: new Date().toISOString(),
      });
      const result = await waitForResult;
      if ('status' in result && result.status === 'timeout') {
        return { status: 'timeout', requestedCount: items.length, note: 'No response received from editor.' };
      }
      const mappedStatus = mapToolResultStatus(result.status, {
        success: 'completed' as const,
        skipped: 'skipped' as const,
        error: 'error' as const,
      });
      const rawProjectState = result.output?.projectState as Record<string, unknown> | undefined;
      return {
        status: mappedStatus,
        requestedCount: items.length,
        createdItems: result.output?.createdItems as AddMotionDesignItemsResult['createdItems'],
        createdItemIds: result.output?.createdItemIds as string[] | undefined,
        selectedItemIds: result.output?.selectedItemIds as string[] | undefined,
        animationCheck: result.output?.animationCheck as AddMotionDesignItemsResult['animationCheck'],
        changedFields: result.output?.changedFields as string[] | undefined,
        rejectedProps: result.output?.rejectedProps as string[] | undefined,
        note: reason ?? (mappedStatus === 'completed' ? 'Motion design item(s) added.' : undefined),
        error: mappedStatus === 'error' ? extractErrorDetail(result) : undefined,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<AddMotionDesignItemsInput, AddMotionDesignItemsResult>;
}

export function createUpdateMotionDesignItemsTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<UpdateMotionDesignItemsInput, UpdateMotionDesignItemsResult> {
  return {
    description: 'Update existing Remotion motion-design items without recreating them.',
    inputSchema: z.object({
      itemIds: z.array(z.string().trim().min(1)).nonempty('Provide at least one motion design item ID'),
      patch: motionDesignPatchSchema,
      selectionBehavior: z.enum(['select_updated', 'keep_current', 'none']).optional(),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async (
      { itemIds, patch, selectionBehavior, reason }: UpdateMotionDesignItemsInput,
      { toolCallId }: { toolCallId?: string },
    ) => {
      const propError = validateMotionDesignPatchProps({ itemIds, patch, context });
      if (propError) {
        return {
          status: 'error',
          requestedItemIds: itemIds,
          rejectedProps: propError.rejectedProps,
          note: propError.message,
          error: propError.message,
        };
      }

      const resolvedToolCallId = toolCallId ?? `update-motion-design-items-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(
        resolvedToolCallId,
        MOTION_DESIGN_EDITOR_RESULT_TIMEOUT_MS,
      );
      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: {
          tool_name: editorToolNames.updateMotionDesignItems,
          params: { itemIds, patch, selectionBehavior },
          toolCallId: resolvedToolCallId,
          messageId: context?.messageId,
          requestedAt: new Date().toISOString(),
        } satisfies EditorUpdateMotionDesignItemsPayload,
        timestamp: new Date().toISOString(),
      });
      const result = await waitForResult;
      if ('status' in result && result.status === 'timeout') {
        return { status: 'timeout', requestedItemIds: itemIds, note: 'No response received from editor.' };
      }
      const mappedStatus = mapToolResultStatus(result.status, {
        success: 'completed' as const,
        skipped: 'skipped' as const,
        error: 'error' as const,
      });
      const rawProjectState = result.output?.projectState as Record<string, unknown> | undefined;
      return {
        status: mappedStatus,
        requestedItemIds: itemIds,
        updatedItems: result.output?.updatedItems as UpdateMotionDesignItemsResult['updatedItems'],
        updatedItemIds: result.output?.updatedItemIds as string[] | undefined,
        selectedItemIds: result.output?.selectedItemIds as string[] | undefined,
        failedItems: result.output?.failedItems as UpdateMotionDesignItemsResult['failedItems'],
        animationCheck: result.output?.animationCheck as UpdateMotionDesignItemsResult['animationCheck'],
        changedFields: result.output?.changedFields as string[] | undefined,
        rejectedProps: result.output?.rejectedProps as string[] | undefined,
        note: reason ?? (mappedStatus === 'completed' ? 'Motion design item(s) updated.' : undefined),
        error: mappedStatus === 'error' ? extractErrorDetail(result) : undefined,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<UpdateMotionDesignItemsInput, UpdateMotionDesignItemsResult>;
}
