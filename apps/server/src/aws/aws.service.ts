import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export interface CompletedPart {
  partNumber: number;
  etag: string;
}

const MIN_PART_SIZE = 5 * 1024 * 1024; // 5MB minimum for S3 multipart
const MAX_PART_SIZE = 100 * 1024 * 1024; // 100MB maximum part size
const TARGET_PARTS = 100; // Target number of parts for optimal parallelism

@Injectable()
export class AwsService {
  private _s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly transferAcceleration: boolean;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('REMOTION_AWS_BUCKET_NAME') || '';
    this.region = this.configService.get<string>('REMOTION_AWS_REGION') || 'us-east-1';
    this.transferAcceleration =
      this.configService.get<string>('REMOTION_AWS_TRANSFER_ACCELERATION') === 'true' ||
      this.configService.get<string>('REMOTION_AWS_TRANSFER_ACCELERATION') === '1';
  }

  private get s3Client(): S3Client {
    if (!this._s3Client) {
      this._s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.configService.get<string>('REMOTION_AWS_ACCESS_KEY_ID') || 'placeholder',
          secretAccessKey: this.configService.get<string>('REMOTION_AWS_SECRET_ACCESS_KEY') || 'placeholder',
        },
        useAccelerateEndpoint: this.transferAcceleration,
      });
    }
    return this._s3Client;
  }

  generateFileKey(filename?: string): string {
    const uuid = randomUUID();
    if (filename) {
      const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      return `projects-assets/${uuid}-${sanitized}`;
    }
    return `projects-assets/${uuid}`;
  }

  private getEndpoint(): string {
    if (this.transferAcceleration) {
      return `https://${this.bucketName}.s3-accelerate.amazonaws.com`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
  }

  getReadUrl(key: string): string {
    return `${this.getEndpoint()}/${key}`;
  }

  async getPresignedPutUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getPresignedGetUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  calculatePartSize(fileSize: number): number {
    // Calculate optimal part size based on file size
    const idealPartSize = Math.ceil(fileSize / TARGET_PARTS);
    // Clamp between min and max
    return Math.max(MIN_PART_SIZE, Math.min(MAX_PART_SIZE, idealPartSize));
  }

  async initMultipartUpload(key: string, contentType: string): Promise<{ s3UploadId: string }> {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    const response = await this.s3Client.send(command);
    if (!response.UploadId) {
      throw new Error('Failed to initiate multipart upload: no UploadId returned');
    }
    return { s3UploadId: response.UploadId };
  }

  async signUploadParts(
    key: string,
    uploadId: string,
    partNumbers: number[],
  ): Promise<Array<{ partNumber: number; url: string }>> {
    const promises = partNumbers.map(async (partNumber) => {
      const command = new UploadPartCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      return { partNumber, url };
    });
    return Promise.all(promises);
  }

  async completeMultipartUpload(key: string, uploadId: string, parts: CompletedPart[]): Promise<void> {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .sort((a, b) => a.partNumber - b.partNumber)
          .map((part) => ({
            PartNumber: part.partNumber,
            ETag: part.etag,
          })),
      },
    });
    await this.s3Client.send(command);
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucketName,
      Key: key,
      UploadId: uploadId,
    });
    await this.s3Client.send(command);
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.s3Client.send(command);
  }
}
