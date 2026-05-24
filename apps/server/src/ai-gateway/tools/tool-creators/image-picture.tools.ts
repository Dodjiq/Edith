import {
  editorToolNames,
  realtimeMessageTypes,
  type EditorAddImageItemsPayload,
  type EditorUpdateImageItemsPayload,
} from 'api-types';
import { stepCountIs, Tool, ToolLoopAgent } from 'ai';
import { z } from 'zod';
import { buildProviderOptions, getModelHeaders } from '../../models-config';
import { extractErrorDetail, mapToolResultStatus, stripUrlsFromProjectState } from './utils';
import { validateImageUpdateRequest } from './image-picture-validation';
import {
  buildImageDelegateModelOutput,
  buildImageSpecialistPrompt,
  defaultDelegateResult,
  parseDelegateResult,
} from './image-picture-agent';
import {
  createGetItemsDataTool,
  createGetLibraryAssetsDataTool,
  createGetProjectStateTool,
} from './query.tools';
import { createSubagentDebugReporter } from './subagent-debug';
import type {
  AddImageItemsInput,
  AddImageItemsResult,
  DelegateImagePictureTaskInput,
  DelegateImagePictureTaskResult,
  ToolDependencies,
  ToolsContext,
  UpdateImageItemsInput,
  UpdateImageItemsResult,
} from './types';

const objectFitSchema = z.enum(['contain', 'cover', 'fill']);

const imageStyleSchema = z.object({
  left: z.number().optional(),
  top: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  opacity: z.number().min(0).max(1).optional(),
  rotation: z.number().optional(),
  borderRadius: z.number().min(0).optional(),
  keepAspectRatio: z.boolean().optional(),
  fadeInDurationInSeconds: z.number().min(0).optional(),
  fadeOutDurationInSeconds: z.number().min(0).optional(),
  objectFit: objectFitSchema.optional(),
});

const imageItemInputSchema = z.object({
  assetId: z.string().trim().min(1),
  startFrame: z.number().int().min(0).optional(),
  startTimeInSeconds: z.number().min(0).optional(),
  durationInFrames: z.number().int().positive().optional(),
  durationInSeconds: z.number().positive().optional(),
  xOnCanvas: z.number().optional(),
  yOnCanvas: z.number().optional(),
  style: imageStyleSchema.optional(),
});

const imagePatchSchema = imageStyleSchema.extend({
  assetId: z.string().trim().min(1).optional(),
  from: z.number().int().min(0).optional(),
  durationInFrames: z.number().int().positive().optional(),
  startTimeInSeconds: z.number().min(0).optional(),
  durationInSeconds: z.number().positive().optional(),
  xOnCanvas: z.number().optional(),
  yOnCanvas: z.number().optional(),
});

const createImageSpecialistTools = (
  deps: ToolDependencies,
  context?: ToolsContext,
): Record<string, Tool> => ({
  [editorToolNames.getProjectState]: createGetProjectStateTool(deps, context),
  [editorToolNames.getItemsData]: createGetItemsDataTool(deps, context),
  [editorToolNames.getLibraryAssetsData]: createGetLibraryAssetsDataTool(deps, context),
  [editorToolNames.addImageItems]: createAddImageItemsTool(deps, context),
  [editorToolNames.updateImageItems]: createUpdateImageItemsTool(deps, context),
});

export function createDelegateImagePictureTaskTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<DelegateImagePictureTaskInput, DelegateImagePictureTaskResult> {
  return {
    description:
      'Delegate a simple image, logo, picture, screenshot, sticker, or still-image overlay task to a specialist subagent.',
    inputSchema: z
      .object({
        task: z
          .string()
          .trim()
          .min(1)
          .max(700)
          .describe(
            'Short instruction for the image specialist. Example: "Place asset logo-1 in the top-right for the whole clip."',
          ),
        projectId: z.string().trim().min(1),
        targetItemIds: z.array(z.string().trim().min(1)).optional(),
        targetAssetIds: z.array(z.string().trim().min(1)).optional(),
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
      input: DelegateImagePictureTaskInput,
      { abortSignal, toolCallId }: { abortSignal?: AbortSignal; toolCallId?: string },
    ) => {
      const modelId = context?.modelId;
      if (!modelId) {
        return defaultDelegateResult(
          'Image specialist could not start.',
          'No model configuration was provided.',
        );
      }

      deps.logger?.debug('Starting image picture subagent.', { projectId: input.projectId });
      const agent = new ToolLoopAgent({
        model: deps.getLanguageModel(modelId),
        instructions: buildImageSpecialistPrompt({ input }),
        tools: createImageSpecialistTools(deps, context),
        stopWhen: stepCountIs(8),
        providerOptions: buildProviderOptions(modelId, context?.mode),
        headers: getModelHeaders(modelId),
      });

      const debugReporter = createSubagentDebugReporter({
        context,
        subagentName: 'image-picture-specialist',
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
        const output = parseDelegateResult(result.text);
        debugReporter.completed({ finalText: result.text, output });
        deps.logger?.log('Image picture subagent completed.');
        return output;
      } catch (error) {
        debugReporter.error(error);
        throw error;
      }
    },
    toModelOutput: ({ output }: { output: DelegateImagePictureTaskResult }) =>
      buildImageDelegateModelOutput(output),
  } as unknown as Tool<DelegateImagePictureTaskInput, DelegateImagePictureTaskResult>;
}

export function createAddImageItemsTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<AddImageItemsInput, AddImageItemsResult> {
  return {
    description:
      'Place existing ready image library assets on the timeline. Rejects video, audio, caption, and GIF assets.',
    inputSchema: z.object({
      items: z.array(imageItemInputSchema).nonempty('Provide at least one image placement request'),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async ({ items, reason }: AddImageItemsInput, { toolCallId }: { toolCallId?: string }) => {
      const resolvedToolCallId = toolCallId ?? `add-image-items-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(resolvedToolCallId);
      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: {
          tool_name: editorToolNames.addImageItems,
          params: { items },
          toolCallId: resolvedToolCallId,
          messageId: context?.messageId,
          requestedAt: new Date().toISOString(),
        } satisfies EditorAddImageItemsPayload,
        timestamp: new Date().toISOString(),
      });
      const result = await waitForResult;
      if ('status' in result && result.status === 'timeout') {
        return {
          status: 'timeout',
          requestedAssetIds: items.map((item) => item.assetId),
          note: 'No response received from editor.',
        };
      }
      const mappedStatus = mapToolResultStatus(result.status, {
        success: 'completed' as const,
        skipped: 'skipped' as const,
        error: 'error' as const,
      });
      const rawProjectState = result.output?.projectState as Record<string, unknown> | undefined;
      return {
        status: mappedStatus,
        requestedAssetIds: items.map((item) => item.assetId),
        createdItems: result.output?.createdItems as AddImageItemsResult['createdItems'],
        skippedAssetIds: result.output?.skippedAssetIds as string[] | undefined,
        note: reason ?? (mappedStatus === 'completed' ? 'Image item(s) added.' : undefined),
        error: mappedStatus === 'error' ? extractErrorDetail(result) : undefined,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<AddImageItemsInput, AddImageItemsResult>;
}

export function createUpdateImageItemsTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<UpdateImageItemsInput, UpdateImageItemsResult> {
  return {
    description:
      'Update existing image overlay items without recreating them. Supports timing, placement, dimensions, opacity, rotation, radius, aspect ratio, fades, objectFit, and asset replacement.',
    inputSchema: z.object({
      itemIds: z.array(z.string().trim().min(1)).nonempty('Provide at least one image item ID'),
      patch: imagePatchSchema,
      selectionBehavior: z.enum(['select_updated', 'keep_current', 'none']).optional(),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async (
      { itemIds, patch, selectionBehavior, reason }: UpdateImageItemsInput,
      { toolCallId }: { toolCallId?: string },
    ) => {
      const validation = validateImageUpdateRequest({ itemIds, patch, projectState: context?.projectState });
      if (validation.assetError) {
        return {
          status: 'error',
          requestedItemIds: itemIds,
          itemErrors: validation.itemErrors,
          error: validation.assetError,
          note: validation.assetError,
        };
      }
      if (validation.validItemIds.length === 0) {
        return {
          status: 'error',
          requestedItemIds: itemIds,
          itemErrors: validation.itemErrors,
          error: 'No valid image items to update.',
          note: 'No valid image items to update.',
        };
      }
      const resolvedToolCallId = toolCallId ?? `update-image-items-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(resolvedToolCallId);
      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: {
          tool_name: editorToolNames.updateImageItems,
          params: { itemIds: validation.validItemIds, patch, selectionBehavior },
          toolCallId: resolvedToolCallId,
          messageId: context?.messageId,
          requestedAt: new Date().toISOString(),
        } satisfies EditorUpdateImageItemsPayload,
        timestamp: new Date().toISOString(),
      });
      const result = await waitForResult;
      if ('status' in result && result.status === 'timeout') {
        return {
          status: 'timeout',
          requestedItemIds: itemIds,
          itemErrors: validation.itemErrors,
          note: 'No response received from editor.',
        };
      }
      const mappedStatus = mapToolResultStatus(result.status, {
        success: 'completed' as const,
        skipped: 'skipped' as const,
        error: 'error' as const,
      });
      const rawProjectState = result.output?.projectState as Record<string, unknown> | undefined;
      const clientItemErrors = (result.output?.itemErrors as UpdateImageItemsResult['itemErrors']) ?? [];
      return {
        status: mappedStatus,
        requestedItemIds: itemIds,
        updatedItemIds: result.output?.updatedItemIds as string[] | undefined,
        selectedItemIds: result.output?.selectedItemIds as string[] | undefined,
        usedAssetIds: result.output?.usedAssetIds as string[] | undefined,
        itemErrors: [...validation.itemErrors, ...clientItemErrors],
        note: reason ?? (mappedStatus === 'completed' ? 'Image item(s) updated.' : undefined),
        error: mappedStatus === 'error' ? extractErrorDetail(result) : undefined,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<UpdateImageItemsInput, UpdateImageItemsResult>;
}
