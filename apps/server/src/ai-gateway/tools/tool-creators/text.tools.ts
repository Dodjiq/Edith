import {
  editorToolNames,
  realtimeMessageTypes,
  type EditorAddTextItemsPayload,
  type EditorUpdateTextItemsPayload,
} from 'api-types';
import { stepCountIs, Tool, ToolLoopAgent } from 'ai';
import { z } from 'zod';
import { buildProviderOptions, getModelHeaders } from '../../models-config';
import { buildTextSpecialistPrompt } from '../../../prompts/subagents/text-overlay.prompts';
import { createGetItemsDataTool, createGetProjectStateTool } from './query.tools';
import { createSubagentDebugReporter } from './subagent-debug';
import { extractErrorDetail, mapToolResultStatus, stripUrlsFromProjectState } from './utils';
import type {
  AddTextItemsInput,
  AddTextItemsResult,
  DelegateTextOverlayTaskInput,
  DelegateTextOverlayTaskResult,
  ToolDependencies,
  ToolsContext,
  UpdateTextItemsInput,
  UpdateTextItemsResult,
} from './types';

const textItemStyleSchema = z.object({
  left: z.number().optional(),
  top: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  opacity: z.number().optional(),
  rotation: z.number().optional(),
  fontFamily: z.string().optional(),
  fontStyle: z.object({ variant: z.string().optional(), weight: z.string().optional() }).optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  fontSize: z.number().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  color: z.string().optional(),
  direction: z.enum(['ltr', 'rtl']).optional(),
  strokeWidth: z.number().optional(),
  strokeColor: z.string().optional(),
  fadeInDurationInSeconds: z.number().optional(),
  fadeOutDurationInSeconds: z.number().optional(),
});

const textItemSchema = z.object({
  text: z.string().trim().min(1, 'Text is required'),
  startFrame: z.number().int().min(0).optional(),
  startTimeInSeconds: z.number().min(0).optional(),
  durationInFrames: z.number().int().min(1).optional(),
  durationInSeconds: z.number().min(0).optional(),
  xOnCanvas: z.number().optional(),
  yOnCanvas: z.number().optional(),
  style: textItemStyleSchema.optional(),
});

const textPatchSchema = textItemStyleSchema.extend({
  text: z.string().optional(),
  from: z.number().int().min(0).optional(),
  durationInFrames: z.number().int().min(1).optional(),
  startTimeInSeconds: z.number().min(0).optional(),
  durationInSeconds: z.number().min(0).optional(),
  xOnCanvas: z.number().optional(),
  yOnCanvas: z.number().optional(),
});

const delegateResultSchema = z.object({
  status: z.enum(['success', 'partial_success', 'needs_clarification', 'error', 'completed']),
  createdItemIds: z.array(z.string()).default([]),
  updatedItemIds: z.array(z.string()).default([]),
  deletedItemIds: z.array(z.string()).default([]),
  selectedItemIds: z.array(z.string()).default([]),
  summary: z.string().trim().min(1).max(500),
  unresolvedIssue: z.string().trim().max(300).nullable().optional(),
});

const hasConflictingTiming = ({ frame, seconds, fps }: { frame?: number; seconds?: number; fps: number }) => {
  if (frame === undefined || seconds === undefined) return false;
  return Math.abs(Math.round(seconds * fps) - frame) > 1;
};

const defaultDelegateResult = (summary: string, unresolvedIssue?: string): DelegateTextOverlayTaskResult => ({
  status: unresolvedIssue ? 'error' : 'needs_clarification',
  createdItemIds: [],
  updatedItemIds: [],
  deletedItemIds: [],
  selectedItemIds: [],
  summary,
  unresolvedIssue,
});

export const parseDelegateResult = (text: string): DelegateTextOverlayTaskResult => {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```$/u, '')
    .trim();
  try {
    const parsed = delegateResultSchema.safeParse(JSON.parse(cleaned));
    if (parsed.success) {
      const { status, unresolvedIssue, ...rest } = parsed.data;
      return {
        ...rest,
        status: status === 'completed' ? 'success' : status,
        unresolvedIssue: unresolvedIssue ?? undefined,
      };
    }
  } catch {
    // Fall through to a compact error that the parent agent can use.
  }
  return defaultDelegateResult(
    cleaned || 'The text specialist did not return a structured result.',
    'Invalid specialist output.',
  );
};

const buildModelOutput = (output: DelegateTextOverlayTaskResult) => ({
  type: 'text' as const,
  value: JSON.stringify(output),
});

const createTextSpecialistTools = (deps: ToolDependencies, context?: ToolsContext): Record<string, Tool> => ({
  [editorToolNames.getProjectState]: createGetProjectStateTool(deps, context),
  [editorToolNames.getItemsData]: createGetItemsDataTool(deps, context),
  [editorToolNames.addTextItems]: createAddTextItemsTool(deps, context),
  [editorToolNames.updateTextItems]: createUpdateTextItemsTool(deps, context),
});

export function createDelegateTextOverlayTaskTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<DelegateTextOverlayTaskInput, DelegateTextOverlayTaskResult> {
  return {
    description:
      'Delegate a simple static text overlay task to a specialist subagent. Use for labels, titles, lower thirds, language tags, and callouts. Do not use for spoken captions/subtitles.',
    inputSchema: z
      .object({
        task: z
          .string()
          .trim()
          .min(1)
          .max(700)
          .describe(
            'Short instruction for the text specialist. Example: "Add a centered title saying Product Demo for 5 seconds."',
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
      input: DelegateTextOverlayTaskInput,
      { abortSignal, toolCallId }: { abortSignal?: AbortSignal; toolCallId?: string },
    ) => {
      const modelId = context?.modelId;
      if (!modelId) {
        return defaultDelegateResult(
          'Text overlay specialist could not start.',
          'No model configuration was provided.',
        );
      }

      deps.logger?.debug('Starting text overlay subagent.', { projectId: input.projectId });
      const agent = new ToolLoopAgent({
        model: deps.getLanguageModel(modelId),
        instructions: buildTextSpecialistPrompt({ input }),
        tools: createTextSpecialistTools(deps, context),
        stopWhen: stepCountIs(8),
        providerOptions: buildProviderOptions(modelId, context?.mode),
        headers: getModelHeaders(modelId),
      });

      const debugReporter = createSubagentDebugReporter({
        context,
        subagentName: 'text-overlay-specialist',
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
        deps.logger?.log('Text overlay subagent completed.');
        return output;
      } catch (error) {
        debugReporter.error(error);
        throw error;
      }
    },
    toModelOutput: ({ output }: { output: DelegateTextOverlayTaskResult }) => buildModelOutput(output),
  } as unknown as Tool<DelegateTextOverlayTaskInput, DelegateTextOverlayTaskResult>;
}

export function createAddTextItemsTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<AddTextItemsInput, AddTextItemsResult> {
  return {
    description:
      'Create one or more static text overlays. Use this only inside the text overlay specialist, not for spoken captions.',
    inputSchema: z.object({
      items: z.array(textItemSchema).nonempty('Provide at least one text item'),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async ({ items, reason }: AddTextItemsInput, { toolCallId }: { toolCallId?: string }) => {
      const fps = context?.projectState?.fpsInfo ?? 30;
      const normalizedItems = items
        .map((item) => ({ ...item, text: item.text.trim() }))
        .filter((item) => item.text.length > 0);
      const hasTimingConflict = normalizedItems.some(
        (item) =>
          hasConflictingTiming({ frame: item.startFrame, seconds: item.startTimeInSeconds, fps }) ||
          hasConflictingTiming({ frame: item.durationInFrames, seconds: item.durationInSeconds, fps }),
      );

      if (normalizedItems.length === 0) {
        return { status: 'skipped', requestedCount: 0, note: 'No valid text items provided.' };
      }
      if (hasTimingConflict) {
        return {
          status: 'error',
          requestedCount: normalizedItems.length,
          note: 'Conflicting frame and seconds timing values were provided.',
        };
      }

      const resolvedToolCallId = toolCallId ?? `add-text-items-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(resolvedToolCallId);
      const params: EditorAddTextItemsPayload['params'] = { items: normalizedItems };

      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: {
          tool_name: editorToolNames.addTextItems,
          params,
          toolCallId: resolvedToolCallId,
          messageId: context?.messageId,
          requestedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      const result = await waitForResult;
      if ('status' in result && result.status === 'timeout') {
        return {
          status: 'timeout',
          requestedCount: normalizedItems.length,
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
        requestedCount: normalizedItems.length,
        createdItems: result.output?.createdItems as AddTextItemsResult['createdItems'],
        note:
          reason ??
          (mappedStatus === 'completed' ? `Added ${normalizedItems.length} text item(s).` : undefined),
        error: mappedStatus === 'error' ? extractErrorDetail(result) : undefined,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<AddTextItemsInput, AddTextItemsResult>;
}

export function createUpdateTextItemsTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<UpdateTextItemsInput, UpdateTextItemsResult> {
  return {
    description:
      'Update existing static text overlays without recreating them. Supports content, timing, placement, dimensions, opacity, rotation, typography, stroke, direction, and fades.',
    inputSchema: z.object({
      itemIds: z.array(z.string().trim().min(1)).nonempty('Provide at least one text item ID'),
      patch: textPatchSchema,
      selectionBehavior: z.enum(['select_updated', 'keep_current', 'none']).optional(),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async (
      { itemIds, patch, selectionBehavior, reason }: UpdateTextItemsInput,
      { toolCallId }: { toolCallId?: string },
    ) => {
      const fps = context?.projectState?.fpsInfo ?? 30;
      if (
        hasConflictingTiming({ frame: patch.from, seconds: patch.startTimeInSeconds, fps }) ||
        hasConflictingTiming({ frame: patch.durationInFrames, seconds: patch.durationInSeconds, fps })
      ) {
        return {
          status: 'error',
          requestedItemIds: itemIds,
          note: 'Conflicting frame and seconds timing values were provided.',
        };
      }

      const resolvedToolCallId = toolCallId ?? `update-text-items-${Date.now()}`;
      const waitForResult = deps.waitForToolResult(resolvedToolCallId);
      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.editor,
        payload: {
          tool_name: editorToolNames.updateTextItems,
          params: { itemIds, patch, selectionBehavior },
          toolCallId: resolvedToolCallId,
          messageId: context?.messageId,
          requestedAt: new Date().toISOString(),
        } satisfies EditorUpdateTextItemsPayload,
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
        updatedItems: result.output?.updatedItems as UpdateTextItemsResult['updatedItems'],
        updatedItemIds: result.output?.updatedItemIds as string[] | undefined,
        selectedItemIds: result.output?.selectedItemIds as string[] | undefined,
        failedItems: result.output?.failedItems as UpdateTextItemsResult['failedItems'],
        note: reason ?? (mappedStatus === 'completed' ? 'Text item(s) updated.' : undefined),
        error: mappedStatus === 'error' ? extractErrorDetail(result) : undefined,
        projectState: rawProjectState ? stripUrlsFromProjectState(rawProjectState) : undefined,
      };
    },
  } as unknown as Tool<UpdateTextItemsInput, UpdateTextItemsResult>;
}
