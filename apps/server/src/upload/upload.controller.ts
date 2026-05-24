import { Controller, Logger } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { apiContracts, CompletedPart } from 'api-types';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { UploadService } from './upload.service';

@Controller()
export class UploadController {
  private readonly logger = new Logger(UploadController.name);
  private readonly maxFileSizeInMb = 5000; // 5GB
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly transferAcceleration: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly uploadService: UploadService,
  ) {
    this.bucketName = this.configService.get<string>('REMOTION_AWS_BUCKET_NAME') ?? '';
    this.region = this.configService.get<string>('REMOTION_AWS_REGION') ?? 'us-east-1';
    this.transferAcceleration =
      this.configService.get<string>('REMOTION_AWS_TRANSFER_ACCELERATION') === 'true' ||
      this.configService.get<string>('REMOTION_AWS_TRANSFER_ACCELERATION') === '1';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('REMOTION_AWS_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.configService.get<string>('REMOTION_AWS_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  @TsRestHandler(apiContracts.upload)
  async handler() {
    return tsRestHandler(apiContracts.upload, {
      getPresignedUrl: async ({ body }) => {
        try {
          this.logger.log(`Generating presigned URL for ${body.contentType}, size: ${body.size}`);

          const maxBytes = this.maxFileSizeInMb * 1024 * 1024;
          if (body.size > maxBytes) {
            return {
              status: 413 as const,
              body: {
                code: 'FILE_TOO_LARGE',
                message: `File may not be over ${this.maxFileSizeInMb}MB. Yours is ${this.formatBytes(body.size)}.`,
              },
            };
          }

          const fileKey = `projects-assets/${randomUUID()}`;

          const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
            ContentType: body.contentType,
          });

          const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
          const readUrl = this.getReadUrl(fileKey);

          this.logger.log(`Generated presigned URL for key: ${fileKey}`);

          return {
            status: 200 as const,
            body: {
              presignedUrl,
              readUrl,
              fileKey,
            },
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to generate presigned URL';
          this.logger.error(`Presign failed: ${message}`);
          return {
            status: 400 as const,
            body: {
              code: 'PRESIGN_ERROR',
              message,
            },
          };
        }
      },

      initMultipart: async ({ body }) => {
        try {
          const validation = this.uploadService.validateFileSize(body.fileSize);
          if (!validation.valid) {
            return {
              status: 413 as const,
              body: { code: 'FILE_TOO_LARGE', message: validation.message! },
            };
          }

          const result = await this.uploadService.initMultipartUpload(body.filename, body.contentType, body.fileSize);
          this.logger.log(`Initialized multipart upload: ${result.uploadId}, key=${result.key}`);

          return { status: 200 as const, body: result };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to initialize multipart upload';
          this.logger.error(`Init multipart failed: ${message}`);
          return {
            status: 400 as const,
            body: { code: 'INIT_MULTIPART_ERROR', message },
          };
        }
      },

      signParts: async ({ params, body }) => {
        const result = await this.uploadService.signParts(params.uploadId, body.partNumbers);
        if (!result) {
          return {
            status: 404 as const,
            body: { code: 'NOT_FOUND', message: 'Upload not found or expired' },
          };
        }
        this.logger.debug(`Signed ${result.presignedUrls.length} parts for upload ${params.uploadId}`);
        return { status: 200 as const, body: result };
      },

      completeUpload: async ({ params, body }) => {
        const parts: CompletedPart[] = body.parts.map((p) => ({
          partNumber: p.partNumber,
          etag: p.etag,
        }));

        const result = await this.uploadService.completeUpload(
          params.uploadId,
          parts,
          body.assetId,
          body.needsTranscription,
          body.needsVideoAnalysis,
          body.projectId,
        );

        if (!result) {
          return {
            status: 404 as const,
            body: { code: 'NOT_FOUND', message: 'Upload not found or expired' },
          };
        }

        this.logger.log(`Completed multipart upload: ${params.uploadId}, key=${result.fileKey}`);
        return { status: 200 as const, body: result };
      },

      abortUpload: async ({ params }) => {
        const success = await this.uploadService.abortUpload(params.uploadId);
        if (!success) {
          return {
            status: 404 as const,
            body: { code: 'NOT_FOUND', message: 'Upload not found or already completed' },
          };
        }
        this.logger.log(`Aborted multipart upload: ${params.uploadId}`);
        return { status: 200 as const, body: { success: true } };
      },

      deleteAsset: async ({ params, body }) => {
        const result = await this.uploadService.deleteAsset({
          assetId: params.assetId,
          fileKey: body.fileKey,
          twelveLabs: body.twelveLabs,
        });

        return { status: 200 as const, body: result };
      },
    });
  }

  private getEndpoint(): string {
    if (this.transferAcceleration) {
      return `https://${this.bucketName}.s3-accelerate.amazonaws.com`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
  }

  private getReadUrl(key: string): string {
    return `${this.getEndpoint()}/${key}`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
