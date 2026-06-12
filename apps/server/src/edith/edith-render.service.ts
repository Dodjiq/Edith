import { Injectable, Logger } from '@nestjs/common';
import type { AwsRegion } from '@remotion/lambda';
import { getRenderProgress, renderMediaOnLambda, speculateFunctionName } from '@remotion/lambda/client';
import { ConfigService } from '@nestjs/config';
import { AwsService } from '../aws/aws.service';
import { SupabaseService } from '../supabase/supabase.service';
import { RealtimeService } from '../realtime/realtime.service';
import type { EditPlan } from './agents/edit-planner.agent';

const EDITH_COMP_NAME = 'EdithAd';
const SITE_NAME = 'remotion-framedeck';
const TIMEOUT_IN_SECONDS = 240;
const MEM_SIZE_IN_MB = 3008;
const DISK_SIZE_IN_MB = 10240;
const PRESIGNED_URL_EXPIRY_SECONDS = 7200;
const POLL_INTERVAL_MS = 3000;
const OUTPUT_URL_EXPIRY_SECONDS = 86400;

const FORMAT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '16:9': { width: 1920, height: 1080 },
};

@Injectable()
export class EdithRenderService {
  private readonly logger = new Logger(EdithRenderService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly awsService: AwsService,
    private readonly supabase: SupabaseService,
    private readonly realtime: RealtimeService,
  ) {}

  async renderVariant(params: {
    jobId: string;
    variantId: string;
    variantIndex: number;
    editPlan: EditPlan;
    outputFormat: string;
  }): Promise<string> {
    const { jobId, variantId, variantIndex, editPlan, outputFormat } = params;
    const dimensions = FORMAT_DIMENSIONS[outputFormat] ?? FORMAT_DIMENSIONS['9:16'];

    this.logger.debug(`Starting render for variant ${variantIndex + 1}, job=${jobId}`);

    const scenesWithUrls = await Promise.all(
      editPlan.scenes.map(async (scene) => ({
        ...scene,
        assetUrl: await this.awsService
          .getPresignedGetUrl(scene.assetPath, PRESIGNED_URL_EXPIRY_SECONDS)
          .catch(() => scene.assetPath),
      })),
    );

    const region = this.requireConfig('REMOTION_AWS_REGION') as AwsRegion;
    const functionName = speculateFunctionName({
      diskSizeInMb: DISK_SIZE_IN_MB,
      memorySizeInMb: MEM_SIZE_IN_MB,
      timeoutInSeconds: TIMEOUT_IN_SECONDS,
    });

    const { bucketName, renderId } = await renderMediaOnLambda({
      codec: 'h264',
      composition: EDITH_COMP_NAME,
      functionName,
      region,
      serveUrl: SITE_NAME,
      colorSpace: 'bt709',
      inputProps: {
        scenes: scenesWithUrls,
        captions: editPlan.captions,
        totalDurationMs: editPlan.totalDurationMs,
        width: dimensions.width,
        height: dimensions.height,
      },
      downloadBehavior: {
        fileName: `edith-variante-${variantIndex + 1}.mp4`,
        type: 'download',
      },
    });

    this.logger.debug(`Render launched: renderId=${renderId}, bucket=${bucketName}`);

    const outKey = await this.pollUntilDone({
      renderId,
      bucketName,
      functionName,
      region,
      jobId,
      variantId,
      variantIndex,
    });

    // Generate a long-lived presigned URL for the output
    const exportUrl = await this.awsService.getPresignedGetUrl(outKey, OUTPUT_URL_EXPIRY_SECONDS);
    this.logger.log(`Variant ${variantIndex + 1} rendered successfully: outKey=${outKey}`);

    return exportUrl;
  }

  private async pollUntilDone(params: {
    renderId: string;
    bucketName: string;
    functionName: string;
    region: AwsRegion;
    jobId: string;
    variantId: string;
    variantIndex: number;
  }): Promise<string> {
    const { renderId, bucketName, functionName, region, jobId, variantId, variantIndex } = params;

    while (true) {
      const progress = await getRenderProgress({
        renderId,
        bucketName,
        functionName,
        region,
      });

      const pct = Math.round((progress.overallProgress ?? 0) * 100);
      this.realtime.dispatchMessage({
        type: 'edith:renderProgress',
        payload: { jobId, variantId, variantIndex, progress: pct },
        timestamp: new Date().toISOString(),
      });

      if (progress.done) {
        if (!progress.outKey) throw new Error(`Render ${renderId} completed but output key is missing`);
        return progress.outKey;
      }

      if (progress.fatalErrorEncountered) {
        const errMsg = (progress.errors as Array<{ message: string }>)?.[0]?.message ?? 'Render failed';
        throw new Error(`Remotion render error: ${errMsg}`);
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  private requireConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new Error(`${key} is not configured`);
    return value;
  }
}
