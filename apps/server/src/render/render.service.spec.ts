import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AwsService } from '../aws/aws.service';
import { RenderService } from './render.service';

describe('RenderService', () => {
  let service: RenderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RenderService,
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
      ],
    }).compile();

    service = module.get<RenderService>(RenderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
