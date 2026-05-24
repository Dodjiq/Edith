import { Test, TestingModule } from '@nestjs/testing';
import { VideoAnalysisService } from './video-analysis.service';
import { AwsService } from '../aws/aws.service';
import { PromptsService } from '../prompts/prompts.service';
import { RealtimeService } from '../realtime/realtime.service';
import { TwelveLabsService } from './twelve-labs/twelve-labs.service';

describe('VideoAnalysisService', () => {
  let service: VideoAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoAnalysisService,
        {
          provide: AwsService,
          useValue: { getPresignedGetUrl: jest.fn() },
        },
        {
          provide: PromptsService,
          useValue: { getVideoAnalysisCombinedPrompt: jest.fn() },
        },
        {
          provide: RealtimeService,
          useValue: { dispatchMessage: jest.fn() },
        },
        {
          provide: TwelveLabsService,
          useValue: { indexVideoFromUrl: jest.fn(), analyzeVideo: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<VideoAnalysisService>(VideoAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
