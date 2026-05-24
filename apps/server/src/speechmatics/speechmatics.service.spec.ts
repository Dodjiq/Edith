import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SpeechmaticsService } from './speechmatics.service';

describe('SpeechmaticsService', () => {
  let service: SpeechmaticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpeechmaticsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<SpeechmaticsService>(SpeechmaticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
