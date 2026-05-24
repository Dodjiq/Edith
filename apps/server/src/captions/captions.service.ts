import { Injectable, Logger } from '@nestjs/common';
import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  Caption,
  GenerateCaptionsRequest,
  GenerateCaptionsResponse,
  GetCaptionsRequest,
  GetCaptionsResponse,
} from 'api-types';
import { createWriteStream, existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import { resolve, dirname } from 'path';
import { DeepgramWord } from '../deepgram/deepgram.service';
import { SpeechmaticsService } from '../speechmatics/speechmatics.service';

@Injectable()
export class CaptionsService {
  private readonly logger = new Logger(CaptionsService.name);

  constructor(private readonly speechmaticsService: SpeechmaticsService) {}

  async generateCaptions({ fileKey }: GenerateCaptionsRequest): Promise<GenerateCaptionsResponse> {
    const aws = this.getAwsConfig();
    if (!aws) {
      throw new Error('AWS configuration is missing');
    }

    const candidateKeys = this.resolveCandidateKeys(fileKey);
    if (candidateKeys.length === 0) {
      throw new Error('Invalid file key');
    }

    const client = new S3Client({
      region: aws.region,
      credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
      },
    });

    // Create temp file path
    const tempFilePath = resolve(`temporary-files/input/captions-${randomUUID()}.mp3`);
    await mkdir(dirname(tempFilePath), { recursive: true });

    let resolvedKey: string | null = null;

    for (const candidateKey of candidateKeys) {
      try {
        this.logger.debug(`Trying to fetch audio from S3 with key: ${candidateKey}`);
        const command = new GetObjectCommand({
          Bucket: aws.bucket,
          Key: candidateKey,
        });

        const response = await client.send(command);
        if (response.Body) {
          // Stream S3 response to temp file
          const readableStream = response.Body as Readable;
          await pipeline(readableStream, createWriteStream(tempFilePath));
          resolvedKey = candidateKey;
          this.logger.debug(`Successfully downloaded audio file to: ${tempFilePath}`);
          break;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to fetch audio for key ${candidateKey}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (!resolvedKey || !existsSync(tempFilePath)) {
      throw new Error('No file content received from S3');
    }

    this.logger.debug('Starting transcription with Speechmatics');

    try {
      // Transcribe using SpeechmaticsService (it will also delete the temp file)
      const result = await this.speechmaticsService.transcribe({
        input: tempFilePath,
        originalLanguage: 'auto-detect',
      });

      this.logger.debug(`Transcription completed. Duration: ${result.metadata?.duration}s`);

      // Extract words from the first channel's first alternative
      const words = result.results?.channels?.[0]?.alternatives?.[0]?.words ?? [];
      this.logger.debug(`Found ${words.length} words in transcription`);

      const captions = this.transformWordsToRemotionCaptions(words);

      // Delete S3 file after processing
      await this.deleteS3File(client, aws.bucket, resolvedKey);

      this.logger.debug(`Generated ${captions.length} captions, uploading to S3...`);

      // Upload captions JSON to S3 and return the key (frontend fetches via backend proxy)
      const captionsKey = await this.uploadCaptionsToS3(client, aws.bucket, captions);

      return { captionsKey, captionsCount: captions.length };
    } catch (error) {
      this.logger.error(`Transcription failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getCaptions({ captionsKey }: GetCaptionsRequest): Promise<GetCaptionsResponse> {
    const aws = this.getAwsConfig();
    if (!aws) {
      throw new Error('AWS configuration is missing');
    }

    const client = new S3Client({
      region: aws.region,
      credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
      },
    });

    try {
      const response = await client.send(
        new GetObjectCommand({
          Bucket: aws.bucket,
          Key: captionsKey,
        }),
      );

      if (!response.Body) {
        throw new Error('No captions data found');
      }

      const bodyString = await response.Body.transformToString();
      const captions = JSON.parse(bodyString) as Caption[];

      this.logger.debug(`Fetched ${captions.length} captions from S3: ${captionsKey}`);
      return { captions };
    } catch (error) {
      this.logger.error(`Failed to fetch captions: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to fetch captions');
    }
  }

  private async uploadCaptionsToS3(client: S3Client, bucket: string, captions: Caption[]): Promise<string> {
    const captionsKey = `captions/${randomUUID()}.json`;
    const captionsJson = JSON.stringify(captions);

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: captionsKey,
        Body: captionsJson,
        ContentType: 'application/json',
      }),
    );

    this.logger.debug(`Uploaded captions to S3: ${captionsKey}`);
    return captionsKey;
  }

  private async deleteS3File(client: S3Client, bucket: string, s3Key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: s3Key,
      });
      await client.send(deleteCommand);
      this.logger.debug(`Deleted S3 file: ${s3Key}`);
    } catch (error) {
      this.logger.warn(`Failed to delete S3 file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private transformWordsToRemotionCaptions(words: DeepgramWord[]): Caption[] {
    const captions: Caption[] = [];
    let isFirstWord = true;

    for (const word of words) {
      const text = isFirstWord ? (word.punctuated_word ?? word.word) : ` ${word.punctuated_word ?? word.word}`;

      captions.push({
        text,
        startMs: Math.round(word.start * 1000),
        endMs: Math.round(word.end * 1000),
        timestampMs: Math.round(((word.start + word.end) / 2) * 1000),
        confidence: word.confidence,
      });

      isFirstWord = false;
    }

    return captions;
  }

  private getAwsConfig() {
    const bucket = process.env.REMOTION_AWS_BUCKET_NAME;
    const region = process.env.REMOTION_AWS_REGION;
    const accessKeyId = process.env.REMOTION_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.REMOTION_AWS_SECRET_ACCESS_KEY;

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      return null;
    }

    return { bucket, region, accessKeyId, secretAccessKey };
  }

  private resolveCandidateKeys(rawKey: string): string[] {
    const trimmed = rawKey.trim();
    if (!trimmed) return [];

    const candidates = new Set<string>();
    const normalized = trimmed.replace(/^\/+/, '');
    const defaultPrefix = 'projects-assets/';

    if (!normalized.includes('/')) {
      candidates.add(`${defaultPrefix}${normalized}`);
    }

    candidates.add(normalized);
    return Array.from(candidates);
  }
}
