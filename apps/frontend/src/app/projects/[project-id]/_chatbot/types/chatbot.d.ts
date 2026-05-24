import {
  ChatMode,
  ChatRequestContext,
  ChatStreamSubagentDebugEvent,
  ChatStreamUsage,
  DigestProjectStateRequest,
} from 'api-types';

export type ToolState =
  | 'input-streaming'
  | 'input-available'
  | 'approval-requested'
  | 'approval-responded'
  | 'output-available'
  | 'output-error'
  | 'output-denied';

export type ChainOfThoughtSearchResult = {
  id: string;
  label: string;
  href?: string;
};

export type ChainOfThoughtStep = {
  id: string;
  label: string;
  description?: string;
  status?: 'complete' | 'active' | 'pending';
  content?: string;
  searchResults?: ChainOfThoughtSearchResult[];
  image?: {
    alt: string;
    url?: string;
  };
};

export type ChatChainOfThoughtPart = {
  type: 'chain-of-thought';
  title?: string;
  steps: ChainOfThoughtStep[];
  defaultOpen?: boolean;
};

export type ChatToolPart = {
  type: 'tool';
  toolCallId: string;
  name: string;
  state: ToolState;
  input?: Record<string, unknown> | string;
  output?: string | Record<string, unknown> | unknown;
  errorText?: string;
  title?: string;
  providerExecuted?: boolean;
  preliminary?: boolean;
};

export type ChatStatusPart = {
  type: 'status';
  text: string;
};

export type ChatReasoningPart = {
  type: 'reasoning';
  text: string;
  state?: 'streaming' | 'complete';
  startedAt?: number;
};

export type ChatSubagentDebugPart = {
  type: 'subagent-debug';
  event: ChatStreamSubagentDebugEvent;
};

export type ChatMessagePart =
  | { type: 'text'; text: string }
  | ChatReasoningPart
  | ChatStatusPart
  | { type: 'source-url'; url: string; title?: string }
  | ChatChainOfThoughtPart
  | ChatToolPart
  | ChatSubagentDebugPart;

export type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  parts: ChatMessagePart[];
  messageIndex: number;
  mode?: ChatMode;
  modelId?: string;
  modelSequence?: string[];
  projectStateWhenSendingMessage?: DigestProjectStateRequest;
};

export type ChatStatus = 'idle' | 'submitting' | 'streaming' | 'submitted';

export type SendMessagePayload = {
  text: string;
  projectStateWhenSendingMessage: DigestProjectStateRequest | undefined;
  mode: ChatMode;
};

export type UseChatReturn = {
  messages: ChatMessage[];
  status: ChatStatus;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
  regenerate: (projectStateOverride?: DigestProjectStateRequest) => void;
  stop: () => Promise<void>;
  resetConversation: () => Promise<void>;
  isStopping: boolean;
  latestUsage?: ChatStreamUsage;
  latestModelId?: string;
  latestRequestContext?: ChatRequestContext;
};
