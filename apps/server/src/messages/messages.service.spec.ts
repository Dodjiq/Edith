import { Test, TestingModule } from '@nestjs/testing';
import { chatStreamEventKinds, editorToolNames, realtimeMessageTypes } from 'api-types';
import { AiGatewayService, AiGatewayMessageResult } from '../ai-gateway/ai-gateway.service';
import { MessagesService } from './messages.service';
import { RealtimeService } from '../realtime/realtime.service';

describe('MessagesService', () => {
  let service: MessagesService;
  let gateway: AiGatewayService;
  const prompt = 'respond politely';
  const messageId = 'test-message-id';
  const gatewayResponse: AiGatewayMessageResult = {
    message: 'Sure!',
    reasoning: 'Thinking',
    modelId: 'openai/gpt-5.2',
    modelSequence: ['openai/gpt-5.2'],
    usage: {
      inputTokens: 10,
      inputTokenDetails: {
        noCacheTokens: 8,
        cacheReadTokens: 2,
        cacheWriteTokens: 0,
      },
      outputTokens: 5,
      outputTokenDetails: {
        textTokens: 2,
        reasoningTokens: 3,
      },
      totalTokens: 15,
      reasoningTokens: 3,
      cachedInputTokens: 2,
    },
  };
  const realtimeDispatchMock = jest.fn();
  const streamPromptForAIEditing = jest.fn();

  beforeEach(async () => {
    realtimeDispatchMock.mockClear();
    streamPromptForAIEditing.mockReset();

    streamPromptForAIEditing.mockImplementation(async ({ onTextDelta, onReasoningDelta, onComplete }) => {
      onReasoningDelta?.('Reasoning ');
      onTextDelta?.('First chunk. ');
      onTextDelta?.('Second chunk.');
      onComplete?.(gatewayResponse);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: AiGatewayService,
          useValue: {
            streamPromptForAIEditing,
          },
        },
        {
          provide: RealtimeService,
          useValue: {
            dispatchMessage: realtimeDispatchMock,
          },
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    gateway = module.get<AiGatewayService>(AiGatewayService);
  });

  it('should dispatch streaming events for chatbot messages', async () => {
    const response = await service.sendMessage([
      {
        id: messageId,
        role: 'user',
        parts: [{ type: 'text', text: prompt, state: 'done' }],
        metadata: { messageIndex: 0, mode: 'fast' },
      },
    ]);

    expect(response).toEqual({ messageId, status: 'accepted' });
    expect(gateway.streamPromptForAIEditing).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            id: messageId,
            role: 'user',
            parts: [{ type: 'text', text: prompt, state: 'done' }],
            metadata: { messageIndex: 0, mode: 'fast' },
          },
        ],
        mode: 'fast',
      }),
    );

    const dispatchedEvents = realtimeDispatchMock.mock.calls.map(([message]) => message);
    expect(dispatchedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: realtimeMessageTypes.chat,
          payload: expect.objectContaining({ event: chatStreamEventKinds.textDelta }),
        }),
        expect.objectContaining({
          type: realtimeMessageTypes.chat,
          payload: expect.objectContaining({ event: chatStreamEventKinds.reasoningDelta }),
        }),
        expect.objectContaining({
          type: realtimeMessageTypes.chat,
          payload: expect.objectContaining({ event: chatStreamEventKinds.completed, messageId }),
        }),
      ]),
    );

    const completedEvent = dispatchedEvents.find(
      (event) => event.payload?.event === chatStreamEventKinds.completed,
    );
    expect(completedEvent.payload).toMatchObject({
      message: gatewayResponse.message,
      reasoning: gatewayResponse.reasoning,
      modelId: gatewayResponse.modelId,
      modelSequence: gatewayResponse.modelSequence,
      usage: {
        inputTokens: gatewayResponse.usage?.inputTokens,
        outputTokens: gatewayResponse.usage?.outputTokens,
        totalTokens: gatewayResponse.usage?.totalTokens,
        reasoningTokens: gatewayResponse.usage?.reasoningTokens,
        cachedInputTokens: gatewayResponse.usage?.cachedInputTokens,
      },
    });
  });

  it('labels shape specialist tool events', async () => {
    streamPromptForAIEditing.mockImplementationOnce(async ({ onToolEvent }) => {
      onToolEvent?.({
        type: 'tool-input-start',
        toolName: editorToolNames.delegateShapeOverlayTask,
        toolCallId: 'shape-tool-1',
      });
    });

    await service.sendMessage([
      {
        id: messageId,
        role: 'user',
        parts: [{ type: 'text', text: prompt, state: 'done' }],
        metadata: { messageIndex: 0, mode: 'fast' },
      },
    ]);

    expect(realtimeDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.chat,
        payload: expect.objectContaining({
          event: chatStreamEventKinds.toolInputStarted,
          toolName: editorToolNames.delegateShapeOverlayTask,
          title: 'Set up shape specialist',
        }),
      }),
    );
  });

  it('labels motion design specialist tool events', async () => {
    streamPromptForAIEditing.mockImplementationOnce(async ({ onToolEvent }) => {
      onToolEvent?.({
        type: 'tool-input-start',
        toolName: editorToolNames.delegateMotionDesignTask,
        toolCallId: 'motion-tool-1',
      });
    });

    await service.sendMessage([
      {
        id: messageId,
        role: 'user',
        parts: [{ type: 'text', text: prompt, state: 'done' }],
        metadata: { messageIndex: 0, mode: 'fast' },
      },
    ]);

    expect(realtimeDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.chat,
        payload: expect.objectContaining({
          event: chatStreamEventKinds.toolInputStarted,
          toolName: editorToolNames.delegateMotionDesignTask,
          title: 'Set up motion design specialist',
        }),
      }),
    );
  });

  it('forwards subagent debug events', async () => {
    streamPromptForAIEditing.mockImplementationOnce(async ({ onSubagentDebugEvent }) => {
      onSubagentDebugEvent?.({
        type: 'reasoning',
        subagentName: 'text-overlay-specialist',
        parentToolCallId: 'delegate-text-1',
        modelId: 'openai/gpt-5.2',
        stepNumber: 0,
        reasoning: 'Checking timeline context.',
        createdAt: '2026-05-19T12:00:00.000Z',
      });
    });

    await service.sendMessage([
      {
        id: messageId,
        role: 'user',
        parts: [{ type: 'text', text: prompt, state: 'done' }],
        metadata: { messageIndex: 0, mode: 'fast' },
      },
    ]);

    expect(realtimeDispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: realtimeMessageTypes.chat,
        payload: expect.objectContaining({
          event: chatStreamEventKinds.subagentDebug,
          messageId,
          subagentEvent: expect.objectContaining({
            subagentName: 'text-overlay-specialist',
            reasoning: 'Checking timeline context.',
          }),
        }),
      }),
    );
  });
});
