import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PromptsService } from '../prompts/prompts.service';
import { ToolsService } from './tools/tools.service';
import { AiGatewayService } from './ai-gateway.service';

describe('AiGatewayService', () => {
  let service: AiGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiGatewayService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
            getOrThrow: jest.fn().mockReturnValue('test-ai-gateway-key'),
          },
        },
        {
          provide: ToolsService,
          useValue: {},
        },
        {
          provide: PromptsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AiGatewayService>(AiGatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
