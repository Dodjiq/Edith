import { convertToModelMessages, Tool, UIMessage } from 'ai';
import { DigestProjectStateRequest, SendMessagePart, SendMessageRequest, SendMessageRequestArray } from 'api-types';

type ConversationUIMessage = UIMessage<SendMessageRequest['metadata']>;
type ConversationUIMessagePart = ConversationUIMessage['parts'][number];
type ConversationStaticToolPart = Extract<ConversationUIMessagePart, { type: `tool-${string}` }>;
type SendMessageTextPart = Extract<SendMessagePart, { type: 'text' }>;
type SendMessageReasoningPart = Extract<SendMessagePart, { type: 'reasoning' }>;
type SendMessageStepStartPart = Extract<SendMessagePart, { type: 'step-start' }>;
type SendMessageToolPart = Extract<SendMessagePart, { toolCallId: string }>;

const isTextPart = (part: SendMessagePart): part is SendMessageTextPart => part.type === 'text';
const isReasoningPart = (part: SendMessagePart): part is SendMessageReasoningPart => part.type === 'reasoning';
const isStepStartPart = (part: SendMessagePart): part is SendMessageStepStartPart => part.type === 'step-start';
const isToolPart = (part: SendMessagePart): part is SendMessageToolPart => {
  return 'toolCallId' in part && typeof part.type === 'string' && part.type.startsWith('tool-');
};

const stringifyValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const toUiMessagePart = (part: SendMessagePart): ConversationUIMessagePart | null => {
  if (isTextPart(part)) {
    return {
      type: 'text',
      text: part.text,
      state: part.state,
    };
  }

  if (isReasoningPart(part)) {
    return {
      type: 'reasoning',
      text: part.text,
      state: part.state,
    };
  }

  if (isStepStartPart(part)) {
    return {
      type: 'step-start',
    };
  }

  if (!isToolPart(part)) {
    return null;
  }

  const toolType = part.type as ConversationStaticToolPart['type'];

  if (part.state === 'input-streaming') {
    return {
      type: toolType,
      toolCallId: part.toolCallId,
      state: 'input-streaming',
      input: part.input,
      providerExecuted: part.providerExecuted,
      title: part.title,
    };
  }

  if (part.state === 'output-available' && part.output !== undefined) {
    if (part.preliminary) {
      return {
        type: toolType,
        toolCallId: part.toolCallId,
        state: 'input-available',
        input: part.input ?? {},
        providerExecuted: part.providerExecuted,
        title: part.title,
      };
    }

    return {
      type: toolType,
      toolCallId: part.toolCallId,
      state: 'output-available',
      input: part.input ?? {},
      output: part.output,
      providerExecuted: part.providerExecuted,
      title: part.title,
      preliminary: part.preliminary,
    };
  }

  if (part.state === 'output-error' || part.state === 'output-denied') {
    return {
      type: toolType,
      toolCallId: part.toolCallId,
      state: 'output-error',
      input: part.input ?? {},
      errorText: part.errorText ?? 'Tool execution failed',
      providerExecuted: part.providerExecuted,
      title: part.title,
    };
  }

  return {
    type: toolType,
    toolCallId: part.toolCallId,
    state: 'input-available',
    input: part.input ?? {},
    providerExecuted: part.providerExecuted,
    title: part.title,
  };
};

const toUiMessage = (message: SendMessageRequest): ConversationUIMessage => ({
  id: message.id,
  role: message.role,
  metadata: message.metadata,
  parts: message.parts
    .map((part) => toUiMessagePart(part))
    .filter((part): part is ConversationUIMessagePart => part !== null),
});

const getToolNameFromType = (type: string) => type.replace(/^tool-/, '');

const getMessageIndex = (message: SendMessageRequest, fallbackIndex: number) => {
  return message.metadata?.messageIndex ?? fallbackIndex;
};

export const sortConversationMessages = (messages: SendMessageRequestArray): SendMessageRequestArray => {
  return [...messages]
    .map((message, index) => ({ index, message }))
    .sort((a, b) => getMessageIndex(a.message, a.index) - getMessageIndex(b.message, b.index))
    .map(({ message }) => message);
};

export const getLatestConversationMessage = (messages: SendMessageRequestArray): SendMessageRequest | undefined => {
  const sortedMessages = sortConversationMessages(messages);
  return sortedMessages[sortedMessages.length - 1];
};

export const getMessageText = (message?: SendMessageRequest): string => {
  if (!message) {
    return '';
  }

  return message.parts
    .filter((part): part is SendMessageTextPart => isTextPart(part))
    .map((part) => part.text)
    .join('\n\n')
    .trim();
};

export const getMessageProjectState = (message?: SendMessageRequest): DigestProjectStateRequest | undefined => {
  return message?.metadata?.projectStateWhenSendingMessage;
};

export const getMessageMode = (message?: SendMessageRequest) => {
  return message?.metadata?.mode;
};

export const serializeConversationMessage = (message: SendMessageRequest): string => {
  const lines: string[] = [];

  for (const part of message.parts) {
    if (isTextPart(part)) {
      lines.push(part.text);
      continue;
    }

    if (isReasoningPart(part)) {
      if (part.text.trim()) {
        lines.push(`Reasoning:\n${part.text}`);
      }
      continue;
    }

    if (isStepStartPart(part)) {
      continue;
    }

    if (isToolPart(part)) {
      const toolName = getToolNameFromType(part.type);
      lines.push(`Tool: ${toolName} (${part.state})`);

      if (part.input !== undefined) {
        lines.push(`Input:\n${stringifyValue(part.input)}`);
      }

      if (part.output !== undefined) {
        lines.push(`Output:\n${stringifyValue(part.output)}`);
      }

      if (part.errorText) {
        lines.push(`Error:\n${part.errorText}`);
      }
    }
  }

  return lines.join('\n\n').trim();
};

export const convertConversationToModelMessages = async ({
  messages,
  tools,
}: {
  messages: SendMessageRequestArray;
  tools: Record<string, Tool>;
}) => {
  const uiMessages = sortConversationMessages(messages).map((message) => toUiMessage(message));

  return convertToModelMessages(
    uiMessages.map(({ id: _id, ...message }) => message),
    {
      tools,
      ignoreIncompleteToolCalls: true,
    },
  );
};
