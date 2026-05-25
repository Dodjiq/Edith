import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ElevenlabsService } from './elevenlabs.service';

describe('ElevenlabsService', () => {
  let service: ElevenlabsService;
  let convert: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElevenlabsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<ElevenlabsService>(ElevenlabsService);
    convert = jest.fn();
    (service as unknown as { client: { speechToText: { convert: jest.Mock } } }).client = {
      speechToText: { convert },
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('transcribes buffers with Scribe v2 word timestamps', async () => {
    const buffer = Buffer.from('audio');
    convert.mockResolvedValue({
      audioDurationSecs: 1.2,
      words: [
        { text: 'Hello', start: 0, end: 0.4, type: 'word', logprob: Math.log(0.9) },
        { text: ' ', type: 'spacing', logprob: 0 },
        { text: 'world.', start: 0.5, end: 1.1, type: 'word', logprob: Math.log(0.8) },
      ],
    });

    const result = await service.transcribeFromBuffer({ buffer, mimeType: 'audio/mpeg' });

    expect(convert).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'scribe_v2',
        timestampsGranularity: 'word',
        file: expect.objectContaining({
          data: buffer,
          filename: 'audio.mp3',
          contentType: 'audio/mpeg',
          contentLength: buffer.length,
        }),
      }),
    );
    expect(result.captions).toHaveLength(2);
    expect(result.captions[0]).toMatchObject({
      text: 'Hello',
      startMs: 0,
      endMs: 400,
      timestampMs: 200,
    });
    expect(result.captions[0].confidence).toBeCloseTo(0.9);
    expect(result.captions[1]).toMatchObject({
      text: 'world.',
      startMs: 500,
      endMs: 1100,
      timestampMs: 800,
    });
    expect(result.captions[1].confidence).toBeCloseTo(0.8);
    expect(result.metadata).toMatchObject({
      provider: 'elevenlabs',
      modelId: 'scribe_v2',
      wordCount: 2,
    });
    expect(result.metadata.generalization).toContain(
      'ElevenLabs Scribe v2 produced 2 timestamped spoken word',
    );
  });

  it('transcribes cloud URLs with an optional language hint', async () => {
    convert.mockResolvedValue({ words: [] });

    await service.transcribeFromUrl({
      url: 'https://example.com/audio.mp3',
      originalLanguage: 'fra',
    });

    expect(convert).toHaveBeenCalledWith({
      diarize: true,
      modelId: 'scribe_v2',
      tagAudioEvents: true,
      timestampsGranularity: 'word',
      languageCode: 'fra',
      cloudStorageUrl: 'https://example.com/audio.mp3',
    });
  });
});
