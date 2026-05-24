import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BatchClient, TranscriptionConfig, DataFetchConfig } from '@speechmatics/batch-client';
import { openAsBlob } from 'node:fs';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { SpeechmaticsResponse, SpeechmaticsResult } from './speechmatics.types';
import { DeepgramResponse, DeepgramWord } from '../deepgram/deepgram.service';
import { Caption } from 'api-types';

// Extend TranscriptionConfig to include missing audio_filtering_config property
interface ExtendedTranscriptionConfig extends TranscriptionConfig {
  audio_filtering_config?: {
    volume_threshold?: number;
  };
}

@Injectable()
export class SpeechmaticsService {
  private readonly logger = new Logger(SpeechmaticsService.name);
  private readonly client: BatchClient;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SPEECHMATICS_API_KEY');
    if (!apiKey) {
      throw new Error('SPEECHMATICS_API_KEY is not defined');
    }

    this.client = new BatchClient({ apiKey, appId: 'ai-video-editor' });
  }

  private getTranscriptionConfig(originalLanguage: string): ExtendedTranscriptionConfig {
    return {
      language: originalLanguage === 'auto-detect' ? 'auto' : originalLanguage,
      operating_point: 'enhanced',
      punctuation_overrides: {
        sensitivity: 0.53,
      },
      enable_entities: true,
      audio_filtering_config: {
        volume_threshold: 1,
      },
    };
  }

  /**
   * Transcribe audio using Speechmatics and return DeepGram-compatible response.
   * This ensures compatibility with existing caption transformation logic.
   */
  async transcribe({
    input,
    originalLanguage = 'auto-detect',
  }: {
    input: string | Buffer;
    originalLanguage?: string;
  }): Promise<DeepgramResponse> {
    this.logger.debug('Transcribing audio with Speechmatics...');

    try {
      // Prepare file for upload
      let file: File;

      if (typeof input === 'string') {
        const blob = await openAsBlob(input);
        const filename = input.split('/').pop() ?? 'audio.mp3';
        file = new File([blob], filename, { type: blob.type || 'audio/mpeg' });
      } else {
        // Convert Buffer to ArrayBuffer for Blob compatibility
        const arrayBuffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        file = new File([blob], 'audio.mp3', { type: 'audio/mpeg' });
      }

      const transcriptionConfig = this.getTranscriptionConfig(originalLanguage);

      const config = {
        type: 'transcription' as const,
        transcription_config: transcriptionConfig,
      };

      this.logger.debug(`Transcription config: ${JSON.stringify(config)}`);

      const response = await this.client.transcribe(file, config, 'json-v2');

      this.logger.debug('Speechmatics transcription completed.');

      // Transform to DeepGram-compatible format
      const speechmaticsResponse = response as SpeechmaticsResponse;
      return this.transformToDeepgramFormat(speechmaticsResponse);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Handle HTML response (usually means API key issue)
      if (errorMessage.includes('not valid JSON')) {
        this.logger.error('Speechmatics API returned HTML instead of JSON - check SPEECHMATICS_API_KEY');
        throw new Error('Speechmatics API authentication failed');
      }

      throw new Error(`Failed to transcribe audio: ${errorMessage}`);
    } finally {
      // Clean up temp file if input was a file path
      if (typeof input === 'string' && existsSync(input)) {
        await unlink(input).catch(() => undefined);
      }
    }
  }

  /**
   * Transcribe audio from a URL using Speechmatics Batch API.
   * Returns word-level captions in the format expected by the editor.
   */
  async transcribeFromUrl({ url }: { url: string }): Promise<Caption[]> {
    this.logger.log('Transcribing from URL with Speechmatics Batch API...');

    try {
      const fetchConfig: DataFetchConfig = { url };

      const transcriptionConfig = this.getTranscriptionConfig('auto');
      const config = { type: 'transcription' as const, transcription_config: transcriptionConfig };

      const response = await this.client.transcribe(fetchConfig, config, 'json-v2');
      const speechmaticsResponse = response as SpeechmaticsResponse;

      this.logger.log(`Speechmatics transcription complete: ${speechmaticsResponse.results?.length ?? 0} results`);

      return this.transformToCaptions(speechmaticsResponse);
    } catch (error: unknown) {
      return this.handleTranscriptionError(error, 'URL');
    }
  }

  /**
   * Transcribe audio from a Buffer using Speechmatics Batch API.
   */
  async transcribeFromBuffer({
    buffer,
    mimeType = 'audio/mpeg',
  }: {
    buffer: Buffer;
    mimeType?: string;
  }): Promise<Caption[]> {
    const totalStart = Date.now();
    this.logger.log(`[TIMING] Starting Speechmatics transcription: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

    try {
      const prepareStart = Date.now();
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: mimeType });
      const file = new File([blob], 'audio.mp3', { type: mimeType });
      this.logger.debug(`[TIMING] File prepared in ${Date.now() - prepareStart}ms`);

      const transcriptionConfig = this.getTranscriptionConfig('auto');
      const config = {
        type: 'transcription' as const,
        transcription_config: transcriptionConfig,
      };

      const apiStart = Date.now();
      this.logger.log('[TIMING] Uploading to Speechmatics API...');
      const response = await this.client.transcribe(file, config, 'json-v2');
      const apiDuration = Date.now() - apiStart;
      const speechmaticsResponse = response as SpeechmaticsResponse;

      const totalDuration = Date.now() - totalStart;
      const audioLengthSec = speechmaticsResponse.job?.duration ?? 0;

      this.logger.log(
        `[TIMING] Speechmatics complete: ${speechmaticsResponse.results?.length ?? 0} results in ${(apiDuration / 1000).toFixed(2)}s ` +
          `(audio length: ${audioLengthSec.toFixed(1)}s, ratio: ${(audioLengthSec / (apiDuration / 1000)).toFixed(2)}x realtime)`,
      );
      this.logger.log(`[TIMING] Total transcribeFromBuffer: ${(totalDuration / 1000).toFixed(2)}s`);

      return this.transformToCaptions(speechmaticsResponse);
    } catch (error: unknown) {
      return this.handleTranscriptionError(error, 'buffer');
    }
  }

  /**
   * Handle transcription errors, returning empty array for "no speech" cases.
   */
  private handleTranscriptionError(error: unknown, source: string): Caption[] {
    // Speechmatics throws an array when no speech is detected
    if (Array.isArray(error) && error.length > 0) {
      const firstError = error[0];
      if (firstError && typeof firstError === 'object' && 'message' in firstError) {
        const errorMessage = String(firstError.message).toLowerCase();
        // Handle various "no speech" scenarios as empty transcription
        if (
          errorMessage.includes('no speech found') ||
          errorMessage.includes('language identification could not identify any language')
        ) {
          this.logger.log(`No speech detected in ${source} audio - returning empty transcription`);
          return [];
        }
      }
    }

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (Array.isArray(error) && error[0]?.message) {
      errorMessage = String(error[0].message);
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      errorMessage = errorObj.message?.toString() || errorObj.error?.toString() || JSON.stringify(error);
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    if (errorMessage.includes('not valid JSON')) {
      this.logger.error('Speechmatics API returned HTML instead of JSON - check SPEECHMATICS_API_KEY');
      throw new Error('Speechmatics API authentication failed');
    }

    this.logger.error(`Speechmatics ${source} transcription error: ${errorMessage}`);
    throw new Error(`Transcription failed: ${errorMessage}`);
  }

  /**
   * Transform Speechmatics response to Caption[] format for the editor.
   * Returns empty array if no speech was detected in the audio.
   */
  private transformToCaptions(response: SpeechmaticsResponse): Caption[] {
    const captions: Caption[] = [];

    // Handle case where no speech was detected (results undefined or empty)
    if (!response.results || response.results.length === 0) {
      this.logger.log('No speech detected in audio - returning empty captions');
      return captions;
    }

    for (const result of response.results) {
      if (result.type !== 'word') continue;

      const alternative = result.alternatives[0];
      if (!alternative) continue;

      captions.push({
        text: alternative.content,
        startMs: Math.round(result.start_time * 1000),
        endMs: Math.round(result.end_time * 1000),
        timestampMs: null,
        confidence: alternative.confidence,
      });
    }

    return captions;
  }

  /**
   * Transform Speechmatics response to DeepGram-compatible format.
   * This ensures the CaptionsService can use the same transformation logic.
   */
  private transformToDeepgramFormat(response: SpeechmaticsResponse): DeepgramResponse {
    const words: DeepgramWord[] = [];

    // Handle case where no speech was detected
    if (!response.results || response.results.length === 0) {
      this.logger.log('No speech detected in audio - returning empty DeepGram response');
      return {
        results: {
          channels: [
            {
              alternatives: [
                {
                  transcript: '',
                  confidence: 0,
                  words: [],
                },
              ],
            },
          ],
        },
        metadata: {
          duration: response.job?.duration ?? 0,
          channels: 1,
        },
      };
    }

    for (const result of response.results) {
      // Only process word results, skip punctuation
      if (result.type !== 'word') continue;

      const alternative = result.alternatives[0];
      if (!alternative) continue;

      words.push({
        word: alternative.content.toLowerCase(),
        start: result.start_time,
        end: result.end_time,
        confidence: alternative.confidence,
        punctuated_word: alternative.content,
      });
    }

    // Apply punctuation to words (attach to previous word)
    this.applyPunctuation(words, response.results);

    return {
      results: {
        channels: [
          {
            alternatives: [
              {
                transcript: words.map((w) => w.punctuated_word ?? w.word).join(' '),
                confidence: words.length > 0 ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length : 0,
                words,
              },
            ],
          },
        ],
      },
      metadata: {
        duration: response.job.duration,
        channels: 1,
      },
    };
  }

  /**
   * Apply punctuation marks to the end of words based on Speechmatics results.
   */
  private applyPunctuation(words: DeepgramWord[], results: SpeechmaticsResult[]): void {
    if (!results || results.length === 0) return;

    for (const result of results) {
      if (result.type !== 'punctuation') continue;
      if (result.attaches_to !== 'previous') continue;

      const punctuation = result.alternatives[0]?.content;
      if (!punctuation) continue;

      // Find the word that ends at or just before the punctuation start time
      const wordIndex = words.findIndex(
        (w) =>
          Math.abs(w.end - result.start_time) < 0.1 || (w.end <= result.start_time && w.end >= result.start_time - 0.2),
      );

      if (wordIndex !== -1 && words[wordIndex].punctuated_word) {
        words[wordIndex].punctuated_word += punctuation;
      }
    }
  }
}
