import { Injectable, Logger } from '@nestjs/common';
import { getSilentParts } from '@remotion/renderer';
import { DetectSilenceRequest, DetectSilenceResponse } from 'api-types';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import type { ReadableStream as NodeReadableStream } from 'stream/web';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import fsPromises from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { resolve, dirname } from 'node:path';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  async detectSilence({
    assetUrl,
    noiseThresholdInDecibels = -28,
    minDurationInSeconds = 0.35,
  }: DetectSilenceRequest): Promise<DetectSilenceResponse> {
    const tempFile = resolve(`temporary-files/input/silence-${randomUUID()}.mp3`);
    await fsPromises.mkdir(dirname(tempFile), { recursive: true });

    try {
      this.logger.debug(`Downloading audio track to ${tempFile}`);
      await this.downloadToFile(assetUrl, tempFile);
      this.logger.debug(`Downloaded audio track.`);

      this.logger.debug(`Detecting silence...`);
      const { silentParts, audibleParts, durationInSeconds } = await getSilentParts({
        src: tempFile,
        noiseThresholdInDecibels,
        minDurationInSeconds,
        logLevel: 'error',
      });
      this.logger.debug(`Detected silence.`);

      return {
        silentParts,
        audibleParts,
        durationInSeconds,
      };
    } catch (error) {
      this.logger.error(`Failed to detect silence: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      if (existsSync(tempFile)) fsPromises.unlink(tempFile).catch(() => undefined);
    }
  }

  private async downloadToFile(url: string, destination: string) {
    const primary = await this.tryDownload(url, destination);
    if (primary) return;

    const signedUrl = await this.getSignedReadUrl(url);
    if (!signedUrl) {
      throw new Error('Failed to download asset audio track');
    }

    const fallback = await this.tryDownload(signedUrl, destination);
    if (!fallback) {
      throw new Error('Failed to download asset audio track');
    }
  }

  private async tryDownload(url: string, destination: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      if (!response.ok || !response.body) {
        this.logger.debug(`Download failed: HTTP ${response.status} ${response.statusText} for ${url.slice(0, 80)}...`);
        return false;
      }

      const nodeStream = Readable.fromWeb(response.body as unknown as NodeReadableStream);
      await pipeline(nodeStream, createWriteStream(destination));
      if (!existsSync(destination)) {
        this.logger.debug(`Download failed: file not written to ${destination}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.debug(`Download error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  private getAwsConfig() {
    const bucket = process.env.REMOTION_AWS_BUCKET_NAME;
    const region = process.env.REMOTION_AWS_REGION;
    const accessKeyId = process.env.REMOTION_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.REMOTION_AWS_SECRET_ACCESS_KEY;

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      return null;
    }

    return {
      bucket,
      region,
      accessKeyId,
      secretAccessKey,
    };
  }

  private parseKeyFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
      return pathname || null;
    } catch {
      return null;
    }
  }

  private resolveCandidateKeys(key: string | null): string[] {
    if (!key) return [];
    const trimmed = key.trim();
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

  private async getSignedReadUrl(originalUrl: string): Promise<string | null> {
    const aws = this.getAwsConfig();
    if (!aws) {
      this.logger.warn('AWS credentials missing; cannot sign download URL');
      return null;
    }

    const key = this.parseKeyFromUrl(originalUrl);
    const candidateKeys = this.resolveCandidateKeys(key);

    if (candidateKeys.length === 0) {
      this.logger.warn('Could not parse S3 object key from asset URL');
      return null;
    }

    this.logger.debug(`Signing URL - Bucket: ${aws.bucket}, Keys: ${candidateKeys.join(', ')}, Region: ${aws.region}`);

    const client = new S3Client({
      region: aws.region as string,
      credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
      },
      useAccelerateEndpoint: originalUrl.includes('s3-accelerate'),
    });

    for (const candidateKey of candidateKeys) {
      try {
        const command = new GetObjectCommand({
          Bucket: aws.bucket,
          Key: candidateKey,
        });

        // 1 hour expiration - enough time for download and processing
        const signed = await getSignedUrl(client, command, { expiresIn: 3600 });
        this.logger.debug(`Signed URL for key: ${candidateKey}`);
        return signed;
      } catch (error) {
        this.logger.debug(
          `Failed to sign download URL for key ${candidateKey}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.error('Failed to sign download URL for all candidate keys');
    return null;
  }
}
