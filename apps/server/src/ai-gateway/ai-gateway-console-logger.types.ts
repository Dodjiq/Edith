import { ChatMode, ChatRequestContext } from 'api-types';

export interface AiGatewayConsoleLoggerParams {
  messageId: string;
  mode: ChatMode;
  modelId: string;
  provider: string;
  transport: 'gateway' | 'openai-websocket';
  latestPrompt: string;
  editorPrompt: string;
  systemPrompt: string;
  providerOptions?: unknown;
  toolNames: string[];
  requestContext: ChatRequestContext;
}

export interface ToolTrace {
  order: number;
  toolCallId: string;
  toolName: string;
  providerExecuted?: boolean;
  inputBuffer: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  status: 'preparing' | 'called' | 'completed' | 'error';
  hasLoggedCall: boolean;
  hasLoggedCompletion: boolean;
}

export interface ToolPayload {
  toolCallId: string;
  toolName: string;
  providerExecuted?: boolean;
}
