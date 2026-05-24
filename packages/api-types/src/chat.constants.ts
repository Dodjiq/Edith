export const chatStreamEventKinds = {
  started: 'assistant-message-started',
  textDelta: 'assistant-message-text-delta',
  reasoningDelta: 'assistant-message-reasoning-delta',
  completed: 'assistant-message-completed',
  stopped: 'assistant-message-stopped',
  error: 'assistant-message-error',
  toolInputStarted: 'assistant-tool-input-started',
  toolInputDelta: 'assistant-tool-input-delta',
  toolInputFinished: 'assistant-tool-input-finished',
  toolResult: 'assistant-tool-result',
  toolError: 'assistant-tool-error',
  subagentDebug: 'assistant-subagent-debug',
} as const;

export const chatModeModelSequences = {
  fast: ['openai/gpt-5.5'],
  normal: ['openai/gpt-5.5'],
  smart: ['openai/gpt-5.5'],
  pro: ['openai/gpt-5.5'],
} as const;

export const chatModeModelIds = {
  fast: chatModeModelSequences.fast[0],
  normal: chatModeModelSequences.normal[0],
  smart: chatModeModelSequences.smart[0],
  pro: chatModeModelSequences.pro[0],
} as const;

export type ChatStreamEventKind = (typeof chatStreamEventKinds)[keyof typeof chatStreamEventKinds];

export type ChatStreamUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
};

export type ChatStreamCost = {
  input?: number;
  output?: number;
  reasoning?: number;
  total?: number;
};

export type ChatRequestContextPart = {
  id: 'system' | 'tools' | 'history' | 'project-state' | 'prompt';
  label: string;
  summary: string;
  estimatedTokens: number;
  characters: number;
};

export type ChatRequestContext = {
  modelId: string;
  estimatedInputTokens: number;
  actualInputTokens?: number;
  actualTotalTokens?: number;
  parts: ChatRequestContextPart[];
};

type ChatStreamBasePayload = {
  messageId: string;
};

type ChatStreamToolPayloadBase = ChatStreamBasePayload & {
  toolCallId: string;
  toolName: string;
  title?: string;
};

export type ChatStreamSubagentDebugEvent = {
  type: 'started' | 'reasoning' | 'tool-call' | 'tool-result' | 'completed' | 'error';
  subagentName: string;
  parentToolCallId?: string | undefined;
  modelId?: string | undefined;
  stepNumber?: number | undefined;
  reasoning?: string | undefined;
  toolCallId?: string | undefined;
  toolName?: string | undefined;
  input?: unknown;
  output?: unknown;
  finalText?: string | undefined;
  error?: string | undefined;
  createdAt: string;
};

export type ChatStreamPayload =
  | (ChatStreamBasePayload & {
    event: typeof chatStreamEventKinds.started;
    modelId?: string;
    modelSequence?: string[];
    requestContext?: ChatRequestContext;
  })
  | (ChatStreamBasePayload & {
    event: typeof chatStreamEventKinds.textDelta;
    textDelta: string;
  })
  | (ChatStreamBasePayload & {
    event: typeof chatStreamEventKinds.reasoningDelta;
    reasoningDelta: string;
  })
  | (ChatStreamBasePayload & {
    event: typeof chatStreamEventKinds.completed;
    message: string;
    reasoning?: string;
    modelId?: string;
    modelSequence?: string[];
    usage?: ChatStreamUsage;
    costUSD?: ChatStreamCost;
    requestContext?: ChatRequestContext;
  })
  | (ChatStreamBasePayload & {
    event: typeof chatStreamEventKinds.stopped;
  })
  | (ChatStreamBasePayload & {
    event: typeof chatStreamEventKinds.error;
    error: string;
  })
  | (ChatStreamToolPayloadBase & {
    event: typeof chatStreamEventKinds.toolInputStarted;
    providerExecuted?: boolean;
  })
  | (ChatStreamToolPayloadBase & {
    event: typeof chatStreamEventKinds.toolInputDelta;
    inputTextDelta: string;
    providerExecuted?: boolean;
  })
  | (ChatStreamToolPayloadBase & {
    event: typeof chatStreamEventKinds.toolInputFinished;
    input?: Record<string, unknown> | string;
    providerExecuted?: boolean;
  })
  | (ChatStreamToolPayloadBase & {
    event: typeof chatStreamEventKinds.toolResult;
    input?: Record<string, unknown> | string;
    output?: unknown;
    preliminary?: boolean;
    providerExecuted?: boolean;
  })
  | (ChatStreamToolPayloadBase & {
    event: typeof chatStreamEventKinds.toolError;
    input?: Record<string, unknown> | string;
    error: string;
    providerExecuted?: boolean;
  })
  | (ChatStreamBasePayload & {
    event: typeof chatStreamEventKinds.subagentDebug;
    subagentEvent: ChatStreamSubagentDebugEvent;
  });
