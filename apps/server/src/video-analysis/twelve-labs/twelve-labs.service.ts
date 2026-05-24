import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TwelveLabs } from 'twelvelabs-js';

type TwelveLabsIndexStrategy = 'global' | 'project';
type TwelveLabsAnalyzeRequest = Parameters<TwelveLabs['analyze']>[0];
type TwelveLabsResponseFormat = TwelveLabsAnalyzeRequest['responseFormat'];

export type TwelveLabsVideoIndexResult = {
  indexId: string;
  taskId: string;
  videoId: string;
};

@Injectable()
export class TwelveLabsService {
  private readonly logger = new Logger(TwelveLabsService.name);
  private client: TwelveLabs | null = null;
  private readonly cachedIndexIds = new Map<string, string>();
  private cachedConfiguredIndexId: string | null | undefined = undefined;
  private readonly indexingTimeoutMs = 30 * 60 * 1000;
  private readonly embeddingsTimeoutMs = 15 * 60 * 1000;
  private readonly waitForDoneSleepIntervalMs = 5 * 1000;
  private readonly maxConsecutiveStatusErrors = 10;
  private readonly maxTaskCreateAttempts = 4;

  constructor(private readonly configService: ConfigService) {}

  private getApiKey(): string | null {
    return (
      this.configService.get<string>('12LABS_API_KEY') ?? this.configService.get<string>('TWELVELABS_API_KEY') ?? null
    );
  }

  private getClient(): TwelveLabs {
    if (this.client) return this.client;

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Missing 12LABS_API_KEY');
    }

    this.client = new TwelveLabs({ apiKey });
    return this.client;
  }

  private async waitForIndexingTaskDone(taskId: string) {
    const client = this.getClient();
    const startedAt = Date.now();
    let consecutiveErrors = 0;

    while (true) {
      if (Date.now() - startedAt > this.indexingTimeoutMs) {
        throw new Error(
          `TwelveLabs indexing timed out after ${Math.round(this.indexingTimeoutMs / 1000)}s (taskId=${taskId})`,
        );
      }

      try {
        const task = await client.tasks.retrieve(taskId);
        consecutiveErrors = 0;

        if (task.status === 'ready' || task.status === 'failed') {
          return task;
        }
      } catch (error) {
        consecutiveErrors += 1;
        if (consecutiveErrors >= this.maxConsecutiveStatusErrors) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(
            `TwelveLabs indexing status check failed ${consecutiveErrors}x (taskId=${taskId}): ${message}`,
          );
        }
      }

      await new Promise((resolve) => setTimeout(resolve, this.waitForDoneSleepIntervalMs));
    }
  }

  private async waitForEmbeddingsTaskStatusDone(taskId: string) {
    const client = this.getClient();
    const startedAt = Date.now();
    let consecutiveErrors = 0;

    while (true) {
      if (Date.now() - startedAt > this.embeddingsTimeoutMs) {
        throw new Error(
          `TwelveLabs embeddings timed out after ${Math.round(this.embeddingsTimeoutMs / 1000)}s (taskId=${taskId})`,
        );
      }

      try {
        const task = await client.embed.tasks.status(taskId);
        consecutiveErrors = 0;

        if (task.status === 'ready' || task.status === 'failed') {
          return task;
        }
      } catch (error) {
        consecutiveErrors += 1;
        if (consecutiveErrors >= this.maxConsecutiveStatusErrors) {
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(
            `TwelveLabs embeddings status check failed ${consecutiveErrors}x (taskId=${taskId}): ${message}`,
          );
        }
      }

      await new Promise((resolve) => setTimeout(resolve, this.waitForDoneSleepIntervalMs));
    }
  }

  private getIndexStrategy(): TwelveLabsIndexStrategy {
    return 'project';
  }

  private getIndexName(): string {
    return (
      this.configService.get<string>('TWELVELABS_INDEX_NAME') ??
      this.configService.get<string>('12LABS_INDEX_NAME') ??
      'ai-video-editor'
    );
  }

  private getConfiguredIndexId(): string | null {
    if (this.cachedConfiguredIndexId !== undefined) return this.cachedConfiguredIndexId;
    this.cachedConfiguredIndexId =
      this.configService.get<string>('TWELVELABS_INDEX_ID') ??
      this.configService.get<string>('12LABS_INDEX_ID') ??
      null;
    return this.cachedConfiguredIndexId;
  }

  private getProjectIndexName(projectId: string): string {
    const sanitizedProjectId = projectId.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${this.getIndexName()}-project-${sanitizedProjectId}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getTaskCreateRetryDelayMs(attemptNumber: number): number {
    return attemptNumber * 5_000;
  }

  private getErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object') return null;

    const body = (error as { body?: unknown }).body;
    if (body && typeof body === 'object') {
      const code = (body as { code?: unknown }).code;
      if (typeof code === 'string' && code.length > 0) {
        return code;
      }
    }

    const message = error instanceof Error ? error.message : String(error);
    const matchedCode = message.match(/"code":\s*"([^"]+)"/)?.[1] ?? message.match(/\bvideo_[a-z_]+\b/)?.[0];
    return matchedCode ?? null;
  }

  private isRetryableTaskCreateError(error: unknown): boolean {
    return this.getErrorCode(error) === 'video_file_broken';
  }

  private async createIndexingTaskWithRetry({
    indexId,
    videoUrl,
  }: {
    indexId: string;
    videoUrl: string;
  }) {
    const client = this.getClient();

    for (let attemptNumber = 1; attemptNumber <= this.maxTaskCreateAttempts; attemptNumber += 1) {
      try {
        return await client.tasks.create({
          indexId,
          videoUrl,
        });
      } catch (error) {
        const shouldRetry = this.isRetryableTaskCreateError(error) && attemptNumber < this.maxTaskCreateAttempts;
        if (!shouldRetry) {
          throw error;
        }

        const retryDelayMs = this.getTaskCreateRetryDelayMs(attemptNumber);
        this.logger.warn(
          `TwelveLabs task creation failed with ${this.getErrorCode(error)}. ` +
            `Retrying in ${retryDelayMs}ms (${attemptNumber}/${this.maxTaskCreateAttempts})`,
        );
        await this.sleep(retryDelayMs);
      }
    }

    throw new Error('TwelveLabs task creation exhausted retries');
  }

  private resolveIndexName({ indexName, projectId }: { indexName?: string; projectId?: string }): string {
    if (indexName) return indexName;
    if (this.getIndexStrategy() === 'project' && projectId) {
      return this.getProjectIndexName(projectId);
    }
    return this.getIndexName();
  }

  async getOrCreateIndexId({ indexName }: { indexName?: string } = {}): Promise<string> {
    const configuredIndexId = this.getConfiguredIndexId();
    if (configuredIndexId) {
      return configuredIndexId;
    }

    const client = this.getClient();
    const resolvedIndexName = indexName ?? this.getIndexName();

    const cached = this.cachedIndexIds.get(resolvedIndexName);
    if (cached) return cached;

    const existingIndexes = await client.indexes.list({
      indexName: resolvedIndexName,
      page: 1,
      pageLimit: 1,
      sortBy: 'created_at',
      sortOption: 'desc',
    });
    const existing =
      existingIndexes.data.find((index) => index.indexName === resolvedIndexName) ?? existingIndexes.data[0];

    if (existing?.id) {
      this.cachedIndexIds.set(resolvedIndexName, existing.id);
      return existing.id;
    }

    this.logger.log(`Creating TwelveLabs index: name=${resolvedIndexName}`);
    const created = await client.indexes.create({
      indexName: resolvedIndexName,
      models: [
        { modelName: 'marengo3.0', modelOptions: ['visual', 'audio'] },
        { modelName: 'pegasus1.2', modelOptions: ['visual', 'audio'] },
      ],
      addons: ['thumbnail'],
    });

    if (!created.id) {
      throw new Error('TwelveLabs index creation did not return an id');
    }

    this.cachedIndexIds.set(resolvedIndexName, created.id);
    return created.id;
  }

  async indexVideoFromUrl({
    videoUrl,
    indexId,
    indexName,
    projectId,
  }: {
    videoUrl: string;
    indexId?: string;
    indexName?: string;
    projectId?: string;
  }): Promise<TwelveLabsVideoIndexResult> {
    const resolvedIndexName = this.resolveIndexName({ indexName, projectId });
    const resolvedIndexId = indexId ?? (await this.getOrCreateIndexId({ indexName: resolvedIndexName }));

    const task = await this.createIndexingTaskWithRetry({
      indexId: resolvedIndexId,
      videoUrl,
    });

    if (!task.id) {
      throw new Error('TwelveLabs task creation did not return an id');
    }

    const completedTask = await this.waitForIndexingTaskDone(task.id);

    if (completedTask.status !== 'ready') {
      throw new Error(`TwelveLabs indexing failed with status ${completedTask.status}`);
    }

    const videoId = completedTask.videoId;
    if (!videoId) {
      throw new Error('TwelveLabs indexing succeeded but returned no videoId');
    }

    return {
      indexId: resolvedIndexId,
      taskId: task.id,
      videoId,
    };
  }

  async analyzeVideo({
    videoId,
    prompt,
    responseFormat,
  }: {
    videoId: string;
    prompt: string;
    responseFormat?: TwelveLabsResponseFormat;
  }): Promise<string> {
    const client = this.getClient();
    const request: TwelveLabsAnalyzeRequest = { videoId, prompt };

    if (responseFormat) {
      request.responseFormat = responseFormat;
    }

    const response = await client.analyze(request, { timeoutInSeconds: 120 });

    return response.data ?? '';
  }

  async deleteIndexedVideo({ indexId, videoId }: { indexId: string; videoId: string }): Promise<void> {
    const client = this.getClient();
    await client.indexes.videos.delete(indexId, videoId);
  }

  async createEmbeddingsTaskFromUrl({ videoUrl }: { videoUrl: string }): Promise<{ taskId: string }> {
    const client = this.getClient();
    const task = await client.embed.tasks.create({
      modelName: 'marengo3.0',
      videoUrl,
    });

    if (!task.id) {
      throw new Error('TwelveLabs embeddings task creation did not return an id');
    }

    return { taskId: task.id };
  }

  async waitForEmbeddingsTaskDone({ taskId }: { taskId: string }): Promise<void> {
    const status = await this.waitForEmbeddingsTaskStatusDone(taskId);

    if (status.status !== 'ready') {
      throw new Error(`TwelveLabs embeddings failed with status ${status.status}`);
    }
  }

  async retrieveEmbeddings({ taskId }: { taskId: string }) {
    const client = this.getClient();
    return client.embed.tasks.retrieve(taskId, {
      embeddingOption: ['visual', 'audio', 'transcription'],
    });
  }
}
