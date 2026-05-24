import { Test, TestingModule } from '@nestjs/testing';
import { AiGatewayService } from '../ai-gateway/ai-gateway.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { RealtimeService } from '../realtime/realtime.service';

describe('MessagesController', () => {
  let controller: MessagesController;
  const prompt = 'Say hello?';
  const streamPromptForAIEditing = jest.fn().mockResolvedValue(undefined);
  const dispatchMessage = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
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
            dispatchMessage,
          },
        },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
  });

  it('should relay requests through ts-rest handler', async () => {
    const handler = await controller.handler();
    const response = await handler.sendMessage({
      body: [
        {
          id: 'test-message-id',
          role: 'user',
          parts: [{ type: 'text', text: prompt, state: 'done' }],
          metadata: { messageIndex: 0, mode: 'fast' },
        },
      ],
      headers: {},
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      messageId: expect.any(String),
      status: 'accepted',
    });
    expect(streamPromptForAIEditing).toHaveBeenCalled();
  });
});
