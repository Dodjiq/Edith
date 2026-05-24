import { Injectable } from '@nestjs/common';
import {
  SendMessageResponse,
  chatStreamEventKinds,
  realtimeMessageTypes,
  ChatStreamPayload,
  ChatStreamUsage,
  StopMessageRequest,
  StopMessageResponse,
  SendMessageRequestArray,
  editorToolNames,
  chatModeModelSequences,
} from 'api-types';
import { LanguageModelUsage } from 'ai';
import { AiGatewayService, AiGatewayToolEvent } from '../ai-gateway/ai-gateway.service';
import { aiGatewayToolNames } from '../ai-gateway/tool-names';
import { RealtimeService } from '../realtime/realtime.service';
import { getCachedInputTokens, getReasoningTokens } from '../ai-gateway/usage-utils';
import {
  getMessageMode,
  getLatestConversationMessage,
  sortConversationMessages,
} from '../ai-gateway/chat-history';

@Injectable()
export class MessagesService {
  constructor(
    private readonly aiGatewayService: AiGatewayService,
    private readonly realtimeService: RealtimeService,
  ) { }

  async sendMessage(conversation: SendMessageRequestArray): Promise<SendMessageResponse> {
    const sortedConversation = sortConversationMessages(conversation);
    const lastMessage = getLatestConversationMessage(sortedConversation);
    const messageId = lastMessage?.id.trim() ?? '';
    const mode = getMessageMode(lastMessage) ?? 'fast';

    void this.aiGatewayService
      .streamPromptForAIEditing({
        messages: sortedConversation,
        mode,
        onTextDelta: (textDelta) =>
          this.dispatchRealtimePayload({
            event: chatStreamEventKinds.textDelta,
            messageId,
            textDelta,
          }),
        onReasoningDelta: (reasoningDelta) =>
          this.dispatchRealtimePayload({
            event: chatStreamEventKinds.reasoningDelta,
            messageId,
            reasoningDelta,
          }),
        onStart: (requestContext) =>
          this.dispatchRealtimePayload({
            event: chatStreamEventKinds.started,
            messageId,
            modelId: requestContext.modelId,
            modelSequence: [...chatModeModelSequences[mode]],
            requestContext,
          }),
        onComplete: (result) => {
          const usage = this.mapUsage(result.usage);
          const requestContext = result.requestContext
            ? {
              ...result.requestContext,
              actualInputTokens: usage?.inputTokens,
              actualTotalTokens: usage?.totalTokens,
            }
            : undefined;

          this.dispatchRealtimePayload({
            event: chatStreamEventKinds.completed,
            messageId,
            message: result.message,
            reasoning: result.reasoning,
            modelId: result.modelId,
            modelSequence: result.modelSequence,
            usage,
            costUSD: result.costUSD,
            requestContext,
          });
        },
        onAbort: () =>
          this.dispatchRealtimePayload({
            event: chatStreamEventKinds.stopped,
            messageId,
          }),
        onToolEvent: (event) => this.dispatchToolEvent(messageId, event),
        onSubagentDebugEvent: (subagentEvent) =>
          this.dispatchRealtimePayload({
            event: chatStreamEventKinds.subagentDebug,
            messageId,
            subagentEvent,
          }),
      })
      .catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'AI gateway streaming failed';
        this.dispatchRealtimePayload({
          event: chatStreamEventKinds.error,
          messageId,
          error: errorMessage,
        });
      });

    return {
      messageId,
      status: 'accepted',
    };
  }

  async stopMessage(request: StopMessageRequest): Promise<StopMessageResponse> {
    const wasStopped = this.aiGatewayService.stopPrompt(request.messageId);

    return {
      messageId: request.messageId,
      status: wasStopped ? 'stopped' : 'not-found',
    };
  }

  private dispatchToolEvent(messageId: string, event: AiGatewayToolEvent): void {
    const title = this.getToolTitle(event.toolName);
    const basePayload = {
      messageId,
      toolCallId: event.toolCallId,
      toolName: event.toolName,
      title,
      providerExecuted: event.providerExecuted,
    };

    switch (event.type) {
      case 'tool-input-start':
        this.dispatchRealtimePayload({
          event: chatStreamEventKinds.toolInputStarted,
          ...basePayload,
        });
        return;
      case 'tool-input-delta':
        this.dispatchRealtimePayload({
          event: chatStreamEventKinds.toolInputDelta,
          ...basePayload,
          inputTextDelta: event.inputTextDelta,
        });
        return;
      case 'tool-input-finished':
        this.dispatchRealtimePayload({
          event: chatStreamEventKinds.toolInputFinished,
          ...basePayload,
          input: event.input,
        });
        return;
      case 'tool-result':
        this.dispatchRealtimePayload({
          event: chatStreamEventKinds.toolResult,
          ...basePayload,
          input: event.input,
          output: event.output,
          preliminary: event.preliminary,
        });
        return;
      case 'tool-error':
        this.dispatchRealtimePayload({
          event: chatStreamEventKinds.toolError,
          ...basePayload,
          input: event.input,
          error: event.error,
        });
        return;
      default:
        return;
    }
  }

  private getToolTitle(toolName: string): string | undefined {
    if (toolName === editorToolNames.delegateTextOverlayTask) {
      return 'Set up text specialist';
    }
    if (toolName === editorToolNames.delegateImagePictureTask) {
      return 'Set up image specialist';
    }
    if (toolName === editorToolNames.delegateShapeOverlayTask) {
      return 'Set up shape specialist';
    }
    if (toolName === editorToolNames.delegateMotionDesignTask) {
      return 'Set up motion design specialist';
    }
    if (toolName === editorToolNames.selectTimelineItems) {
      return 'Select timeline items';
    }
    if (toolName === editorToolNames.placeLibraryAssetsOnTimeline) {
      return 'Place library assets on timeline';
    }
    if (toolName === editorToolNames.placeTimelineItems) {
      return 'Place timeline items';
    }
    if (toolName === editorToolNames.removeSilences) {
      return 'Remove silences';
    }
    if (toolName === editorToolNames.setCaptions) {
      return 'Set captions';
    }
    if (toolName === editorToolNames.addTextItems) {
      return 'Add text items';
    }
    if (toolName === editorToolNames.updateTextItems) {
      return 'Update text items';
    }
    if (toolName === editorToolNames.addImageItems) {
      return 'Add image items';
    }
    if (toolName === editorToolNames.updateImageItems) {
      return 'Update image items';
    }
    if (toolName === editorToolNames.addShapeItems) {
      return 'Add shape items';
    }
    if (toolName === editorToolNames.updateShapeItems) {
      return 'Update shape items';
    }
    if (toolName === editorToolNames.getMotionDesignTemplates) {
      return 'Get motion design templates';
    }
    if (toolName === editorToolNames.getMotionDesignPresetDetails) {
      return 'Get motion design preset details';
    }
    if (toolName === editorToolNames.addMotionDesignItems) {
      return 'Add motion design items';
    }
    if (toolName === editorToolNames.updateMotionDesignItems) {
      return 'Update motion design items';
    }
    if (toolName === editorToolNames.getProjectState) {
      return 'Get project state';
    }
    if (toolName === editorToolNames.getItemsData) {
      return 'Get items data';
    }
    if (toolName === editorToolNames.getLibraryAssetsData) {
      return 'Get library assets data';
    }
    if (toolName === editorToolNames.deleteItems) {
      return 'Delete items';
    }
    if (toolName === editorToolNames.cutFrameRange) {
      return 'Cut frame range';
    }
    if (toolName === aiGatewayToolNames.cutTimeRanges) {
      return 'Cut time ranges';
    }
    if (toolName === editorToolNames.getTranscription) {
      return 'Get transcription';
    }
    if (toolName === aiGatewayToolNames.investigateTranscription) {
      return 'Set up transcription subagent';
    }
    if (toolName === editorToolNames.createPlan) {
      return 'Create plan';
    }
    if (toolName === editorToolNames.updatePlan) {
      return 'Update plan';
    }

    return undefined;
  }

  private dispatchRealtimePayload(payload: ChatStreamPayload): void {
    this.realtimeService.dispatchMessage({
      type: realtimeMessageTypes.chat,
      payload,
      timestamp: new Date().toISOString(),
    });
  }

  private mapUsage(usage?: LanguageModelUsage): ChatStreamUsage | undefined {
    if (!usage) {
      return undefined;
    }

    const reasoningTokens = getReasoningTokens(usage);
    const cachedInputTokens = getCachedInputTokens(usage);

    return {
      totalTokens: usage.totalTokens,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      reasoningTokens,
      cachedInputTokens,
    };
  }
}
