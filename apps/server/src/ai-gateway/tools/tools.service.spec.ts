import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { editorToolNames } from 'api-types';
import { AudioService } from '../../audio/audio.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { ToolsService } from './tools.service';

describe('ToolsService', () => {
  let service: ToolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsService,
        {
          provide: RealtimeService,
          useValue: {
            dispatchMessage: jest.fn(),
          },
        },
        {
          provide: AudioService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-ai-gateway-key'),
          },
        },
      ],
    }).compile();

    service = module.get<ToolsService>(ToolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('exposes only overlay delegators to the main agent', () => {
    const tools = service.getTools({ modelId: 'openai/gpt-5.5' });

    expect(tools[editorToolNames.delegateTextOverlayTask]).toBeDefined();
    expect(tools[editorToolNames.delegateImagePictureTask]).toBeDefined();
    expect(tools[editorToolNames.delegateShapeOverlayTask]).toBeDefined();
    expect(tools[editorToolNames.delegateMotionDesignTask]).toBeDefined();
    expect(tools[editorToolNames.addTextItems]).toBeUndefined();
    expect(tools[editorToolNames.updateTextItems]).toBeUndefined();
    expect(tools[editorToolNames.addImageItems]).toBeUndefined();
    expect(tools[editorToolNames.updateImageItems]).toBeUndefined();
    expect(tools[editorToolNames.addShapeItems]).toBeUndefined();
    expect(tools[editorToolNames.updateShapeItems]).toBeUndefined();
    expect(tools[editorToolNames.getMotionDesignTemplates]).toBeUndefined();
    expect(tools[editorToolNames.getMotionDesignPresetDetails]).toBeUndefined();
    expect(tools[editorToolNames.addMotionDesignItems]).toBeUndefined();
    expect(tools[editorToolNames.updateMotionDesignItems]).toBeUndefined();
  });
});
