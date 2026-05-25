import { Test, TestingModule } from '@nestjs/testing';
import { VideoAnalysisService } from './video-analysis.service';
import { AwsService } from '../aws/aws.service';
import { PromptsService } from '../prompts/prompts.service';
import { RealtimeService } from '../realtime/realtime.service';
import { TwelveLabsService } from './twelve-labs/twelve-labs.service';

describe('VideoAnalysisService', () => {
  let service: VideoAnalysisService;
  let awsService: { getPresignedGetUrl: jest.Mock };
  let promptsService: { getVideoAnalysisCombinedPrompt: jest.Mock };
  let realtimeService: { dispatchMessage: jest.Mock };
  let twelveLabsService: { indexVideoFromUrl: jest.Mock; analyzeVideo: jest.Mock };

  beforeEach(async () => {
    awsService = { getPresignedGetUrl: jest.fn() };
    promptsService = { getVideoAnalysisCombinedPrompt: jest.fn() };
    realtimeService = { dispatchMessage: jest.fn() };
    twelveLabsService = { indexVideoFromUrl: jest.fn(), analyzeVideo: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoAnalysisService,
        {
          provide: AwsService,
          useValue: awsService,
        },
        {
          provide: PromptsService,
          useValue: promptsService,
        },
        {
          provide: RealtimeService,
          useValue: realtimeService,
        },
        {
          provide: TwelveLabsService,
          useValue: twelveLabsService,
        },
      ],
    }).compile();

    service = module.get<VideoAnalysisService>(VideoAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('runs prompt analysis with the presigned video URL and keeps the indexed reference', async () => {
    awsService.getPresignedGetUrl.mockResolvedValue('https://s3.example.com/video.mp4');
    promptsService.getVideoAnalysisCombinedPrompt.mockReturnValue('combined prompt');
    twelveLabsService.indexVideoFromUrl.mockResolvedValue({
      indexId: 'index-1',
      taskId: 'task-1',
      videoId: 'video-1',
    });
    twelveLabsService.analyzeVideo.mockResolvedValue(
      JSON.stringify({
        macroView: 'macro',
        causalLogic: 'causal',
        sequentialSummary: 'sequence',
        socket: 'socket',
        plug: 'plug',
      }),
    );

    await (
      service as unknown as {
        runVideoAnalysis: (params: { assetId: string; fileKey: string; projectId?: string }) => Promise<void>;
      }
    ).runVideoAnalysis({
      assetId: 'asset-1',
      fileKey: 'uploads/video.mp4',
      projectId: 'project-1',
    });

    expect(twelveLabsService.indexVideoFromUrl).toHaveBeenCalledWith({
      videoUrl: 'https://s3.example.com/video.mp4',
      projectId: 'project-1',
    });
    expect(twelveLabsService.analyzeVideo).toHaveBeenCalledWith({
      videoUrl: 'https://s3.example.com/video.mp4',
      prompt: 'combined prompt',
      responseFormat: expect.objectContaining({ type: 'json_schema' }),
    });
    expect(twelveLabsService.analyzeVideo.mock.calls[0][0]).not.toHaveProperty('videoId');
    expect(realtimeService.dispatchMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          assetId: 'asset-1',
          twelveLabs: { indexId: 'index-1', videoId: 'video-1' },
          summary: {
            macroView: 'macro',
            causalLogic: 'causal',
            sequentialSummary: 'sequence',
            socket: 'socket',
            plug: 'plug',
          },
        }),
      }),
    );
  });
});
