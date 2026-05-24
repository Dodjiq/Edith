import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from '@/app/projects/[project-id]/_chatbot/chatbot-components/ai-elements/conversation/chain-of-thought';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/app/projects/[project-id]/_chatbot/chatbot-components/ai-elements/conversation/conversation';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageCopyAction,
  MessageResponse,
} from '@/app/projects/[project-id]/_chatbot/chatbot-components/ai-elements/message/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/app/projects/[project-id]/_chatbot/chatbot-components/ai-elements/conversation/reasoning';
import {
  Sources,
  SourcesContent,
  SourcesTrigger,
  Source,
} from '@/app/projects/[project-id]/_chatbot/chatbot-components/ai-elements/sources';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/app/projects/[project-id]/_chatbot/chatbot-components/ai-elements/conversation/tool';
import { Shimmer } from '@/app/projects/[project-id]/_chatbot/chatbot-components/ai-elements/conversation/shimmer';
import { BrainIcon, MessageSquare, RefreshCcwIcon } from 'lucide-react';
import Image from 'next/image';
import type { FC } from 'react';

import type { ChatMessage, ChatMessagePart, ChatStatus } from '../types/chatbot';
import { getHostname } from '../utils/getHostname';
import { getToolActivityLabel, isActiveToolState } from '../utils/tool-labels';

type ChatbotConversationProps = {
  messages: ChatMessage[];
  status: ChatStatus;
  latestMessageId?: string;
  onRegenerate: () => void;
};

const renderChainOfThought = (part: Extract<ChatMessagePart, { type: 'chain-of-thought' }>, key: string) => (
  <ChainOfThought key={key} defaultOpen={part.defaultOpen}>
    <ChainOfThoughtHeader>{part.title ?? 'Reasoning steps'}</ChainOfThoughtHeader>
    <ChainOfThoughtContent>
      {part.steps.map((step) => (
        <ChainOfThoughtStep key={step.id} label={step.label} description={step.description} status={step.status}>
          {step.content && <p className="text-sm text-zinc-600 dark:text-zinc-300">{step.content}</p>}
          {step.searchResults && step.searchResults.length > 0 && (
            <ChainOfThoughtSearchResults>
              {step.searchResults.map((result) => (
                <ChainOfThoughtSearchResult key={result.id}>
                  {result.label || getHostname(result.href)}
                </ChainOfThoughtSearchResult>
              ))}
            </ChainOfThoughtSearchResults>
          )}
          {step.image && (
            <ChainOfThoughtImage caption={step.image.alt}>
              {step.image.url ? (
                <Image
                  src={step.image.url}
                  alt={step.image.alt}
                  width={600}
                  height={400}
                  className="max-h-48 w-full rounded-xl object-cover"
                  unoptimized
                />
              ) : (
                <div className="text-sm text-zinc-500 dark:text-zinc-400">{step.image.alt}</div>
              )}
            </ChainOfThoughtImage>
          )}
        </ChainOfThoughtStep>
      ))}
    </ChainOfThoughtContent>
  </ChainOfThought>
);

const renderTool = (part: Extract<ChatMessagePart, { type: 'tool' }>, key: string) => (
  <Tool key={key} defaultOpen={false}>
    <ToolHeader type={part.name} title={part.title} state={part.state} />
    <ToolContent>
      <ToolInput input={part.input} />
      <ToolOutput output={part.output} errorText={part.errorText} />
    </ToolContent>
  </Tool>
);

const isReasoningPartVisible = (
  part: Extract<ChatMessagePart, { type: 'reasoning' }>,
  messageId: string,
  latestMessageId?: string,
) => {
  const isReasoningStreaming = part.state !== 'complete' && messageId === latestMessageId;
  const hasReasoningContent = part.text.trim().length > 0;

  return isReasoningStreaming || hasReasoningContent;
};

const isPartVisible = (part: ChatMessagePart, messageId: string, latestMessageId?: string) => {
  if (part.type === 'source-url') {
    return false;
  }

  if (part.type === 'reasoning') {
    return isReasoningPartVisible(part, messageId, latestMessageId);
  }

  return true;
};

const getTrailingToolStatusLabel = (message: ChatMessage, latestMessageId: string | undefined, status: ChatStatus) => {
  if (message.role !== 'assistant' || message.id !== latestMessageId || status !== 'streaming') {
    return null;
  }

  for (let index = message.parts.length - 1; index >= 0; index -= 1) {
    const part = message.parts[index];

    if (!isPartVisible(part, message.id, latestMessageId)) {
      continue;
    }

    if (part.type !== 'tool') {
      return null;
    }

    if (isActiveToolState(part.state)) {
      return `${getToolActivityLabel(part.name, part.title)}...`;
    }

    return 'Thinking...';
  }

  return null;
};

export const ChatbotConversation: FC<ChatbotConversationProps> = ({
  messages,
  status,
  latestMessageId,
  onRegenerate,
}) => {
  const lastMessage = messages.at(-1);
  let lastUserIndex = -1;

  messages.forEach((message, index) => {
    if (message.role === 'user') {
      lastUserIndex = index;
    }
  });

  const hasAssistantAfterLastUser = messages.some(
    (message, index) => message.role === 'assistant' && index > lastUserIndex,
  );

  const shouldShowPendingAssistantMessage =
    lastMessage?.role === 'user' && (status === 'submitting' || (status === 'streaming' && !hasAssistantAfterLastUser));

  return (
    <Conversation className="h-full rounded-none border-none bg-transparent shadow-none">
      <ConversationContent className={messages.length === 0 ? 'h-full' : ''}>
        {messages.length === 0 ? (
          <ConversationEmptyState
            icon={<MessageSquare className="size-6" />}
            title="Start a conversation"
            description="Type a message below to begin chatting"
          />
        ) : (
          <>
            {messages.map((message) => {
              const sourceParts = message.parts.filter(
                (part): part is Extract<ChatMessagePart, { type: 'source-url' }> => part.type === 'source-url',
              );
              const trailingToolStatusLabel = getTrailingToolStatusLabel(message, latestMessageId, status);

              return (
                <div key={message.id} className="w-full min-w-0 space-y-3">
                  {message.role === 'assistant' && sourceParts.length > 0 && (
                    <Sources>
                      <SourcesTrigger count={sourceParts.length} />
                      {sourceParts.map((part, sourceIndex) => (
                        <SourcesContent key={`${part.url}-${sourceIndex}`}>
                          <Source href={part.url} title={part.title ?? getHostname(part.url)} />
                        </SourcesContent>
                      ))}
                    </Sources>
                  )}
                  {message.parts.map((part, index) => {
                    if (part.type === 'source-url') {
                      return null;
                    }

                    if (part.type === 'reasoning') {
                      const isReasoningStreaming = part.state !== 'complete' && message.id === latestMessageId;
                      const hasReasoningContent = part.text.trim().length > 0;

                      if (!isReasoningStreaming && !hasReasoningContent) {
                        return null;
                      }

                      return (
                        <Reasoning
                          key={`${message.id}-${index}`}
                          className="w-full"
                          isStreaming={isReasoningStreaming}
                          startedAt={part.startedAt}
                        >
                          <ReasoningTrigger />
                          {hasReasoningContent && <ReasoningContent>{part.text}</ReasoningContent>}
                        </Reasoning>
                      );
                    }

                    if (part.type === 'chain-of-thought') {
                      return renderChainOfThought(part, `${message.id}-${index}`);
                    }

                    if (part.type === 'tool') {
                      return renderTool(part, `${message.id}-${index}`);
                    }

                    if (part.type === 'text') {
                      const isUserMessage = message.role === 'user';
                      const isLastTextPart = index === message.parts.length - 1;

                      return (
                        <Message key={`${message.id}-${index}`} from={message.role}>
                          <MessageContent className={isUserMessage ? 'relative' : undefined}>
                            <MessageResponse>{part.text}</MessageResponse>
                          </MessageContent>
                          {message.role === 'assistant' && isLastTextPart && (
                            <MessageActions>
                              <MessageAction onClick={onRegenerate} label="Retry" className="hidden">
                                <RefreshCcwIcon className="size-3" />
                              </MessageAction>
                              <MessageCopyAction
                                content={part.text}
                                label="Copy"
                                size="icon-sm"
                                className="size-5! [&_svg]:size-2.5!"
                              />
                            </MessageActions>
                          )}
                        </Message>
                      );
                    }

                    if (part.type === 'status') {
                      return (
                        <p key={`${message.id}-${index}`} className="text-muted-foreground text-xs">
                          {part.text}
                        </p>
                      );
                    }

                    return null;
                  })}
                  {trailingToolStatusLabel && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <BrainIcon className="size-4" />
                      <Shimmer duration={1}>{trailingToolStatusLabel}</Shimmer>
                    </div>
                  )}
                </div>
              );
            })}
            {shouldShowPendingAssistantMessage && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>Sending request...</Shimmer>
                </MessageContent>
              </Message>
            )}
          </>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};
