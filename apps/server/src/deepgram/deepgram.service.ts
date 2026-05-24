import { Deepgram, DeepgramClient } from '@deepgram/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { readFile, unlink } from 'fs/promises';

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

export interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
}

export interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

export interface DeepgramResult {
  channels: DeepgramChannel[];
}

export interface DeepgramResponse {
  results: DeepgramResult;
  metadata: {
    duration: number;
    channels: number;
  };
}

@Injectable()
export class DeepgramService {
  private readonly logger = new Logger(DeepgramService.name);
  private readonly deepgram: DeepgramClient;

  constructor(private configService: ConfigService) {
    const deepgramKey = this.configService.get<string>('DEEPGRAM_API_KEY');
    if (!deepgramKey) {
      throw new Error('DEEPGRAM_API_KEY is not defined');
    }

    this.deepgram = new DeepgramClient({ apiKey: deepgramKey });
  }

  async transcribe({
    input,
    originalLanguage = 'auto-detect',
  }: {
    input: string | Buffer;
    originalLanguage?: string;
  }): Promise<DeepgramResponse> {
    this.logger.debug('Transcribing audio with Deepgram...');

    try {
      const deepgramPayload = typeof input === 'string' ? await readFile(input) : input;

      const options: Deepgram.listen.v1.MediaTranscribeRequestOctetStream = {
        model: 'nova-3',
        detect_language: originalLanguage === 'auto-detect',
        smart_format: true,
        punctuate: true,
        utterances: true,
        utt_split: 0.6,
        diarize: false,
        filler_words: true,
      };

      this.logger.debug(`Transcription options: ${JSON.stringify(options)}`);
      const request =
        originalLanguage !== 'auto-detect' ? { ...options, language: originalLanguage } : options;
      const result = await this.deepgram.listen.v1.media.transcribeFile(deepgramPayload, request);

      this.logger.debug('Transcription completed.');
      return result as DeepgramResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to transcribe audio: ${errorMessage}`);
    } finally {
      // Clean up temp file if input was a file path
      if (typeof input === 'string' && existsSync(input)) {
        await unlink(input).catch(() => undefined);
      }
    }
  }
}
