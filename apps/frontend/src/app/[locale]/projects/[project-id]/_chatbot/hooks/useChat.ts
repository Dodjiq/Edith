'use client';
//? UseChat documentation is available at https://v6.ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat - you can get access by using AI SDK mcp from Vercel

import { useWebSocket } from '@/app/WebSocketProvider';
import api from '@/utils/services/api-frontend';
import {
  ChatMode,
  RealtimeMessage,
  chatStreamEventKinds,
  ChatStreamPayload,
  ChatRequestContext,
  ChatStreamUsage,
  chatModeModelIds,
  chatModeModelSequences,
  realtimeMessageTypes,
  DigestProjectStateRequest,
} from 'api-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChatMessage, ChatMessagePart, ChatStatus, SendMessagePayload, UseChatReturn } from '../types/chatbot';
import { createId } from '../utils/createId';
import { buildConversationPayload } from '../utils/buildConversationPayload';
import { getChatInteractionLockState } from '../utils/chat-activity';
import { useSilentTranscriptionStore } from '../../_editor-container/editor/state/silent-transcription-store';
import { useEditorInteractionLockStore } from '../../_editor-container/editor/state/editor-interaction-lock-store';
import { useTimelineAiEditStore } from '../../_editor-container/editor/state/timeline-ai-edit-store';

const COMPLETED_STATUS_DELAY_MS = 700;

const appendTextPart = (parts: ChatMessagePart[], text: string): ChatMessagePart[] => {
  const nextParts = [...parts];
  const lastIndex = nextParts.length - 1;
  const lastPart = nextParts[lastIndex];

  if (lastPart && lastPart.type === 'text') {
    const updated = { ...lastPart, text: `${lastPart.text}${text}` } as Extract<ChatMessagePart, { type: 'text' }>;
    nextParts[lastIndex] = updated;
    return nextParts;
  }

  return [...nextParts, { type: 'text', text }];
};

type ReasoningPart = Extract<ChatMessagePart, { type: 'reasoning' }>;

/**
 * Appends reasoning text, creating separate reasoning blocks when AI context changes.
 *
 * ARCHITECTURE: Reasoning parts are intentionally NOT merged across tool calls.
 * After a tool executes, the AI receives tool output which changes its context.
 * Subsequent reasoning is a NEW thought process based on this updated context,
 * so it must appear as a separate block in the UI (after the tool, not before).
 *
 * Flow: [reasoning1] → [tool call] → [reasoning2 (new block, post-tool context)]
 */
const appendReasoningPart = (parts: ChatMessagePart[], text: string): ChatMessagePart[] => {
  const nextParts = [...parts];
  const lastPart = nextParts.at(-1);

  if (lastPart?.type === 'reasoning' && lastPart.state === 'streaming') {
    nextParts[nextParts.length - 1] = { ...lastPart, text: `${lastPart.text}${text}` };
    return nextParts;
  }

  if (nextParts.length === 0) {
    return [{ type: 'reasoning', text, state: 'streaming', startedAt: Date.now() }];
  }

  return [...nextParts, { type: 'reasoning', text, state: 'streaming', startedAt: Date.now() }];
};

const setReasoningState = (parts: ChatMessagePart[], state: NonNullable<ReasoningPart['state']>): ChatMessagePart[] => {
  const hasReasoningToUpdate = parts.some(
    (part) => part.type === 'reasoning' && part.state !== state && part.state !== 'complete',
  );

  if (!hasReasoningToUpdate) {
    return parts;
  }

  return parts.map((part) => {
    if (part.type === 'reasoning' && part.state !== 'complete') {
      return { ...part, state };
    }
    return part;
  });
};

const appendStatusPart = (parts: ChatMessagePart[], text: string): ChatMessagePart[] => {
  const nextParts = [...parts];
  const statusIndex = nextParts.findIndex((part) => part.type === 'status');
  const statusPart: Extract<ChatMessagePart, { type: 'status' }> = { type: 'status', text };

  if (statusIndex >= 0) {
    nextParts[statusIndex] = statusPart;
    return nextParts;
  }

  return [...nextParts, statusPart];
};

const appendSubagentDebugPart = (
  parts: ChatMessagePart[],
  event: Extract<ChatStreamPayload, { event: typeof chatStreamEventKinds.subagentDebug }>['subagentEvent'],
): ChatMessagePart[] => [...parts, { type: 'subagent-debug', event }];

type ToolPart = Extract<ChatMessagePart, { type: 'tool' }>;

const upsertToolPart = (
  parts: ChatMessagePart[],
  toolCallId: string,
  builder: (existing?: ToolPart) => ToolPart,
): ChatMessagePart[] => {
  const nextParts = [...parts];
  const existingIndex = nextParts.findIndex(
    (part): part is ToolPart => part.type === 'tool' && part.toolCallId === toolCallId,
  );
  const existing = existingIndex >= 0 ? (nextParts[existingIndex] as ToolPart) : undefined;
  const updated = builder(existing);

  if (existingIndex >= 0) {
    nextParts[existingIndex] = updated;
    return nextParts;
  }

  return [...nextParts, updated];
};

const STOPPED_RESPONSE_TEXT = 'Response stopped';

const createUserMessage = (
  text: string,
  messageIndex: number,
  mode: ChatMode,
  projectStateWhenSendingMessage?: DigestProjectStateRequest,
): ChatMessage => ({
  id: createId(),
  role: 'user',
  messageIndex,
  mode,
  modelId: chatModeModelIds[mode],
  modelSequence: [...chatModeModelSequences[mode]],
  parts: [
    {
      type: 'text',
      text,
    },
  ],
  projectStateWhenSendingMessage,
});

const extractTimelineItemIdsFromPrompt = (text: string): string[] => {
  const match = text.match(/```timeline-items\s*([\s\S]*?)```/);
  if (!match) {
    return [];
  }

  try {
    const parsed = JSON.parse(match[1].trim()) as unknown;
    const items = (parsed as { items?: unknown })?.items;

    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => (typeof item === 'object' && item && 'id' in item ? (item as { id?: unknown }).id : null))
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
};

export const useChat = (): UseChatReturn => {
  const { registerHandler } = useWebSocket();
  const { mutateAsync: requestAssistantResponse } = api.messages.sendMessage.useMutation();
  const { mutateAsync: requestStopResponse } = api.messages.stopMessage.useMutation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [isStopping, setIsStopping] = useState(false);
  const [latestUsage, setLatestUsage] = useState<ChatStreamUsage | undefined>(undefined);
  const [latestModelId, setLatestModelId] = useState<string | undefined>(undefined);
  const [latestRequestContext, setLatestRequestContext] = useState<ChatRequestContext | undefined>(undefined);
  const lastMessageRef = useRef<{
    text: string;
    projectStateWhenSendingMessage?: DigestProjectStateRequest;
    mode: ChatMode;
  } | null>(null);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAssistantMessageIdRef = useRef<string | null>(null);
  const streamToAssistantMessageIdRef = useRef<Record<string, string>>({});

  const clearCompletionTimer = useCallback(() => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
  }, []);

  const clearActiveAssistantMessage = useCallback(() => {
    activeAssistantMessageIdRef.current = null;
  }, []);

  /**
   * Updates an existing assistant message that corresponds to the streaming messageId.
   * If the streaming ID belongs to a user message, we create a dedicated assistant message
   * and keep the user entry untouched.
   */
  const upsertAssistantMessage = useCallback(
    (streamMessageId: string, updater: (message: ChatMessage) => ChatMessage) => {
      setMessages((prev) => {
        const existingAssistantId = streamToAssistantMessageIdRef.current[streamMessageId];
        const assistantIndex = prev.findIndex(
          (message) => message.id === (existingAssistantId ?? streamMessageId) && message.role === 'assistant',
        );
        const userIndex = prev.findIndex((message) => message.id === streamMessageId && message.role === 'user');

        if (assistantIndex >= 0) {
          const next = [...prev];
          next[assistantIndex] = updater(prev[assistantIndex]);
          return next;
        }

        const assistantId = existingAssistantId ?? (userIndex >= 0 ? createId() : streamMessageId);

        streamToAssistantMessageIdRef.current[streamMessageId] = assistantId;

        const baseMessage: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          parts: [],
          messageIndex: userIndex >= 0 ? userIndex + 1 : prev.length,
          mode: userIndex >= 0 ? prev[userIndex].mode : undefined,
          modelId: userIndex >= 0 ? prev[userIndex].modelId : undefined,
          modelSequence: userIndex >= 0 ? prev[userIndex].modelSequence : undefined,
        };

        const next = [...prev];
        const updatedMessage = updater(baseMessage);

        if (userIndex >= 0) {
          next.splice(userIndex + 1, 0, updatedMessage);
          return next;
        }

        return [...next, updatedMessage];
      });
    },
    [],
  );

  const handleCompletion = useCallback(
    (payload: Extract<ChatStreamPayload, { event: typeof chatStreamEventKinds.completed }>) => {
      useTimelineAiEditStore.getState().clearActiveItemIds();
      upsertAssistantMessage(payload.messageId, (message) => {
        const nonTextParts = message.parts.filter((part) => part.type !== 'text');
        const hasReasoningParts = nonTextParts.some((part) => part.type === 'reasoning');

        const partsWithCompletedReasoning = nonTextParts.map((part) =>
          part.type === 'reasoning' ? { ...part, state: 'complete' as const } : part,
        );

        const updatedParts = [...partsWithCompletedReasoning, { type: 'text' as const, text: payload.message }];

        if (!hasReasoningParts && payload.reasoning) {
          return {
            ...message,
            modelId: payload.modelId ?? message.modelId,
            modelSequence: payload.modelSequence ?? message.modelSequence,
            parts: [{ type: 'reasoning', text: payload.reasoning, state: 'complete' as const }, ...updatedParts],
          };
        }

        if (!payload.reasoning) {
          return {
            ...message,
            modelId: payload.modelId ?? message.modelId,
            modelSequence: payload.modelSequence ?? message.modelSequence,
            parts: updatedParts.filter(
              (part) => part.type !== 'reasoning' || (part.type === 'reasoning' && part.text.trim().length > 0),
            ),
          };
        }

        return {
          ...message,
          modelId: payload.modelId ?? message.modelId,
          modelSequence: payload.modelSequence ?? message.modelSequence,
          parts: updatedParts,
        };
      });
    },
    [upsertAssistantMessage],
  );

  const handleRealtimeMessage = useCallback(
    (realtimeMessage: RealtimeMessage<unknown>) => {
      const payload = realtimeMessage.payload as ChatStreamPayload;

      if (!payload || typeof payload !== 'object' || !('event' in payload)) {
        return;
      }

      switch (payload.event) {
        case chatStreamEventKinds.started: {
          if (payload.requestContext) {
            setLatestRequestContext(payload.requestContext);
          }
          if (payload.modelId) {
            setLatestModelId(payload.modelId);
          }
          activeAssistantMessageIdRef.current = payload.messageId;
          upsertAssistantMessage(payload.messageId, (message) => ({
            ...message,
            modelId: payload.modelId ?? message.modelId,
            modelSequence: payload.modelSequence ?? message.modelSequence,
            parts: appendReasoningPart(message.parts, ''),
          }));
          setStatus('streaming');
          return;
        }
        case chatStreamEventKinds.textDelta: {
          upsertAssistantMessage(payload.messageId, (message) => ({
            ...message,
            parts: appendTextPart(setReasoningState(message.parts, 'complete'), payload.textDelta),
          }));
          setStatus('streaming');
          return;
        }
        case chatStreamEventKinds.reasoningDelta: {
          upsertAssistantMessage(payload.messageId, (message) => ({
            ...message,
            parts: appendReasoningPart(message.parts, payload.reasoningDelta),
          }));
          setStatus('streaming');
          return;
        }
        case chatStreamEventKinds.toolInputStarted: {
          upsertAssistantMessage(payload.messageId, (message) => {
            const partsWithCompletedReasoning = setReasoningState(message.parts, 'complete');
            return {
              ...message,
              parts: upsertToolPart(partsWithCompletedReasoning, payload.toolCallId, (existing) => ({
                type: 'tool',
                toolCallId: payload.toolCallId,
                name: payload.toolName,
                state: 'input-streaming',
                input: existing?.input,
                output: existing?.output,
                errorText: undefined,
                title: payload.title ?? existing?.title,
                providerExecuted: payload.providerExecuted ?? existing?.providerExecuted,
                preliminary: existing?.preliminary,
              })),
            };
          });
          setStatus('streaming');
          return;
        }
        case chatStreamEventKinds.toolInputDelta: {
          upsertAssistantMessage(payload.messageId, (message) => ({
            ...message,
            parts: upsertToolPart(message.parts, payload.toolCallId, (existing) => {
              const existingInput = existing?.input;
              const nextInput =
                typeof existingInput === 'string'
                  ? `${existingInput}${payload.inputTextDelta}`
                  : existingInput
                    ? `${JSON.stringify(existingInput)}${payload.inputTextDelta}`
                    : payload.inputTextDelta;

              return {
                type: 'tool',
                toolCallId: payload.toolCallId,
                name: payload.toolName,
                state: 'input-streaming',
                input: nextInput,
                output: existing?.output,
                errorText: undefined,
                title: payload.title ?? existing?.title,
                providerExecuted: payload.providerExecuted ?? existing?.providerExecuted,
                preliminary: existing?.preliminary,
              };
            }),
          }));
          setStatus('streaming');
          return;
        }
        case chatStreamEventKinds.toolInputFinished: {
          upsertAssistantMessage(payload.messageId, (message) => ({
            ...message,
            parts: upsertToolPart(message.parts, payload.toolCallId, (existing) => ({
              type: 'tool',
              toolCallId: payload.toolCallId,
              name: payload.toolName,
              state: 'input-available',
              input: payload.input ?? existing?.input,
              output: existing?.output,
              errorText: undefined,
              title: payload.title ?? existing?.title,
              providerExecuted: payload.providerExecuted ?? existing?.providerExecuted,
              preliminary: existing?.preliminary,
            })),
          }));
          setStatus('streaming');
          return;
        }
        case chatStreamEventKinds.toolResult: {
          upsertAssistantMessage(payload.messageId, (message) => ({
            ...message,
            parts: upsertToolPart(message.parts, payload.toolCallId, (existing) => {
              const nextOutput = payload.output ?? existing?.output;
              const outputStatus =
                nextOutput && typeof nextOutput === 'object' && 'status' in (nextOutput as Record<string, unknown>)
                  ? (nextOutput as { status?: string }).status
                  : undefined;
              const outputError =
                nextOutput && typeof nextOutput === 'object' && 'error' in (nextOutput as Record<string, unknown>)
                  ? (nextOutput as { error?: unknown }).error
                  : undefined;
              const outputNote =
                nextOutput && typeof nextOutput === 'object' && 'note' in (nextOutput as Record<string, unknown>)
                  ? (nextOutput as { note?: unknown }).note
                  : undefined;
              const isErrorStatus = outputStatus === 'error' || outputStatus === 'timeout';
              const nextState: ToolPart['state'] = payload.preliminary
                ? 'input-available'
                : isErrorStatus
                  ? 'output-error'
                  : 'output-available';
              const nextErrorText =
                isErrorStatus && typeof outputError === 'string'
                  ? outputError
                  : isErrorStatus && typeof outputNote === 'string'
                    ? outputNote
                    : isErrorStatus
                      ? 'Tool execution failed'
                      : undefined;

              return {
                type: 'tool',
                toolCallId: payload.toolCallId,
                name: payload.toolName,
                state: nextState,
                input: payload.input ?? existing?.input,
                output: nextOutput,
                errorText: nextErrorText,
                title: payload.title ?? existing?.title,
                providerExecuted: payload.providerExecuted ?? existing?.providerExecuted,
                preliminary: payload.preliminary === true ? true : undefined,
              };
            }),
          }));
          setStatus('streaming');
          return;
        }
        case chatStreamEventKinds.toolError: {
          upsertAssistantMessage(payload.messageId, (message) => ({
            ...message,
            parts: upsertToolPart(message.parts, payload.toolCallId, (existing) => ({
              type: 'tool',
              toolCallId: payload.toolCallId,
              name: payload.toolName,
              state: 'output-error',
              input: payload.input ?? existing?.input,
              output: existing?.output,
              errorText: payload.error,
              title: payload.title ?? existing?.title,
              providerExecuted: payload.providerExecuted ?? existing?.providerExecuted,
              preliminary: undefined,
            })),
          }));
          setStatus('streaming');
          return;
        }
        case chatStreamEventKinds.subagentDebug: {
          upsertAssistantMessage(payload.messageId, (message) => ({
            ...message,
            parts: appendSubagentDebugPart(message.parts, payload.subagentEvent),
          }));
          setStatus('streaming');
          return;
        }
        case chatStreamEventKinds.completed: {
          handleCompletion(payload);
          setLatestUsage(payload.usage);
          if (payload.requestContext) {
            setLatestRequestContext(payload.requestContext);
          }
          setLatestModelId(payload.modelId);
          setStatus('submitted');
          clearCompletionTimer();
          completionTimerRef.current = setTimeout(() => setStatus('idle'), COMPLETED_STATUS_DELAY_MS);
          clearActiveAssistantMessage();
          setIsStopping(false);
          return;
        }
        case chatStreamEventKinds.stopped: {
          useTimelineAiEditStore.getState().clearActiveItemIds();
          setMessages((prev) => {
            const existingIndex = prev.findIndex((message) => message.id === payload.messageId);

            if (existingIndex < 0) {
              return prev;
            }

            const message = prev[existingIndex];
            const nextParts = appendStatusPart(setReasoningState(message.parts, 'complete'), STOPPED_RESPONSE_TEXT);
            const nextMessages = [...prev];
            nextMessages[existingIndex] = { ...message, parts: nextParts };
            return nextMessages;
          });
          clearCompletionTimer();
          clearActiveAssistantMessage();
          setIsStopping(false);
          setStatus('idle');
          return;
        }
        case chatStreamEventKinds.error: {
          useTimelineAiEditStore.getState().clearActiveItemIds();
          upsertAssistantMessage(payload.messageId, (message) => ({
            ...message,
            parts: appendTextPart(message.parts, `Assistant error: ${payload.error}`),
          }));
          clearCompletionTimer();
          clearActiveAssistantMessage();
          setIsStopping(false);
          setStatus('idle');
          return;
        }
        default:
          return;
      }
    },
    [clearActiveAssistantMessage, clearCompletionTimer, handleCompletion, upsertAssistantMessage],
  );

  useEffect(() => {
    const unregister = registerHandler(realtimeMessageTypes.chat, handleRealtimeMessage);

    return () => {
      clearCompletionTimer();
      unregister();
    };
  }, [clearCompletionTimer, handleRealtimeMessage, registerHandler]);

  // Sync AI agent active state to suppress transcription toasts during tool calls
  useEffect(() => {
    const interactionLock = getChatInteractionLockState({ status, isStopping });
    useSilentTranscriptionStore.getState().setAiAgentActive(Boolean(interactionLock));
    useEditorInteractionLockStore.getState().setLock(interactionLock);
  }, [isStopping, status]);

  useEffect(() => {
    return () => {
      useSilentTranscriptionStore.getState().setAiAgentActive(false);
      useEditorInteractionLockStore.getState().setLock(null);
    };
  }, []);

  const handleSendError = useCallback(
    (streamMessageId: string, error: unknown) => {
      const errorText = error instanceof Error ? error.message : 'Failed to reach assistant';
      useTimelineAiEditStore.getState().clearActiveItemIds();
      upsertAssistantMessage(streamMessageId, (message) => ({
        ...message,
        parts: appendTextPart(message.parts, `Assistant error: ${errorText}`),
      }));
      clearActiveAssistantMessage();
      setIsStopping(false);
      setStatus('idle');
    },
    [clearActiveAssistantMessage, upsertAssistantMessage],
  );

  const sendMessage = useCallback(
    async ({ text, projectStateWhenSendingMessage, mode }: SendMessagePayload) => {
      clearCompletionTimer();
      const normalizedText = (text ?? '').trim();

      if (!normalizedText) {
        return;
      }

      const timelineItemIds = extractTimelineItemIdsFromPrompt(normalizedText);
      if (timelineItemIds.length > 0) {
        useTimelineAiEditStore.getState().setActiveItemIds(timelineItemIds);
      } else {
        useTimelineAiEditStore.getState().clearActiveItemIds();
      }

      const messageIndex = messages.length;

      const userMessage = createUserMessage(normalizedText, messageIndex, mode, projectStateWhenSendingMessage);
      lastMessageRef.current = { text: normalizedText, projectStateWhenSendingMessage, mode };
      setMessages((prev) => [...prev, userMessage]);
      setStatus('submitting');

      activeAssistantMessageIdRef.current = userMessage.id;
      setIsStopping(false);

      const conversationPayload = buildConversationPayload({
        history: [...messages, userMessage],
        mode,
      });

      if (conversationPayload.length === 0) {
        activeAssistantMessageIdRef.current = null;
        setStatus('idle');
        return;
      }

      try {
        await requestAssistantResponse({
          body: conversationPayload,
        });
      } catch (error) {
        handleSendError(userMessage.id, error);
      }
    },
    [clearCompletionTimer, handleSendError, messages, requestAssistantResponse],
  );

  const stop = useCallback(async () => {
    const activeMessageId = activeAssistantMessageIdRef.current;
    const canStop = status === 'streaming' || status === 'submitted';

    if (!activeMessageId || !canStop) {
      return;
    }

    setIsStopping(true);
    clearCompletionTimer();

    try {
      const response = await requestStopResponse({
        body: {
          messageId: activeMessageId,
        },
      });

      if (response.body.status === 'not-found') {
        clearActiveAssistantMessage();
        useTimelineAiEditStore.getState().clearActiveItemIds();
        setIsStopping(false);
        setStatus('idle');
      }
    } catch {
      setIsStopping(false);
    }
  }, [clearActiveAssistantMessage, clearCompletionTimer, requestStopResponse, status]);

  const resetConversation = useCallback(async () => {
    clearCompletionTimer();
    const activeMessageId = activeAssistantMessageIdRef.current;

    if (activeMessageId) {
      try {
        await requestStopResponse({
          body: {
            messageId: activeMessageId,
          },
        });
      } catch {
        // ignore stop errors when resetting
      }
    }

    lastMessageRef.current = null;
    clearActiveAssistantMessage();
    streamToAssistantMessageIdRef.current = {};
    setIsStopping(false);
    setMessages([]);
    setStatus('idle');
    setLatestUsage(undefined);
    setLatestModelId(undefined);
    setLatestRequestContext(undefined);
    useTimelineAiEditStore.getState().clearActiveItemIds();
  }, [clearActiveAssistantMessage, clearCompletionTimer, requestStopResponse]);

  const regenerate = useCallback(
    (projectStateOverride?: DigestProjectStateRequest) => {
      if (!lastMessageRef.current) {
        return;
      }

      const { text, projectStateWhenSendingMessage, mode } = lastMessageRef.current;
      const nextProjectState = projectStateOverride ?? projectStateWhenSendingMessage;
      void sendMessage({
        text: `${text} (retry)`,
        projectStateWhenSendingMessage: nextProjectState,
        mode,
      });
    },
    [sendMessage],
  );

  return useMemo(
    () => ({
      messages,
      status,
      sendMessage,
      regenerate,
      stop,
      resetConversation,
      isStopping,
      latestUsage,
      latestModelId,
      latestRequestContext,
    }),
    [
      isStopping,
      latestModelId,
      latestRequestContext,
      latestUsage,
      messages,
      regenerate,
      resetConversation,
      sendMessage,
      status,
      stop,
    ],
  );
};
