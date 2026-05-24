import {
  editorToolNames,
  realtimeMessageTypes,
  type EditorAddShapeItemsPayload,
  type EditorUpdateShapeItemsPayload,
} from 'api-types';
import { stepCountIs, Tool, ToolLoopAgent } from 'ai';
import { z } from 'zod';
import { buildProviderOptions, getModelHeaders } from '../../models-config';
import { extractErrorDetail, mapToolResultStatus, stripUrlsFromProjectState } from './utils';
import { createGetItemsDataTool, createGetProjectStateTool } from './query.tools';
import { createSubagentDebugReporter } from './subagent-debug';
import {
  buildShapeDelegateModelOutput,
  buildShapeSpecialistPrompt,
  defaultShapeDelegateResult,
  parseShapeDelegateResult,
} from './shape-agent';
import { shapeItemInputSchema, shapePatchSchema, validateShapeTimings } from './shape-validation';
import type {
  AddShapeItemsInput,
  AddShapeItemsResult,
  DelegateShapeOverlayTaskInput,
  DelegateShapeOverlayTaskResult,
  ToolDependencies,
  ToolsContext,
  UpdateShapeItemsInput,
  UpdateShapeItemsResult,
} from './types';

const createShapeSpecialistTools = (
  deps: ToolDependencies,
  context?: ToolsContext,
): Record<string, Tool> => ({
  [editorToolNames.getProjectState]: createGetProjectStateTool(deps, context),
  [editorToolNames.getItemsData]: createGetItemsDataTool(deps, context),
  [editorToolNames.addShapeItems]: createAddShapeItemsTool(deps, context),
  [editorToolNames.updateShapeItems]: createUpdateShapeItemsTool(deps, context),
});

export function createDelegateShapeOverlayTaskTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<DelegateShapeOverlayTaskInput, DelegateShapeOverlayTaskResult> {
  return {
    description: 'Delegate a simple solid-backed shape overlay task to a specialist subagent.',
    inputSchema: z
      .object({
        task: z
          .string()
          .trim()
          .min(1)
          .max(700)
          .describe(
            'Short instruction for the shape specialist. Example: "Add a translucent highlight behind the title."',
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
      input: DelegateShapeOverlayTaskInput,
      { abortSignal, toolCallId }: { abortSignal?: AbortSignal; toolCallId?: string },
    ) => {
      const modelId = context?.modelId;
      if (!modelId) {
        return defaultShapeDelegateResult(
          'Shape specialist could not start.',
          'No model configuration was provided.',
        );
      }

      deps.logger?.debug('Starting shape overlay subagent.', { projectId: input.projectId });
      const agent = new ToolLoopAgent({
        model: deps.getLanguageModel(modelId),
        instructions: buildShapeSpecialistPrompt({ input }),
        tools: createShapeSpecialistTools(deps, context),
        stopWhen: stepCountIs(8),
        providerOptions: buildProviderOptions(modelId, context?.mode),
        headers: getModelHeaders(modelId),
      });

      const debugReporter = createSubagentDebugReporter({
        context,
        subagentName: 'shape-overlay-specialist',
        parentToolCallId: toolCallId,
        modelId,
      });
      debugReporter.started(input);

      try {
        const result = await agent.generate({
          prompt: input.task,
          abortSignal,
          onStepFinish: debugReporter.onStepFinish,
        });
        const output = parseShapeDelegateResult(result.text);
        debugReporter.completed({ finalText: result.text, output });
        deps.logger?.log('Shape overlay subagent completed.');
        return output;
      } catch (error) {
        debugReporter.error(error);
        throw error;
      }
    },
    toModelOutput: ({ output }: { output: DelegateShapeOverlayTaskResult }) =>
      buildShapeDelegateModelOutput(output),
  } as unknown as Tool<DelegateShapeOverlayTaskInput, DelegateShapeOverlayTaskResult>;
}

export function createAddShapeItemsTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<AddShapeItemsInput, AddShapeItemsResult> {
  return {
    description: 'Add one or more solid-backed shape overlay items to the timeline.',
    inputSchema: z.object({
      items: z.array(shapeItemInputSchema).nonempty('Provide at least one shape item'),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async ({ items, reason }: AddShapeItemsInput, { toolCallId }: { toolCallId?: string }) => {
      const fps = context?.projectState?.fpsInfo ?? 30;
      const timingError = validateShapeTimings({ items, fps });
      if (timingError) {
        return { status: 'error', requestedCount: items.length, note: timingError, error: timingError };
      }

      const resolvedToolCallId = toolCallId ?? `add-shape-items-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(resolvedToolCallId);
      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: {
          tool_name: editorToolNames.addShapeItems,
          params: { items },
          toolCallId: resolvedToolCallId,
          messageId: context?.messageId,
          requestedAt: new Date().toISOString(),
        } satisfies EditorAddShapeItemsPayload,
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
        createdItems: result.output?.createdItems as AddShapeItemsResult['createdItems'],
        createdItemIds: result.output?.createdItemIds as string[] | undefined,
        selectedItemIds: result.output?.selectedItemIds as string[] | undefined,
        note: reason ?? (mappedStatus === 'completed' ? 'Shape item(s) added.' : undefined),
        error: mappedStatus === 'error' ? extractErrorDetail(result) : undefined,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<AddShapeItemsInput, AddShapeItemsResult>;
}

export function createUpdateShapeItemsTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<UpdateShapeItemsInput, UpdateShapeItemsResult> {
  return {
    description: 'Update existing solid-backed shape overlay items without recreating them.',
    inputSchema: z.object({
      itemIds: z.array(z.string().trim().min(1)).nonempty('Provide at least one shape item ID'),
      patch: shapePatchSchema,
      selectionBehavior: z.enum(['select_updated', 'keep_current', 'none']).optional(),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async (
      { itemIds, patch, selectionBehavior, reason }: UpdateShapeItemsInput,
      { toolCallId }: { toolCallId?: string },
    ) => {
      const resolvedToolCallId = toolCallId ?? `update-shape-items-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(resolvedToolCallId);
      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: {
          tool_name: editorToolNames.updateShapeItems,
          params: { itemIds, patch, selectionBehavior },
          toolCallId: resolvedToolCallId,
          messageId: context?.messageId,
          requestedAt: new Date().toISOString(),
        } satisfies EditorUpdateShapeItemsPayload,
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
        updatedItems: result.output?.updatedItems as UpdateShapeItemsResult['updatedItems'],
        updatedItemIds: result.output?.updatedItemIds as string[] | undefined,
        selectedItemIds: result.output?.selectedItemIds as string[] | undefined,
        failedItems: result.output?.failedItems as UpdateShapeItemsResult['failedItems'],
        note: reason ?? (mappedStatus === 'completed' ? 'Shape item(s) updated.' : undefined),
        error: mappedStatus === 'error' ? extractErrorDetail(result) : undefined,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<UpdateShapeItemsInput, UpdateShapeItemsResult>;
}
