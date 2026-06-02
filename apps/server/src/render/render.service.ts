import type { AwsRegion } from '@remotion/lambda';
import { renderMediaOnLambda, speculateFunctionName } from '@remotion/lambda/client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RenderVideoPayload, RenderVideoSuccessResponse } from 'api-types';
import { VERSION } from 'remotion/version';
import { AwsService } from '../aws/aws.service';

const PRESIGNED_URL_EXPIRY_SECONDS = 3600;
const COMP_NAME = 'Main';
const SITE_NAME = 'remotion-edith';
const TIMEOUT_IN_SECONDS = 240;
const MEM_SIZE_IN_MB = 3008;
const DISK_SIZE_IN_MB = 10240;

type RenderAsset = {
  remoteFileKey?: string | null;
  remoteUrl?: string | null;
  [key: string]: unknown;
};

@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly awsService: AwsService,
  ) {}

  async startRender(payload: RenderVideoPayload): Promise<RenderVideoSuccessResponse> {
    this.logger.debug(
      `Starting render: assets=${Object.keys(payload.assets).length}, items=${Object.keys(payload.items).length}`,
    );

    try {
      const region = this.requireConfig('REMOTION_AWS_REGION') as AwsRegion;
      this.requireConfig('REMOTION_AWS_BUCKET_NAME');
      this.requireConfig('REMOTION_AWS_ACCESS_KEY_ID');
      this.requireConfig('REMOTION_AWS_SECRET_ACCESS_KEY');

      this.assertFontInfos(payload.items, payload.fontInfos);
      const assetsWithPresignedUrls = await this.generatePresignedUrlsForAssets(payload.assets);

      for (const [id, asset] of Object.entries(assetsWithPresignedUrls)) {
        const hasPresignedUrl = Boolean(asset.remoteUrl);
        this.logger.debug(`Asset ${id}: presignedUrlGenerated=${hasPresignedUrl}`);
      }

      const functionName = this.getRemotionLambdaFunctionName(
        this.configService.get<string>('REMOTION_LAMBDA_FUNCTION_NAME'),
      );

      const { bucketName, renderId } = await renderMediaOnLambda({
        codec: payload.codec,
        inputProps: {
          compositionHeight: payload.compositionHeight,
          compositionWidth: payload.compositionWidth,
          assets: assetsWithPresignedUrls,
          items: payload.items,
          tracks: payload.tracks,
          fontInfos: payload.fontInfos,
        },
        composition: COMP_NAME,
        functionName,
        colorSpace: 'bt709',
        region,
        serveUrl: SITE_NAME,
        downloadBehavior: {
          fileName: this.getEditorExportFileName(payload.codec),
          type: 'download',
        },
      });

      this.logger.log(`Render started: renderId=${renderId}, bucket=${bucketName}`);
      return {
        type: 'success',
        bucketName,
        renderId,
      };
    } catch (error) {
      this.logger.error(`Render failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async generatePresignedUrlsForAssets(
    assets: Record<string, RenderAsset>,
  ): Promise<Record<string, RenderAsset>> {
    const assetEntries = Object.entries(assets);
    this.logger.debug(`Generating presigned URLs for ${assetEntries.length} assets`);

    const updatedAssets = await Promise.all(
      assetEntries.map(async ([id, asset]) => {
        if (!asset.remoteFileKey) {
          return [id, asset] as const;
        }

        const presignedUrl = await this.awsService.getPresignedGetUrl(
          asset.remoteFileKey,
          PRESIGNED_URL_EXPIRY_SECONDS,
        );

        return [
          id,
          {
            ...asset,
            remoteUrl: presignedUrl,
          },
        ] as const;
      }),
    );

    return Object.fromEntries(updatedAssets);
  }

  private assertFontInfos(items: Record<string, unknown>, fontInfos: Record<string, unknown>): void {
    const requiredFonts = this.collectFontFamilies(items);
    for (const fontFamily of requiredFonts) {
      if (!fontInfos[fontFamily]) {
        throw new Error(`Font info missing for "${fontFamily}"`);
      }
    }
  }

  private collectFontFamilies(items: Record<string, unknown>): Set<string> {
    const fontFamilies = new Set<string>();

    for (const item of Object.values(items)) {
      if (this.isFontItem(item)) {
        fontFamilies.add(item.fontFamily);
      }
    }

    return fontFamilies;
  }

  private isFontItem(item: unknown): item is { type: 'text' | 'captions'; fontFamily: string } {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const candidate = item as { type?: unknown; fontFamily?: unknown };

    if (candidate.type !== 'text' && candidate.type !== 'captions') {
      return false;
    }

    return typeof candidate.fontFamily === 'string' && candidate.fontFamily.length > 0;
  }

  private getEditorExportFileName(codec: RenderVideoPayload['codec']): string {
    return `editor-export.${codec === 'h264' ? 'mp4' : 'webm'}`;
  }

  private getRemotionLambdaFunctionName(functionNameOverride?: string): string {
    const trimmedOverride = functionNameOverride?.trim();
    if (trimmedOverride) {
      const functionVersion = this.getVersionFromFunctionName(trimmedOverride);
      if (functionVersion && functionVersion !== VERSION) {
        throw new Error(
          `Version mismatch: REMOTION_LAMBDA_FUNCTION_NAME is set to "${trimmedOverride}"
          (version ${functionVersion}), but this app is using Remotion ${VERSION}.
          Either redeploy Lambda with 'npx remotion lambda functions deploy' or remove REMOTION_LAMBDA_FUNCTION_NAME to use auto-detection.`,
        );
      }

      return trimmedOverride;
    }

    return speculateFunctionName({
      diskSizeInMb: DISK_SIZE_IN_MB,
      memorySizeInMb: MEM_SIZE_IN_MB,
      timeoutInSeconds: TIMEOUT_IN_SECONDS,
    });
  }

  private getVersionFromFunctionName(functionName: string): string | null {
    const match = functionName.match(/remotion-render-(\d+)-(\d+)-(\d+)-/);
    if (!match) {
      return null;
    }

    return `${match[1]}.${match[2]}.${match[3]}`;
  }

  private requireConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`${key} is not configured`);
    }
    return value;
  }
}
