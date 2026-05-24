import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { LanguageModel, LanguageModelUsage, streamText, createGateway, ModelMessage, stepCountIs } from 'ai';
import {
  ChatMode,
  ChatRequestContext,
  chatModeModelIds,
  chatModeModelSequences,
  ChatStreamCost,
  ChatStreamSubagentDebugEvent,
  SendMessageRequestArray,
} from 'api-types';
import { ConfigService } from '@nestjs/config';
import { recordLocalAiGatewayUsage } from './local-usage-recorder';
import { recordConversationLog } from './conversation-log-recorder';
import { ToolsService } from './tools/tools.service';
import { PricingCalculator } from './pricing-calculator';
import { PromptsService } from '../prompts/prompts.service';
import { AiGatewayConsoleLogger } from './ai-gateway-console-logger';
import { buildProviderOptions, getModelConfig, getModelHeaders } from './models-config';
import { buildChatRequestContext } from './chat-request-context';
import { createOpenAIWebSocketModel } from './openai-websocket-model';
import {
  convertConversationToModelMessages,
  getLatestConversationMessage,
  getMessageProjectState,
  getMessageText,
  sortConversationMessages,
} from './chat-history';
import {
  getCachedInputTokens,
  getCacheCreationTokens,
  getOutputTextTokens,
  getReasoningTokens,
  getUncachedInputTokens,
} from './usage-utils';

export interface AiGatewayMessageResult {
  message: string;
  reasoning: string;
  modelId: string;
  modelSequence: string[];
  usage?: LanguageModelUsage;
  costUSD?: ChatStreamCost;
  requestContext?: ChatRequestContext;
}

export type AiGatewayToolEvent =
  | {
    type: 'tool-input-start';
    toolCallId: string;
    toolName: string;
    providerExecuted?: boolean;
  }
  | {
    type: 'tool-input-delta';
    toolCallId: string;
    toolName: string;
    inputTextDelta: string;
    providerExecuted?: boolean;
  }
  | {
    type: 'tool-input-finished';
    toolCallId: string;
    toolName: string;
    input?: Record<string, unknown> | string;
    providerExecuted?: boolean;
  }
  | {
    type: 'tool-result';
    toolCallId: string;
    toolName: string;
    input?: Record<string, unknown> | string;
    output?: unknown;
    preliminary?: boolean;
    providerExecuted?: boolean;
  }
  | {
    type: 'tool-error';
    toolCallId: string;
    toolName: string;
    input?: Record<string, unknown> | string;
    error: string;
    providerExecuted?: boolean;
  };

interface RequestedLanguageModel {
  model: LanguageModel;
  transport: 'gateway' | 'openai-websocket';
  close?: () => void;
}

@Injectable()
export class AiGatewayService {
  private readonly gateway: ReturnType<typeof createGateway>;
  private logger = new Logger(AiGatewayService.name);
  private readonly activeControllers = new Map<string, AbortController>();
  private readonly pricingCalculator: PricingCalculator;
  private hasLoggedMissingOpenAIKeyWarning = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly toolsService: ToolsService,
    private readonly promptsService: PromptsService,
  ) {
    this.gateway = createGateway({
      apiKey: this.configService.getOrThrow<string>('AI_GATEWAY_API_KEY'),
    });
    this.pricingCalculator = new PricingCalculator(this.gateway, this.logger);
  }

  async streamPromptForAIEditing({
    messages,
    mode,
    onStart,
    onTextDelta,
    onReasoningDelta,
    onComplete,
    onAbort,
    onToolEvent,
    onSubagentDebugEvent,
  }: {
    messages: SendMessageRequestArray;
    mode: ChatMode;
    onStart?: (requestContext: ChatRequestContext) => void;
    onTextDelta?: (delta: string) => void;
    onReasoningDelta?: (delta: string) => void;
    onComplete?: (result: AiGatewayMessageResult) => void;
    onAbort?: () => void;
    onToolEvent?: (event: AiGatewayToolEvent) => void;
    onSubagentDebugEvent?: (event: ChatStreamSubagentDebugEvent) => void;
  }): Promise<void> {
    const modelSequence = [...chatModeModelSequences[mode]];
    const modelId = chatModeModelIds[mode];
    const modelConfig = getModelConfig(modelId);
    const providerOptions = buildProviderOptions(modelId, mode);
    const headers = getModelHeaders(modelId);
    const requestedModel = this.createRequestedLanguageModel(modelId);

    const abortController = new AbortController();
    let wasAborted = false;
    const sortedMessages = sortConversationMessages(messages);
    const latestMessage = getLatestConversationMessage(sortedMessages);
    const latestMessageId = latestMessage?.id;
    const latestMessageLabel = latestMessageId ?? 'unknown';
    let consoleLogger: AiGatewayConsoleLogger | null = null;

    if (latestMessageId) {
      this.activeControllers.set(latestMessageId, abortController);
    }

    try {
      const tools = this.toolsService.getTools({
        projectState: getMessageProjectState(latestMessage),
        messageId: latestMessageId,
        modelId,
        mode,
        ...(onSubagentDebugEvent ? { reportSubagentDebugEvent: onSubagentDebugEvent } : {}),
      });
      const systemPrompt = this.promptsService.createSystemPrompt(tools);
      const latestUserState = getMessageProjectState(latestMessage);
      const latestPrompt = getMessageText(latestMessage);
      const formattedProjectState = latestUserState
        ? this.promptsService.formatProjectStateForAIEditing(latestUserState)
        : undefined;

      const toolInputBuffers = new Map<string, string>();
      const toolMetadata = new Map<string, { toolName?: string }>();
      const toolEventsForLog: AiGatewayToolEvent[] = [];

      const conversation = await convertConversationToModelMessages({
        messages: sortedMessages,
        tools,
      });
      const latestConversationMessage = conversation[conversation.length - 1];

      if (latestConversationMessage?.role === 'user') {
        latestConversationMessage.content = this.promptsService.createPromptForAIEditing(
          latestPrompt,
          latestUserState,
        );
      }

      const messagesWithSystem: ModelMessage[] = [{ role: 'system', content: systemPrompt }, ...conversation];
      const requestContext = buildChatRequestContext({
        modelId,
        systemPrompt,
        tools,
        history: sortedMessages.slice(0, -1),
        latestPrompt,
        formattedProjectState,
        latestState: latestUserState,
      });
      const editorPrompt =
        latestConversationMessage?.role === 'user' && typeof latestConversationMessage.content === 'string'
          ? latestConversationMessage.content
          : latestPrompt;
      consoleLogger = new AiGatewayConsoleLogger({
        messageId: latestMessageLabel,
        mode,
        modelId,
        provider: modelConfig?.provider ?? 'unknown',
        transport: requestedModel.transport,
        latestPrompt,
        editorPrompt,
        systemPrompt,
        providerOptions,
        toolNames: Object.keys(tools),
        requestContext,
      });
      consoleLogger.start();

      const streamTextOptions: Parameters<typeof streamText<typeof tools>>[0] = {
        model: requestedModel.model,
        messages: messagesWithSystem,
        abortSignal: abortController.signal,
        tools,
        stopWhen: stepCountIs(20),
        providerOptions,
        headers,
        onAbort: () => {
          wasAborted = true;
          onAbort?.();
        },
      };

      const result = streamText<typeof tools>(streamTextOptions);

      onStart?.(requestContext);
      let reasoning = '';
      let streamedReasoning = false;

      for await (const part of result.fullStream) {
        switch (part.type) {
          case 'reasoning-start':
            break;
          case 'text-delta':
            onTextDelta?.(part.text);
            break;
          case 'reasoning-delta': {
            const reasoningPart = part as { text?: string; delta?: string; textDelta?: string };
            const delta = reasoningPart.text ?? reasoningPart.delta ?? reasoningPart.textDelta;

            if (delta) {
              reasoning += delta;
              streamedReasoning = true;
              onReasoningDelta?.(delta);
            }
            break;
          }
          case 'reasoning-end': {
            const reasoningPart = part as { text?: string; delta?: string };
            const finalDelta = reasoningPart.text ?? reasoningPart.delta;

            if (finalDelta) {
              reasoning += finalDelta;
              streamedReasoning = true;
              onReasoningDelta?.(finalDelta);
            }
            break;
          }
          case 'tool-input-start': {
            const toolCallId = part.id;
            toolMetadata.set(toolCallId, { toolName: part.toolName });
            toolInputBuffers.set(toolCallId, '');
            const event: AiGatewayToolEvent = {
              type: 'tool-input-start',
              toolCallId,
              toolName: part.toolName,
              providerExecuted: part.providerExecuted,
            };
            consoleLogger.captureToolInputStart({
              toolCallId,
              toolName: part.toolName,
              providerExecuted: part.providerExecuted,
            });
            toolEventsForLog.push(event);
            onToolEvent?.(event);
            break;
          }
          case 'tool-input-delta': {
            const toolCallId = part.id;
            const existing = toolInputBuffers.get(toolCallId) ?? '';
            const nextInputText = `${existing}${part.delta}`;
            toolInputBuffers.set(toolCallId, nextInputText);
            consoleLogger.captureToolInputDelta(toolCallId, part.delta);
            const event: AiGatewayToolEvent = {
              type: 'tool-input-delta',
              toolCallId,
              toolName: toolMetadata.get(toolCallId)?.toolName ?? 'tool',
              inputTextDelta: part.delta,
            };
            toolEventsForLog.push(event);
            onToolEvent?.(event);
            break;
          }
          case 'tool-input-end': {
            const toolCallId = part.id;
            const toolName = toolMetadata.get(toolCallId)?.toolName ?? 'tool';
            const inputText = toolInputBuffers.get(toolCallId);

            if (inputText) {
              const event: AiGatewayToolEvent = {
                type: 'tool-input-finished',
                toolCallId,
                toolName,
                input: inputText,
              };
              consoleLogger.captureToolInputFinished({
                toolCallId,
                toolName,
                input: inputText,
              });
              toolEventsForLog.push(event);
              onToolEvent?.(event);
            }
            break;
          }
          case 'tool-call': {
            toolMetadata.set(part.toolCallId, { toolName: part.toolName });
            consoleLogger.captureToolInputFinished({
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              input: part.input as Record<string, unknown>,
              providerExecuted: part.providerExecuted,
            });
            consoleLogger.logToolCall({
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              input: part.input as Record<string, unknown>,
              providerExecuted: part.providerExecuted,
            });
            const event: AiGatewayToolEvent = {
              type: 'tool-input-finished',
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              input: part.input as Record<string, unknown>,
              providerExecuted: part.providerExecuted,
            };
            toolEventsForLog.push(event);
            onToolEvent?.(event);
            break;
          }
          case 'tool-result': {
            toolMetadata.set(part.toolCallId, { toolName: part.toolName });
            const event: AiGatewayToolEvent = {
              type: 'tool-result',
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              input: part.input as Record<string, unknown> | string | undefined,
              output: part.output,
              preliminary: part.preliminary,
              providerExecuted: part.providerExecuted,
            };
            consoleLogger.logToolResult({
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              input: part.input as Record<string, unknown> | string | undefined,
              output: part.output,
              preliminary: part.preliminary,
              providerExecuted: part.providerExecuted,
            });
            toolEventsForLog.push(event);
            onToolEvent?.(event);
            toolInputBuffers.delete(part.toolCallId);
            toolMetadata.delete(part.toolCallId);
            break;
          }
          case 'tool-error': {
            toolMetadata.set(part.toolCallId, { toolName: part.toolName });
            const event: AiGatewayToolEvent = {
              type: 'tool-error',
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              input: part.input as Record<string, unknown> | string | undefined,
              error: this.formatToolError(part.error),
              providerExecuted: part.providerExecuted,
            };
            consoleLogger.logToolError({
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              input: part.input as Record<string, unknown> | string | undefined,
              error: this.formatToolError(part.error),
              providerExecuted: part.providerExecuted,
            });
            toolEventsForLog.push(event);
            onToolEvent?.(event);
            toolInputBuffers.delete(part.toolCallId);
            toolMetadata.delete(part.toolCallId);
            break;
          }
          default:
            if ((part as { type?: string }).type === 'reasoning') {
              const reasoningPart = part as { text?: string; delta?: string; textDelta?: string };
              const delta = reasoningPart.text ?? reasoningPart.delta ?? reasoningPart.textDelta;

              if (delta) {
                reasoning += delta;
                streamedReasoning = true;
                onReasoningDelta?.(delta);
              }
            }
            break;
        }
      }

      const [completion, usage, reasoningText] = await Promise.all([
        result.text,
        result.usage,
        result.reasoningText,
      ]);
      const fullReasoning = reasoning || reasoningText || '';

      if (!streamedReasoning && fullReasoning) {
        onReasoningDelta?.(fullReasoning);
      }

      const costUSD = await this.pricingCalculator.calculateRequestCostUSD(modelId, usage);
      consoleLogger.complete({
        completion,
        reasoning: fullReasoning,
        usage,
        costUSD,
      });

      if (usage && this.shouldRecordUsageLocally()) {
        const uncachedInputTokens = getUncachedInputTokens(usage);
        const cachedInputTokens = getCachedInputTokens(usage);
        const cacheCreationTokens = getCacheCreationTokens(usage);
        const outputTextTokens = getOutputTextTokens(usage);
        const reasoningTokens = getReasoningTokens(usage);

        await recordLocalAiGatewayUsage({
          modelId,
          tokens: {
            total: usage.totalTokens,
            input: uncachedInputTokens ?? usage.inputTokens,
            output: outputTextTokens ?? usage.outputTokens,
            reasoning: reasoningTokens,
            cachedInput: cachedInputTokens,
            cacheCreation: cacheCreationTokens,
          },
          usd: costUSD
            ? {
              total: costUSD.total,
              input: costUSD.input,
              output: costUSD.output,
              reasoning: costUSD.reasoning,
            }
            : undefined,
        });

        // Save complete conversation log (local only)
        await recordConversationLog({
          modelId,
          mode,
          systemPrompt,
          messages,
          reasoning: fullReasoning,
          finalResponse: completion,
          toolEvents: toolEventsForLog,
          usage,
          costUSD,
        });
      }

      onComplete?.({
        message: completion,
        reasoning: fullReasoning,
        modelId,
        modelSequence,
        usage,
        costUSD,
        requestContext,
      });
    } catch (error) {
      if (abortController.signal.aborted || wasAborted) {
        consoleLogger?.aborted();
        return;
      }
      consoleLogger?.failed(error);
      if (!consoleLogger) {
        this.logger.error(`Failed to generate a response from the AI gateway [${latestMessageLabel}]`, error);
      }
      throw new InternalServerErrorException('Failed to generate a response.', {
        cause: error instanceof Error ? error : undefined,
      });
    } finally {
      requestedModel.close?.();
      if (latestMessageId) {
        this.activeControllers.delete(latestMessageId);
      }
    }
  }

  stopPrompt(messageId: string): boolean {
    const controller = this.activeControllers.get(messageId);

    if (!controller) {
      return false;
    }

    controller.abort();
    this.activeControllers.delete(messageId);
    return true;
  }

  private formatToolError(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return 'Unexpected tool error';
    }
  }

  private shouldRecordUsageLocally(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development';
    const isLocalLoggingEnabled = this.configService.get<string>('AI_GATEWAY_LOCAL_LOGS') === 'true';

    return nodeEnv !== 'production' && isLocalLoggingEnabled;
  }

  private createRequestedLanguageModel(modelId: string): RequestedLanguageModel {
    if (!modelId.startsWith('openai/')) {
      return {
        model: this.gateway(modelId),
        transport: 'gateway',
      };
    }

    const openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!openAiApiKey) {
      if (!this.hasLoggedMissingOpenAIKeyWarning) {
        this.logger.warn(
          'OPENAI_API_KEY is not configured. OpenAI WebSocket streaming is disabled and requests will continue through AI Gateway.',
        );
        this.hasLoggedMissingOpenAIKeyWarning = true;
      }

      return {
        model: this.gateway(modelId),
        transport: 'gateway',
      };
    }

    const openAiModel = createOpenAIWebSocketModel({
      apiKey: openAiApiKey,
      modelId,
      baseURL: this.configService.get<string>('OPENAI_BASE_URL'),
      organization: this.configService.get<string>('OPENAI_ORGANIZATION'),
      project: this.configService.get<string>('OPENAI_PROJECT'),
    });

    return {
      model: openAiModel.model,
      transport: 'openai-websocket',
      close: openAiModel.close,
    };
  }
}
