import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteAssetRequest,
  UploadProgressPayload,
  realtimeMessageTypes,
  TranscriptionCompletePayload,
} from 'api-types';
import { randomUUID } from 'crypto';
import { AwsService, CompletedPart } from '../aws/aws.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ElevenlabsService } from '../elevenlabs/elevenlabs.service';
import { VideoAnalysisService } from '../video-analysis/video-analysis.service';

type UploadTranscriptionResult = Pick<TranscriptionCompletePayload, 'metadata' | 'transcription'>;

interface ActiveMultipartUpload {
  s3UploadId: string;
  key: string;
  contentType: string;
  fileSize: number;
  createdAt: Date;
}

// Maximum concurrent uploads the client should use
const MAX_CONCURRENCY = 4;
const MAX_FILE_SIZE_MB = 5000; // 5GB

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly mediaProcessorUrl: string;
  private readonly activeUploads = new Map<string, ActiveMultipartUpload>();
  private readonly projectIdMaxLength = 100;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsService: AwsService,
    private readonly realtimeService: RealtimeService,
    private readonly elevenlabsService: ElevenlabsService,
    private readonly videoAnalysisService: VideoAnalysisService,
  ) {
    let rustUrl = this.configService.get<string>('MEDIA_PROCESSOR_URL') ?? 'http://127.0.0.1:4005';
    rustUrl = rustUrl.trim();
    if (!rustUrl.startsWith('http://') && !rustUrl.startsWith('https://')) {
      rustUrl = `http://${rustUrl}`;
    }
    try {
      const parsedRustUrl = new URL(rustUrl);
      if (parsedRustUrl.hostname === 'localhost') {
        parsedRustUrl.hostname = '127.0.0.1';
      }
      rustUrl = parsedRustUrl.toString().replace(/\/+$/, '');
    } catch {
      this.logger.warn(`Invalid MEDIA_PROCESSOR_URL, using raw value: ${rustUrl}`);
    }
    this.mediaProcessorUrl = rustUrl;
    this.logger.log(`Media processor URL: ${this.mediaProcessorUrl}`);
  }

  validateFileSize(size: number): { valid: boolean; message?: string } {
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (size > maxBytes) {
      return {
        valid: false,
        message: `File may not be over ${MAX_FILE_SIZE_MB}MB. Yours is ${this.formatBytes(size)}.`,
      };
    }
    return { valid: true };
  }

  async generatePresignedUrl(
    contentType: string,
  ): Promise<{ presignedUrl: string; readUrl: string; fileKey: string }> {
    const fileKey = this.awsService.generateFileKey();
    const presignedUrl = await this.awsService.getPresignedPutUrl(fileKey, contentType);
    const readUrl = this.awsService.getReadUrl(fileKey);
    this.logger.log(`Generated presigned URL for key: ${fileKey}`);
    return { presignedUrl, readUrl, fileKey };
  }

  async initMultipartUpload(
    filename: string,
    contentType: string,
    fileSize: number,
  ): Promise<{ uploadId: string; key: string; partSize: number; maxConcurrency: number }> {
    const key = this.awsService.generateFileKey(filename);
    const { s3UploadId } = await this.awsService.initMultipartUpload(key, contentType);

    const uploadId = randomUUID();
    this.activeUploads.set(uploadId, {
      s3UploadId,
      key,
      contentType,
      fileSize,
      createdAt: new Date(),
    });

    const partSize = this.awsService.calculatePartSize(fileSize);
    this.logger.log(
      `Initialized multipart upload: uploadId=${uploadId}, key=${key}, partSize=${this.formatBytes(partSize)}`,
    );

    return { uploadId, key, partSize, maxConcurrency: MAX_CONCURRENCY };
  }

  async signParts(
    uploadId: string,
    partNumbers: number[],
  ): Promise<{ presignedUrls: Array<{ partNumber: number; url: string }> } | null> {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) return null;

    const presignedUrls = await this.awsService.signUploadParts(upload.key, upload.s3UploadId, partNumbers);
    this.logger.debug(`Signed ${presignedUrls.length} parts for upload ${uploadId}`);
    return { presignedUrls };
  }

  async completeUpload(
    uploadId: string,
    parts: CompletedPart[],
    assetId: string,
    needsTranscription: boolean,
    needsVideoAnalysis: boolean,
    projectId?: string,
  ): Promise<{ fileKey: string; readUrl: string } | null> {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) return null;

    await this.awsService.completeMultipartUpload(upload.key, upload.s3UploadId, parts);
    this.activeUploads.delete(uploadId);

    const readUrl = this.awsService.getReadUrl(upload.key);
    this.logger.log(`Completed multipart upload: key=${upload.key}, assetId=${assetId}`);

    const resolvedProjectId = this.normalizeProjectId(projectId);
    if (projectId && !resolvedProjectId) {
      this.logger.warn(`Ignoring invalid projectId for upload complete: "${projectId}"`);
    }

    // Server-side validation: only transcribe if content type is actually audio/video
    const canTranscribe = this.shouldTranscribe(upload.contentType);
    if (needsTranscription && canTranscribe) {
      this.triggerTranscription(assetId, upload.key, upload.contentType, upload.fileSize);
    } else if (needsTranscription && !canTranscribe) {
      // Frontend requested transcription but file is not audio/video - emit complete
      this.logger.log(
        `Skipping transcription for ${assetId}: contentType=${upload.contentType} is not audio/video`,
      );
      this.emitProgress(assetId, 100, 'complete');
    }

    if (needsVideoAnalysis && upload.contentType.startsWith('video/')) {
      this.videoAnalysisService.triggerVideoAnalysis({
        assetId,
        fileKey: upload.key,
        projectId: resolvedProjectId,
      });
    }

    return { fileKey: upload.key, readUrl };
  }

  async abortUpload(uploadId: string): Promise<boolean> {
    const upload = this.activeUploads.get(uploadId);
    if (!upload) return false;

    try {
      await this.awsService.abortMultipartUpload(upload.key, upload.s3UploadId);
    } catch (error) {
      this.logger.error(`Abort upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    this.activeUploads.delete(uploadId);
    this.logger.log(`Aborted multipart upload: ${uploadId}`);
    return true;
  }

  hasUpload(uploadId: string): boolean {
    return this.activeUploads.has(uploadId);
  }

  async deleteAsset({
    assetId,
    fileKey,
    twelveLabs,
  }: DeleteAssetRequest & {
    assetId: string;
  }): Promise<{ success: true; warnings: string[] }> {
    this.logger.debug(`Deleting asset: assetId=${assetId}, fileKey=${fileKey ?? 'none'}`);
    const warnings: string[] = [];

    if (fileKey) {
      if (this.isProjectAssetKey(fileKey)) {
        try {
          await this.awsService.deleteObject(fileKey);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete S3 object';
          this.logger.error(
            `S3 asset deletion failed for assetId=${assetId}, fileKey=${fileKey}: ${message}`,
          );
          warnings.push(`S3 delete failed: ${message}`);
        }
      } else {
        this.logger.warn(`Skipping S3 delete for assetId=${assetId}: invalid fileKey=${fileKey}`);
        warnings.push('Skipped S3 delete because the file key is invalid');
      }
    }

    if (twelveLabs) {
      try {
        await this.videoAnalysisService.deleteIndexedVideo(twelveLabs);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete TwelveLabs video';
        this.logger.error(`TwelveLabs delete failed for assetId=${assetId}: ${message}`);
        warnings.push(`TwelveLabs delete failed: ${message}`);
      }
    }

    this.logger.log(`Deleted asset cleanup finished: assetId=${assetId}, warnings=${warnings.length}`);
    return { success: true, warnings };
  }

  /**
   * Check if a content type should be transcribed (audio/video only)
   */
  shouldTranscribe(contentType: string): boolean {
    return contentType.startsWith('video/') || contentType.startsWith('audio/');
  }

  private normalizeProjectId(projectId?: string): string | undefined {
    if (!projectId) return undefined;

    const trimmed = projectId.trim();
    if (!trimmed) return undefined;
    if (trimmed.length > this.projectIdMaxLength) return undefined;
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return undefined;

    return trimmed;
  }

  private isProjectAssetKey(fileKey: string): boolean {
    return fileKey.startsWith('projects-assets/') && !fileKey.includes('..');
  }

  /**
   * Trigger transcription using ElevenLabs Scribe v2.
   * Routing based on content type:
   * - Video: Extract audio via Rust first, then send to ElevenLabs
   * - Audio: Send URL directly to ElevenLabs (no Rust needed)
   */
  triggerTranscription(assetId: string, fileKey: string, contentType: string, fileSize: number): void {
    const isVideo = contentType.startsWith('video/');

    this.logger.log(
      `Triggering transcription for assetId=${assetId}, size=${this.formatBytes(fileSize)}, ` +
        `type=${contentType}, needsAudioExtraction=${isVideo}`,
    );
    this.emitProgress(assetId, 0, 'transcribing');

    this.performTranscription(assetId, fileKey, isVideo)
      .then(({ transcription, metadata }) => {
        const hasNoTranscription = transcription.length === 0;
        this.logger.log(
          `Transcription complete for assetId=${assetId}, words=${transcription.length}` +
            (hasNoTranscription ? ' (no speech detected)' : ''),
        );
        this.realtimeService.dispatchMessage<TranscriptionCompletePayload>({
          type: realtimeMessageTypes.transcriptionComplete,
          payload: { assetId, transcription, hasNoTranscription, metadata },
          timestamp: new Date().toISOString(),
        });
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Transcription failed';
        this.logger.error(`Transcription failed for assetId=${assetId}: ${message}`);
        this.realtimeService.dispatchMessage<UploadProgressPayload>({
          type: realtimeMessageTypes.uploadProgress,
          payload: { assetId, progress: 0, phase: 'error', error: message },
          timestamp: new Date().toISOString(),
        });
      });
  }

  /**
   * Perform transcription via ElevenLabs Scribe v2.
   * - Videos: Extract audio via Rust first (video files contain much more than just audio)
   * - Audio: Send S3 URL directly to ElevenLabs (no Rust needed)
   */
  private async performTranscription(
    assetId: string,
    fileKey: string,
    isVideo: boolean,
  ): Promise<UploadTranscriptionResult> {
    const totalStart = Date.now();

    // Step 1: Generate presigned URL
    const presignedStart = Date.now();
    const presignedUrl = await this.awsService.getPresignedGetUrl(fileKey);
    this.logger.log(`[TIMING] Presigned URL generated in ${Date.now() - presignedStart}ms`);

    if (isVideo) {
      // Video: Extract audio via Rust, then transcribe
      this.logger.log(`[TIMING] Starting audio extraction via Rust for assetId=${assetId}`);

      // Step 2: Extract audio via Rust (includes download from S3 + FFmpeg processing)
      const extractStart = Date.now();
      const extractAudioUrl = new URL('/extract-audio', `${this.mediaProcessorUrl}/`);
      extractAudioUrl.searchParams.set('url', presignedUrl);
      const audioResponse = await fetch(extractAudioUrl);

      if (!audioResponse.ok) {
        const errorText = await audioResponse.text();
        throw new Error(`Audio extraction failed: ${audioResponse.status} - ${errorText}`);
      }

      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      const extractDuration = Date.now() - extractStart;
      this.logger.log(
        `[TIMING] Audio extraction complete: ${this.formatBytes(audioBuffer.length)} in ${(extractDuration / 1000).toFixed(2)}s ` +
          `(${(audioBuffer.length / 1024 / 1024 / (extractDuration / 1000)).toFixed(2)} MB/s)`,
      );

      // Step 3: Transcribe via ElevenLabs Scribe v2
      this.logger.log(`[TIMING] Starting ElevenLabs Scribe v2 transcription for assetId=${assetId}`);
      const transcribeStart = Date.now();
      const result = await this.elevenlabsService.transcribeFromBuffer({
        buffer: audioBuffer,
        mimeType: 'audio/mpeg',
      });
      const transcribeDuration = Date.now() - transcribeStart;
      this.logger.log(
        `[TIMING] ElevenLabs Scribe v2 transcription complete in ${(transcribeDuration / 1000).toFixed(2)}s`,
      );

      // Total timing
      const totalDuration = Date.now() - totalStart;
      this.logger.log(
        `[TIMING] Total transcription pipeline for assetId=${assetId}: ${(totalDuration / 1000).toFixed(2)}s ` +
          `(extract: ${(extractDuration / 1000).toFixed(2)}s, transcribe: ${(transcribeDuration / 1000).toFixed(2)}s)`,
      );

      return { transcription: result.captions, metadata: result.metadata };
    } else {
      // Audio: Send URL directly to ElevenLabs
      this.logger.log(`[TIMING] Sending audio URL directly to ElevenLabs Scribe v2 for assetId=${assetId}`);
      const transcribeStart = Date.now();
      const result = await this.elevenlabsService.transcribeFromUrl({ url: presignedUrl });
      const transcribeDuration = Date.now() - transcribeStart;

      const totalDuration = Date.now() - totalStart;
      this.logger.log(
        `[TIMING] Total transcription pipeline for assetId=${assetId}: ${(totalDuration / 1000).toFixed(2)}s ` +
          `(transcribe: ${(transcribeDuration / 1000).toFixed(2)}s)`,
      );

      return { transcription: result.captions, metadata: result.metadata };
    }
  }

  private emitProgress(assetId: string, progress: number, phase: UploadProgressPayload['phase']): void {
    this.realtimeService.dispatchMessage<UploadProgressPayload>({
      type: realtimeMessageTypes.uploadProgress,
      payload: { assetId, progress, phase },
      timestamp: new Date().toISOString(),
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
