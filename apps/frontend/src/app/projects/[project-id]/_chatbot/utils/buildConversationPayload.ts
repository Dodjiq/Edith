import { chatModeModelIds, chatModeModelSequences } from 'api-types';
import type { ChatMode, SendMessagePart, SendMessageRequest, SendMessageRequestArray } from 'api-types';
import type { ChatMessage, ChatMessagePart, ChatToolPart } from '../types/chatbot';

type SendMessageToolPart = Extract<SendMessagePart, { toolCallId: string }>;

const toSendMessageToolState = (part: ChatToolPart): SendMessageToolPart['state'] => {
  if (part.state === 'output-denied') {
    return 'output-error';
  }

  if (part.state === 'approval-requested' || part.state === 'approval-responded') {
    return 'input-available';
  }

  return part.state;
};

const toSendMessagePart = (part: ChatMessagePart): SendMessagePart | null => {
  switch (part.type) {
    case 'text': {
      if (!part.text.trim()) {
        return null;
      }

      return {
        type: 'text',
        text: part.text,
        state: 'done',
      };
    }
    case 'reasoning': {
      if (!part.text.trim()) {
        return null;
      }

      return {
        type: 'reasoning',
        text: part.text,
        state: part.state === 'complete' ? 'done' : 'streaming',
      };
    }
    case 'tool': {
      const normalizedState = toSendMessageToolState(part);
      const shouldStripPreliminaryOutput = part.preliminary === true && normalizedState === 'output-available';

      return {
        type: `tool-${part.name}`,
        toolCallId: part.toolCallId,
        state: shouldStripPreliminaryOutput ? 'input-available' : normalizedState,
        input: part.input,
        output: normalizedState === 'output-available' && !shouldStripPreliminaryOutput ? part.output : undefined,
        errorText:
          normalizedState === 'output-error'
            ? (part.errorText ?? (part.state === 'output-denied' ? 'Tool execution denied' : undefined))
            : undefined,
        title: part.title,
        providerExecuted: part.providerExecuted,
        preliminary: shouldStripPreliminaryOutput ? undefined : part.preliminary,
      };
    }
    default:
      return null;
  }
};

const isToolPart = (part: SendMessagePart) => part.type.startsWith('tool-');

const withStepBoundaries = (parts: SendMessagePart[]): SendMessagePart[] => {
  const nextParts: SendMessagePart[] = [];
  let previousKind: 'tool' | 'non-tool' | null = null;

  for (const part of parts) {
    const currentKind = isToolPart(part) ? 'tool' : 'non-tool';

    if (previousKind === 'tool') {
      nextParts.push({ type: 'step-start' });
    }

    nextParts.push(part);
    previousKind = currentKind;
  }

  return nextParts;
};

export const buildConversationPayload = ({
  history,
  mode,
}: {
  history: ChatMessage[];
  mode: ChatMode;
}): SendMessageRequestArray => {
  return history
    .map<SendMessageRequest | null>((message, index) => {
      const messageMode = index === history.length - 1 ? mode : message.mode;
      const modelSequence =
        message.modelSequence ?? (messageMode ? [...chatModeModelSequences[messageMode]] : undefined);
      const modelId =
        message.modelId ?? modelSequence?.[0] ?? (messageMode ? chatModeModelIds[messageMode] : undefined);
      const parts = withStepBoundaries(
        message.parts.map((part) => toSendMessagePart(part)).filter((part): part is SendMessagePart => part !== null),
      );

      if (parts.length === 0) {
        return null;
      }

      return {
        id: message.id,
        role: message.role,
        parts,
        metadata: {
          messageIndex: message.messageIndex,
          projectStateWhenSendingMessage: message.projectStateWhenSendingMessage,
          mode: messageMode,
          modelId,
          modelSequence,
        },
      };
    })
    .filter((message): message is SendMessageRequest => message !== null);
};
