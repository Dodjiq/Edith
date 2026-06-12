import { ElevenLabs, ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Caption, TranscriptionMetadata } from 'api-types';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { basename } from 'path';

type ScribeRequestBase = Pick<
  ElevenLabs.BodySpeechToTextV1SpeechToTextPost,
  'diarize' | 'languageCode' | 'modelId' | 'tagAudioEvents' | 'timestampsGranularity'
>;

export type ElevenlabsTranscriptionResult = {
  captions: Caption[];
  metadata: TranscriptionMetadata;
};

@Injectable()
export class ElevenlabsService {
  private readonly logger = new Logger(ElevenlabsService.name);
  private readonly client: ElevenLabsClient | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ELEVENLABS_API_KEY');
    if (apiKey) {
      this.client = new ElevenLabsClient({ apiKey });
    } else {
      this.logger.debug('ELEVENLABS_API_KEY not configured — transcription disabled');
    }
  }

  private requireClient(): ElevenLabsClient {
    if (!this.client) throw new Error('ELEVENLABS_API_KEY is not configured');
    return this.client;
  }

  async transcribe({
    input,
    originalLanguage = 'auto-detect',
  }: {
    input: string | Buffer;
    originalLanguage?: string;
  }): Promise<ElevenlabsTranscriptionResult> {
    if (typeof input !== 'string') {
      return this.transcribeFromBuffer({ buffer: input, originalLanguage });
    }

    try {
      this.logger.debug(`Transcribing local file with ElevenLabs Scribe v2: ${input}`);
      const response = await this.requireClient().speechToText.convert({
        ...this.getScribeRequestBase(originalLanguage),
        file: {
          path: input,
          filename: basename(input),
          contentType: 'audio/mpeg',
        },
      });

      this.logger.debug(
        `ElevenLabs Scribe v2 transcription completed: ${response.words?.length ?? 0} tokens`,
      );
      return this.transformToResult(response);
    } catch (error: unknown) {
      return this.handleTranscriptionError(error, 'file');
    } finally {
      if (existsSync(input)) {
        await unlink(input).catch(() => undefined);
      }
    }
  }

  async transcribeFromUrl({
    url,
    originalLanguage = 'auto-detect',
  }: {
    url: string;
    originalLanguage?: string;
  }): Promise<ElevenlabsTranscriptionResult> {
    this.logger.log('Transcribing cloud URL with ElevenLabs Scribe v2...');

    try {
      const response = await this.requireClient().speechToText.convert({
        ...this.getScribeRequestBase(originalLanguage),
        cloudStorageUrl: url,
      });

      this.logger.log(`ElevenLabs Scribe v2 transcription complete: ${response.words?.length ?? 0} tokens`);
      return this.transformToResult(response);
    } catch (error: unknown) {
      return this.handleTranscriptionError(error, 'URL');
    }
  }

  async transcribeFromBuffer({
    buffer,
    mimeType = 'audio/mpeg',
    originalLanguage = 'auto-detect',
  }: {
    buffer: Buffer;
    mimeType?: string;
    originalLanguage?: string;
  }): Promise<ElevenlabsTranscriptionResult> {
    const totalStart = Date.now();
    this.logger.log(
      `[TIMING] Starting ElevenLabs Scribe v2 transcription: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
    );

    try {
      const response = await this.requireClient().speechToText.convert({
        ...this.getScribeRequestBase(originalLanguage),
        file: {
          data: buffer,
          filename: 'audio.mp3',
          contentType: mimeType,
          contentLength: buffer.length,
        },
      });

      const totalDuration = Date.now() - totalStart;
      const audioLengthSec = response.audioDurationSecs ?? 0;
      this.logger.log(
        `[TIMING] ElevenLabs Scribe v2 complete: ${response.words?.length ?? 0} tokens in ${(totalDuration / 1000).toFixed(2)}s ` +
          `(audio length: ${audioLengthSec.toFixed(1)}s)`,
      );

      return this.transformToResult(response);
    } catch (error: unknown) {
      return this.handleTranscriptionError(error, 'buffer');
    }
  }

  private getScribeRequestBase(originalLanguage: string): ScribeRequestBase {
    const languageCode =
      originalLanguage === 'auto-detect' || originalLanguage === 'auto' ? undefined : originalLanguage;

    return {
      diarize: true,
      modelId: 'scribe_v2',
      tagAudioEvents: true,
      timestampsGranularity: 'word',
      ...(languageCode ? { languageCode } : {}),
    };
  }

  private transformToResult(
    response: ElevenLabs.SpeechToTextChunkResponseModel,
  ): ElevenlabsTranscriptionResult {
    const captions = this.transformToCaptions(response);
    const words = response.words ?? [];
    const confidences = words
      .filter((word) => word.type === 'word')
      .map((word) => this.logprobToConfidence(word.logprob))
      .filter((confidence): confidence is number => typeof confidence === 'number');
    const speakerIds = Array.from(
      new Set(
        words.map((word) => word.speakerId).filter((speakerId): speakerId is string => Boolean(speakerId)),
      ),
    );
    const audioEventCount = words.filter((word) => word.type === 'audio_event').length;
    const fullText = response.text?.trim();
    const averageConfidence =
      confidences.length > 0
        ? confidences.reduce((sum, confidence) => sum + confidence, 0) / confidences.length
        : null;

    const metadata: TranscriptionMetadata = {
      provider: 'elevenlabs',
      modelId: 'scribe_v2',
      generatedAt: new Date().toISOString(),
      wordCount: captions.length,
      averageConfidence,
      ...(fullText ? { fullText } : {}),
      ...(response.languageCode ? { languageCode: response.languageCode } : {}),
      ...(typeof response.languageProbability === 'number'
        ? { languageProbability: response.languageProbability }
        : {}),
      ...(typeof response.audioDurationSecs === 'number'
        ? { audioDurationSeconds: response.audioDurationSecs }
        : {}),
      ...(response.transcriptionId ? { transcriptionId: response.transcriptionId } : {}),
      ...(speakerIds.length > 0 ? { speakerIds } : {}),
      ...(audioEventCount > 0 ? { audioEventCount } : {}),
    };

    return {
      captions,
      metadata: {
        ...metadata,
        generalization: this.buildGeneralization(metadata),
      },
    };
  }

  private transformToCaptions(response: ElevenLabs.SpeechToTextChunkResponseModel): Caption[] {
    const words = response.words ?? [];
    if (words.length === 0) {
      this.logger.log('No speech detected in audio - returning empty captions');
      return [];
    }

    return words.flatMap((word) => {
      if (word.type !== 'word' || !word.text.trim()) {
        return [];
      }

      if (typeof word.start !== 'number' || typeof word.end !== 'number') {
        return [];
      }

      const startMs = Math.max(0, Math.round(word.start * 1000));
      const endMs = Math.max(startMs, Math.round(word.end * 1000));

      return [
        {
          text: word.text,
          startMs,
          endMs,
          timestampMs: Math.round((startMs + endMs) / 2),
          confidence: this.logprobToConfidence(word.logprob),
        },
      ];
    });
  }

  private logprobToConfidence(logprob: number): number | null {
    if (!Number.isFinite(logprob)) {
      return null;
    }

    return Math.max(0, Math.min(1, Math.exp(logprob)));
  }

  private buildGeneralization(metadata: TranscriptionMetadata): string {
    const details = [
      `ElevenLabs Scribe v2 produced ${metadata.wordCount} timestamped spoken word(s).`,
      metadata.languageCode
        ? `Detected language: ${metadata.languageCode}${
            typeof metadata.languageProbability === 'number'
              ? ` (${Math.round(metadata.languageProbability * 100)}% confidence)`
              : ''
          }.`
        : undefined,
      typeof metadata.audioDurationSeconds === 'number'
        ? `Audio duration: ${metadata.audioDurationSeconds.toFixed(2)} seconds.`
        : undefined,
      metadata.speakerIds?.length ? `Detected speaker labels: ${metadata.speakerIds.join(', ')}.` : undefined,
      metadata.audioEventCount
        ? `Detected ${metadata.audioEventCount} non-speech audio event(s).`
        : undefined,
      typeof metadata.averageConfidence === 'number'
        ? `Average word confidence: ${Math.round(metadata.averageConfidence * 100)}%.`
        : undefined,
    ].filter(Boolean);

    const excerpt = metadata.fullText
      ? this.truncateText(metadata.fullText, 700)
      : 'No transcript text was returned.';
    return `${details.join(' ')} Transcript excerpt: "${excerpt}"`;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength - 1).trimEnd()}…`;
  }

  private handleTranscriptionError(error: unknown, source: string): ElevenlabsTranscriptionResult {
    const errorMessage = this.extractErrorMessage(error);
    const normalizedMessage = errorMessage.toLowerCase();

    if (normalizedMessage.includes('no speech')) {
      this.logger.log(`No speech detected in ${source} audio - returning empty transcription`);
      return {
        captions: [],
        metadata: {
          provider: 'elevenlabs',
          modelId: 'scribe_v2',
          generatedAt: new Date().toISOString(),
          wordCount: 0,
          generalization: `ElevenLabs Scribe v2 processed the ${source} audio and found no speech to transcribe.`,
        },
      };
    }

    if (
      normalizedMessage.includes('401') ||
      normalizedMessage.includes('unauthorized') ||
      normalizedMessage.includes('invalid api key')
    ) {
      this.logger.error('ElevenLabs API authentication failed - check ELEVENLABS_API_KEY');
      throw new Error('ElevenLabs API authentication failed');
    }

    this.logger.error(`ElevenLabs Scribe v2 ${source} transcription error: ${errorMessage}`);
    throw new Error(`Transcription failed: ${errorMessage}`);
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      const errorObject = error as Record<string, unknown>;
      return errorObject.message?.toString() || errorObject.error?.toString() || JSON.stringify(error);
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unknown error';
  }
}
