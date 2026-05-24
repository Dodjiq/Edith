import { editorToolNames } from 'api-types';
import { stepCountIs, Tool, ToolLoopAgent } from 'ai';
import { z } from 'zod';
import { aiGatewayToolNames } from '../../tool-names';
import { buildProviderOptions, getModelHeaders } from '../../models-config';
import {
  buildInvestigationPrompt,
  buildInvestigationSystemPrompt,
} from '../../../prompts/subagents/transcription-investigation.prompts';
import { createFindRepetitionCandidatesTool, repetitionCandidateToolName } from './repetition-candidate.tools';
import { createGetDetailedTranscriptionTool, createGetItemsDataTool, createGetProjectStateTool } from './query.tools';
import { createSubagentDebugReporter } from './subagent-debug';
import type {
  InvestigateTranscriptionInput,
  InvestigateTranscriptionResult,
  ToolDependencies,
  ToolsContext,
} from './types';

const primaryModelId = 'google/gemini-3-flash';
const fallbackModelId = 'google/gemini-3.1-flash-lite-preview';

const investigationAgentOutputSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
  findings: z.array(z.object({
    label: z.string().trim().min(1).max(80).optional(),
    startTimeInSeconds: z.number().min(0).optional(),
    endTimeInSeconds: z.number().min(0).optional(),
    confidence: z.number().min(0).max(1).optional(),
    reason: z.string().trim().min(1).max(300).optional(),
  })).max(60).default([]),
});

type InvestigationAgentOutput = z.infer<typeof investigationAgentOutputSchema>;

const investigationCutRangeOutputSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
  findings: z.array(z.object({
    label: z.string().trim().min(1).max(80),
    startTimeInSeconds: z.number().min(0),
    endTimeInSeconds: z.number().min(0),
    confidence: z.number().min(0).max(1),
    reason: z.string().trim().min(1).max(300),
  })).max(60).default([]),
});

function requiresExactCutRanges(prompt: string, videoContext?: string) {
  const combined = `${prompt}\n${videoContext ?? ''}`.toLowerCase();
  return ['cut', 'remove', 'delete', 'timeline', 'editor-ready', 'bad take', 'false start'].some((keyword) =>
    combined.includes(keyword),
  );
}

function buildInvestigationGeminiProviderOptions(modelId: string) {
  return {
    ...buildProviderOptions(modelId),
    google: {
      thinkingConfig: {
        thinkingLevel: modelId === primaryModelId ? 'high' as const : 'low' as const,
        includeThoughts: true,
      },
    },
  };
}

function parseInvestigationAgentOutput(text: string, requiresCutRanges: boolean): InvestigationAgentOutput {
  const normalizedText = text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  const schema = requiresCutRanges ? investigationCutRangeOutputSchema : investigationAgentOutputSchema;

  if (!normalizedText) {
    return {
      answer: 'The transcription investigation completed without a structured summary.',
      findings: [],
    };
  }

  try {
    const parsed = JSON.parse(normalizedText);
    const result = schema.safeParse(parsed);

    if (result.success) {
      return result.data;
    }
  } catch {
    // Fall back to the raw text response if the model does not return valid JSON.
  }

  return {
    answer: normalizedText,
    findings: [],
  };
}

function buildInvestigationModelOutput(output: InvestigateTranscriptionResult) {
  if (output.status !== 'completed') {
    return {
      type: 'text' as const,
      value: output.note ?? output.error ?? 'Transcription investigation failed.',
    };
  }

  return {
    type: 'text' as const,
    value: JSON.stringify({
      answer: output.answer,
      findings: output.findings ?? [],
    }),
  };
}

async function runInvestigationAgent({
  deps,
  context,
  prompt,
  itemIds,
  minutes,
  videoContext,
  modelId,
  abortSignal,
  parentToolCallId,
}: {
  deps: ToolDependencies;
  context?: ToolsContext;
  prompt: string;
  itemIds?: string[];
  minutes?: number[];
  videoContext?: string;
  modelId: string;
  abortSignal?: AbortSignal;
  parentToolCallId?: string;
}): Promise<InvestigationAgentOutput> {
  const needsCutRanges = requiresExactCutRanges(prompt, videoContext);
  const investigationTools: Record<string, Tool> = {
    [editorToolNames.getDetailedTranscription]: createGetDetailedTranscriptionTool(deps, context),
    [repetitionCandidateToolName]: createFindRepetitionCandidatesTool(deps, context),
    [editorToolNames.getProjectState]: createGetProjectStateTool(deps, context),
    [editorToolNames.getItemsData]: createGetItemsDataTool(deps, context),
  };

  const agent = new ToolLoopAgent({
    model: deps.getLanguageModel(modelId),
    instructions: buildInvestigationSystemPrompt({
      projectState: context?.projectState,
      itemIds,
      minutes,
      videoContext,
      requiresCutRanges: needsCutRanges,
      cutToolName: aiGatewayToolNames.cutTimeRanges,
      repetitionToolName: repetitionCandidateToolName,
    }),
    tools: investigationTools,
    stopWhen: stepCountIs(10),
    providerOptions: buildInvestigationGeminiProviderOptions(modelId),
    headers: getModelHeaders(modelId),
  });

  const debugReporter = createSubagentDebugReporter({
    context,
    subagentName: 'transcription-investigation-specialist',
    parentToolCallId,
    modelId,
  });

  debugReporter.started({ prompt, itemIds, minutes, videoContext });

  try {
    const result = await agent.generate({
      prompt: buildInvestigationPrompt({ prompt, itemIds, minutes, requiresCutRanges: needsCutRanges }),
      abortSignal,
      onStepFinish: debugReporter.onStepFinish,
    });
    const output = parseInvestigationAgentOutput(result.text, needsCutRanges);

    debugReporter.completed({ finalText: result.text, output });
    return output;
  } catch (error) {
    debugReporter.error(error);
    throw error;
  }
}

export function createInvestigateTranscriptionTool(
  deps: ToolDependencies,
  context?: ToolsContext,
): Tool<InvestigateTranscriptionInput, InvestigateTranscriptionResult> {
  const description = [
    'Set up a Gemini 3 Flash transcription subagent for transcript-heavy investigations.',
    'Use this when you need the transcript analyzed',
    'Great for bad takes, repeated attempts, quote search, topic detection, or locating moments in speech.',
    'Provide a focused prompt for the subagent. Optionally if user asks scope it to itemIds or minute ranges.',
    'The subagent can only inspect 10 minutes of detailed transcription per call, so it must split longer videos into multiple calls.',
    'Be specific about what you need from the subagent.',
    'Ask explicitly for the exact output you need, such as timestamps, snippets, quotes, reasons, confidence, or uncertainty.',
    `When the main agent needs editor-ready cuts, return exact timestamps that can feed ${aiGatewayToolNames.cutTimeRanges}.`,
    'Returns a compact summary plus structured timestamp findings for the main agent.',
  ].join(' ');

  return {
    description,
    inputSchema: z.object({
      prompt: z.string()
        .trim()
        .min(1)
        .max(1200)
        .describe('State exactly what you need from the subagent. Be specific about the expected output, such as timestamps, snippets, quotes, reasons, confidence, or uncertainty.'),
      itemIds: z.array(z.string().trim().min(1)).optional(),
      minutes: z.array(z.number().int().min(1)).optional(),
      videoContext: z.string().trim().max(2000).optional(),
      reason: z.string().trim().max(200).optional(),
    }),
    execute: async function* (
      { prompt, itemIds, minutes, videoContext, reason }: InvestigateTranscriptionInput,
      { abortSignal, toolCallId }: { abortSignal?: AbortSignal; toolCallId?: string },
    ) {
      const normalizedItemIds = itemIds?.length
        ? Array.from(new Set(itemIds.map((itemId) => itemId.trim()).filter((itemId) => itemId.length > 0)))
        : undefined;
      const normalizedMinutes = minutes?.length
        ? Array.from(new Set(minutes.filter((minute) => minute >= 1))).sort((a, b) => a - b)
        : undefined;

      deps.logger?.debug('Starting transcription investigation subagent.', {
        itemCount: normalizedItemIds?.length ?? 0,
        minuteCount: normalizedMinutes?.length ?? 0,
      });

      yield {
        status: 'running',
        note: 'Setting up transcription subagent.',
        targetItemIds: normalizedItemIds,
        minutes: normalizedMinutes,
      };

      try {
        const primaryOutput = await runInvestigationAgent({
          deps,
          context,
          prompt,
          itemIds: normalizedItemIds,
          minutes: normalizedMinutes,
          videoContext,
          modelId: primaryModelId,
          abortSignal,
          parentToolCallId: toolCallId,
        });

        const result: InvestigateTranscriptionResult = {
          status: 'completed',
          answer: primaryOutput.answer,
          findings: primaryOutput.findings,
          targetItemIds: normalizedItemIds,
          minutes: normalizedMinutes,
          modelId: primaryModelId,
          fallbackUsed: false,
          note: reason ?? 'Transcription investigation completed successfully.',
        };

        deps.logger?.log('Transcription investigation completed successfully.');
        yield result;
        return;
      } catch (primaryError) {
        deps.logger?.warn('Primary transcription investigation model failed. Retrying with fallback.', primaryError);
      }

      try {
        yield {
          status: 'running',
          note: 'Primary transcription subagent failed. Retrying with fallback model.',
          targetItemIds: normalizedItemIds,
          minutes: normalizedMinutes,
        };

        const fallbackOutput = await runInvestigationAgent({
          deps,
          context,
          prompt,
          itemIds: normalizedItemIds,
          minutes: normalizedMinutes,
          videoContext,
          modelId: fallbackModelId,
          abortSignal,
          parentToolCallId: toolCallId,
        });

        const result: InvestigateTranscriptionResult = {
          status: 'completed',
          answer: fallbackOutput.answer,
          findings: fallbackOutput.findings,
          targetItemIds: normalizedItemIds,
          minutes: normalizedMinutes,
          modelId: fallbackModelId,
          fallbackUsed: true,
          note: reason ?? 'Transcription investigation completed with the fallback model.',
        };

        deps.logger?.log('Transcription investigation completed with the fallback model.');
        yield result;
        return;
      } catch (fallbackError) {
        deps.logger?.warn('Fallback transcription investigation model failed.', fallbackError);
        yield {
          status: 'error',
          targetItemIds: normalizedItemIds,
          minutes: normalizedMinutes,
          note: 'Failed to investigate the transcription.',
          error: fallbackError instanceof Error ? fallbackError.message : 'Failed to investigate the transcription.',
        };
        return;
      }
    },
    toModelOutput: ({ output }: { output: InvestigateTranscriptionResult }) => buildInvestigationModelOutput(output),
  } as unknown as Tool<InvestigateTranscriptionInput, InvestigateTranscriptionResult>;
}
