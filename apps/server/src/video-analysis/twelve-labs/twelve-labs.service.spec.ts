import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TwelveLabsService } from './twelve-labs.service';

describe('TwelveLabsService', () => {
  let service: TwelveLabsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwelveLabsService,
        {
          provide: ConfigService,
          useValue: { get: () => undefined },
        },
      ],
    }).compile();

    service = module.get<TwelveLabsService>(TwelveLabsService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('retries task creation when TwelveLabs returns video_file_broken', async () => {
    jest.useFakeTimers();

    const create = jest
      .fn()
      .mockRejectedValueOnce({
        body: { code: 'video_file_broken' },
        message: 'BadRequestError Status code: 400 Body: { "code": "video_file_broken" }',
      })
      .mockResolvedValueOnce({ id: 'task-1' });
    const retrieve = jest.fn().mockResolvedValue({ status: 'ready', videoId: 'video-1' });
    const serviceWithInternals = service as unknown as {
      client: unknown;
      getOrCreateIndexId: (args?: { indexName?: string }) => Promise<string>;
    };

    serviceWithInternals.client = {
      tasks: { create, retrieve },
    };
    jest.spyOn(serviceWithInternals, 'getOrCreateIndexId').mockResolvedValue('index-1');

    const resultPromise = service.indexVideoFromUrl({
      videoUrl: 'https://example.com/video.mp4',
      projectId: '1',
    });

    await jest.advanceTimersByTimeAsync(5_000);

    await expect(resultPromise).resolves.toEqual({
      indexId: 'index-1',
      taskId: 'task-1',
      videoId: 'video-1',
    });
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-retryable task creation errors', async () => {
    const error = {
      body: { code: 'parameter_invalid' },
      message: 'BadRequestError Status code: 400 Body: { "code": "parameter_invalid" }',
    };
    const create = jest.fn().mockRejectedValue(error);
    const serviceWithInternals = service as unknown as {
      client: unknown;
      getOrCreateIndexId: (args?: { indexName?: string }) => Promise<string>;
    };

    serviceWithInternals.client = {
      tasks: { create },
    };
    jest.spyOn(serviceWithInternals, 'getOrCreateIndexId').mockResolvedValue('index-1');

    await expect(
      service.indexVideoFromUrl({
        videoUrl: 'https://example.com/video.mp4',
      }),
    ).rejects.toBe(error);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
