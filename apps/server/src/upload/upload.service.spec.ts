import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AwsService } from '../aws/aws.service';
import { RealtimeService } from '../realtime/realtime.service';
import { SpeechmaticsService } from '../speechmatics/speechmatics.service';
import { VideoAnalysisService } from '../video-analysis/video-analysis.service';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
        {
          provide: AwsService,
          useValue: {},
        },
        {
          provide: RealtimeService,
          useValue: {},
        },
        {
          provide: SpeechmaticsService,
          useValue: {},
        },
        {
          provide: VideoAnalysisService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
