import { Injectable, Logger } from '@nestjs/common';
import { realtimeMessageTypes, VideoAnalysisCompletePayload } from 'api-types';
import { AwsService } from '../aws/aws.service';
import { PromptsService } from '../prompts/prompts.service';
import { RealtimeService } from '../realtime/realtime.service';
import { TwelveLabsService } from './twelve-labs/twelve-labs.service';

const MIN_VIDEO_ANALYSIS_DURATION_SECONDS = 4;
const VIDEO_ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['macroView', 'causalLogic', 'sequentialSummary', 'socket', 'plug'],
  properties: {
    macroView: { type: 'string' },
    causalLogic: { type: 'string' },
    sequentialSummary: { type: 'string' },
    socket: { type: 'string' },
    plug: { type: 'string' },
  },
};
const VIDEO_ANALYSIS_RESPONSE_FORMAT = {
  type: 'json_schema',
  jsonSchema: VIDEO_ANALYSIS_JSON_SCHEMA,
} as const;

@Injectable()
export class VideoAnalysisService {
  private readonly logger = new Logger(VideoAnalysisService.name);

  constructor(
    private readonly awsService: AwsService,
    private readonly promptsService: PromptsService,
    private readonly realtimeService: RealtimeService,
    private readonly twelveLabsService: TwelveLabsService,
  ) {}

  triggerVideoAnalysis({
    assetId,
    fileKey,
    projectId,
  }: {
    assetId: string;
    fileKey: string;
    projectId?: string;
  }): void {
    void this.runVideoAnalysis({ assetId, fileKey, projectId }).catch((error: unknown) => {
      if (this.isVideoTooShortForAnalysis(error)) {
        this.logger.log(
          `Skipping video analysis for assetId=${assetId}: duration is less than ${MIN_VIDEO_ANALYSIS_DURATION_SECONDS}s`,
        );
        this.realtimeService.dispatchMessage<VideoAnalysisCompletePayload>({
          type: realtimeMessageTypes.videoAnalysisComplete,
          payload: { assetId, summary: this.getEmptyVideoAnalysisSummary() },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const message = error instanceof Error ? error.message : 'Video analysis failed';
      this.logger.error(`Video analysis failed for assetId=${assetId}: ${message}`);
      this.realtimeService.dispatchMessage<VideoAnalysisCompletePayload>({
        type: realtimeMessageTypes.videoAnalysisComplete,
        payload: { assetId, error: message },
        timestamp: new Date().toISOString(),
      });
    });
  }

  async deleteIndexedVideo({ indexId, videoId }: { indexId: string; videoId: string }): Promise<void> {
    this.logger.debug(`[12LABS] Deleting indexed video indexId=${indexId}, videoId=${videoId}`);
    await this.twelveLabsService.deleteIndexedVideo({ indexId, videoId });
    this.logger.log(`[12LABS] Deleted indexed video videoId=${videoId}`);
  }

  private async runVideoAnalysis({
    assetId,
    fileKey,
    projectId,
  }: {
    assetId: string;
    fileKey: string;
    projectId?: string;
  }): Promise<void> {
    const totalStart = Date.now();

    const presignedStart = Date.now();
    const presignedUrl = await this.awsService.getPresignedGetUrl(fileKey, 6 * 60 * 60);
    this.logger.debug(`[TIMING] [12LABS] Pressigned URL generated in ${Date.now() - presignedStart}ms`);

    this.logger.debug(
      `[TIMING] [12LABS] Starting indexing for assetId=${assetId}${projectId ? ` projectId=${projectId}` : ''}`,
    );
    const indexStart = Date.now();
    const { videoId, indexId } = await this.twelveLabsService.indexVideoFromUrl({ videoUrl: presignedUrl, projectId });
    this.logger.debug(`[TIMING] [12LABS] Indexing complete in ${(Date.now() - indexStart) / 1000}s`);

    const combinedPrompt = this.promptsService.getVideoAnalysisCombinedPrompt();

    this.logger.debug(`[TIMING] [12LABS] Starting combined analysis for assetId=${assetId} indexId=${indexId}`);
    const analysisStart = Date.now();
    const analysisResponse = await this.twelveLabsService.analyzeVideo({
      videoId,
      prompt: combinedPrompt,
      responseFormat: VIDEO_ANALYSIS_RESPONSE_FORMAT,
    });
    const summary = this.parseVideoAnalysisSummary(analysisResponse);
    this.logger.log(`[TIMING] [12LABS] Combined analysis complete in ${(Date.now() - analysisStart) / 1000}s`);

    this.realtimeService.dispatchMessage<VideoAnalysisCompletePayload>({
      type: realtimeMessageTypes.videoAnalysisComplete,
      payload: {
        assetId,
        twelveLabs: { indexId, videoId },
        summary,
      },
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`[TIMING] [12LABS] Total video analysis pipeline ${(Date.now() - totalStart) / 1000}s`);
  }

  private isVideoTooShortForAnalysis(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const body = (error as { body?: unknown }).body;
    if (body && typeof body === 'object' && (body as { code?: unknown }).code === 'video_duration_too_short') {
      return true;
    }

    const message = error instanceof Error ? error.message : '';
    return message.includes('"code": "video_duration_too_short"') || message.includes('video_duration_too_short');
  }

  private parseVideoAnalysisSummary(
    response: string,
  ): NonNullable<VideoAnalysisCompletePayload['summary']> {
    const parsed = this.safeParseVideoAnalysisJson(response);
    if (!parsed) {
      this.logger.debug('[12LABS] Combined analysis response was not valid JSON.');
      return this.getEmptyVideoAnalysisSummary();
    }

    return {
      macroView: this.normalizeVideoAnalysisValue(parsed.macroView),
      causalLogic: this.normalizeVideoAnalysisValue(parsed.causalLogic),
      sequentialSummary: this.normalizeVideoAnalysisValue(parsed.sequentialSummary),
      socket: this.normalizeVideoAnalysisValue(parsed.socket),
      plug: this.normalizeVideoAnalysisValue(parsed.plug),
    };
  }

  private safeParseVideoAnalysisJson(response: string): Record<string, unknown> | null {
    if (!response) return null;
    const trimmed = response.trim();
    const withoutFence = trimmed.startsWith('```')
      ? trimmed.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
      : trimmed;

    try {
      const parsed = JSON.parse(withoutFence);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      return parsed as Record<string, unknown>;
    } catch {
      const start = withoutFence.indexOf('{');
      const end = withoutFence.lastIndexOf('}');
      if (start === -1 || end <= start) return null;

      try {
        const parsed = JSON.parse(withoutFence.slice(start, end + 1));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
        return parsed as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  }

  private normalizeVideoAnalysisValue(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
        .join('\n');
    }
    return '';
  }

  private getEmptyVideoAnalysisSummary(): NonNullable<VideoAnalysisCompletePayload['summary']> {
    return {
      macroView: '',
      causalLogic: '',
      sequentialSummary: '',
      socket: '',
      plug: '',
    };
  }
}
