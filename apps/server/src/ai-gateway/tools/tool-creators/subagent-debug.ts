import type { ChatStreamSubagentDebugEvent } from 'api-types';
import type { ToolsContext } from './types';

type UnknownRecord = Record<string, unknown>;

type StepFinishDebugData = {
  stepNumber?: number;
  reasoning?: readonly unknown[];
  reasoningText?: string;
  toolCalls?: readonly unknown[];
  toolResults?: readonly unknown[];
};

type SubagentDebugReporterOptions = {
  context?: ToolsContext;
  subagentName: string;
  parentToolCallId?: string;
  modelId?: string;
};

const asRecord = (value: unknown): UnknownRecord | undefined =>
  typeof value === 'object' && value !== null ? (value as UnknownRecord) : undefined;

const getStringProperty = (value: unknown, keys: string[]): string | undefined => {
  const record = asRecord(value);
  if (!record) return undefined;

  for (const key of keys) {
    const property = record[key];
    if (typeof property === 'string' && property.trim().length > 0) {
      return property;
    }
  }

  return undefined;
};

const getProperty = (value: unknown, keys: string[]): unknown => {
  const record = asRecord(value);
  if (!record) return undefined;

  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
};

const getReasoningText = (step: StepFinishDebugData): string | undefined => {
  if (step.reasoningText?.trim()) {
    return step.reasoningText;
  }

  const text = (step.reasoning ?? [])
    .map((part) => getStringProperty(part, ['text', 'content']))
    .filter((part): part is string => Boolean(part?.trim()))
    .join('\n');

  return text.trim() || undefined;
};

export const createSubagentDebugReporter = ({
  context,
  subagentName,
  parentToolCallId,
  modelId,
}: SubagentDebugReporterOptions) => {
  const emit = (
    event: Omit<ChatStreamSubagentDebugEvent, 'subagentName' | 'parentToolCallId' | 'modelId' | 'createdAt'>,
  ) => {
    const debugEvent: ChatStreamSubagentDebugEvent = {
      subagentName,
      ...event,
      createdAt: new Date().toISOString(),
    };

    if (parentToolCallId) {
      debugEvent.parentToolCallId = parentToolCallId;
    }
    if (modelId) {
      debugEvent.modelId = modelId;
    }

    context?.reportSubagentDebugEvent?.(debugEvent);
  };

  return {
    started: (input: unknown) => emit({ type: 'started', input }),
    completed: ({ finalText, output }: { finalText?: string; output?: unknown }) =>
      emit({ type: 'completed', finalText, output }),
    error: (error: unknown) =>
      emit({ type: 'error', error: error instanceof Error ? error.message : 'Subagent failed.' }),
    onStepFinish: (step: StepFinishDebugData) => {
      const reasoning = getReasoningText(step);

      if (reasoning) {
        emit({ type: 'reasoning', stepNumber: step.stepNumber, reasoning });
      }

      for (const toolCall of step.toolCalls ?? []) {
        emit({
          type: 'tool-call',
          stepNumber: step.stepNumber,
          toolCallId: getStringProperty(toolCall, ['toolCallId', 'id']),
          toolName: getStringProperty(toolCall, ['toolName', 'name']),
          input: getProperty(toolCall, ['input', 'args']),
        });
      }

      for (const toolResult of step.toolResults ?? []) {
        emit({
          type: 'tool-result',
          stepNumber: step.stepNumber,
          toolCallId: getStringProperty(toolResult, ['toolCallId', 'id']),
          toolName: getStringProperty(toolResult, ['toolName', 'name']),
          input: getProperty(toolResult, ['input', 'args']),
          output: getProperty(toolResult, ['output', 'result']),
        });
      }
    },
  };
};
