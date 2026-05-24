import { Logger } from '@nestjs/common';
import { LanguageModelUsage } from 'ai';
import { ChatStreamCost } from 'api-types';
import {
  getCachedInputTokens,
  getCacheCreationTokens,
  getOutputTextTokens,
  getReasoningTokens,
  getUncachedInputTokens,
} from './usage-utils';

interface GatewayModelPricing {
  input?: number;
  output?: number;
  cachedInputTokens?: number;
  cacheCreationInputTokens?: number;
}

interface GatewayInstance {
  getAvailableModels: () => Promise<{
    models: Array<{
      id: string;
      pricing?: {
        input?: string | number;
        output?: string | number;
        cachedInputTokens?: string | number;
        cacheCreationInputTokens?: string | number;
      } | null;
    }>;
  }>;
}

export class PricingCalculator {
  private modelPricingById?: Record<string, GatewayModelPricing>;

  constructor(
    private readonly gateway: GatewayInstance,
    private readonly logger: Logger,
  ) {}

  async calculateRequestCostUSD(modelId: string, usage?: LanguageModelUsage): Promise<ChatStreamCost | undefined> {
    if (!usage) {
      return undefined;
    }

    const pricing = await this.getModelPricing(modelId);

    if (!pricing || (!pricing.input && !pricing.output)) {
      return undefined;
    }

    const uncachedInputTokens = getUncachedInputTokens(usage);
    const cachedInputTokens = getCachedInputTokens(usage);
    const cacheCreationTokens = getCacheCreationTokens(usage);
    const outputTextTokens = getOutputTextTokens(usage);
    const reasoningTokens = getReasoningTokens(usage);

    const inputCost =
      this.calculateSegmentCost(uncachedInputTokens ?? usage.inputTokens, pricing.input) +
      this.calculateSegmentCost(cachedInputTokens, pricing.cachedInputTokens ?? pricing.input) +
      this.calculateSegmentCost(cacheCreationTokens, pricing.cacheCreationInputTokens ?? pricing.input);
    const outputCost = this.calculateSegmentCost(outputTextTokens ?? usage.outputTokens, pricing.output);
    // Reasoning tokens are typically charged at output token rates
    const reasoningCost = this.calculateSegmentCost(reasoningTokens, pricing.output);
    const total = inputCost + outputCost + reasoningCost;

    return {
      input: Number(inputCost.toFixed(6)),
      output: Number(outputCost.toFixed(6)),
      reasoning: Number(reasoningCost.toFixed(6)),
      total: Number(total.toFixed(6)),
    };
  }

  private calculateSegmentCost(tokens: number | undefined, costPerToken?: number): number {
    if (!tokens || !costPerToken) {
      return 0;
    }

    return tokens * costPerToken;
  }

  private async getModelPricing(modelId: string): Promise<GatewayModelPricing | undefined> {
    if (!this.modelPricingById) {
      try {
        const availableModels = await this.gateway.getAvailableModels();
        this.modelPricingById = availableModels.models.reduce(
          (acc, model) => {
            if (model.pricing) {
              acc[model.id] = {
                input: this.parseGatewayPrice(model.pricing.input),
                output: this.parseGatewayPrice(model.pricing.output),
                cachedInputTokens: this.parseGatewayPrice(model.pricing.cachedInputTokens),
                cacheCreationInputTokens: this.parseGatewayPrice(model.pricing.cacheCreationInputTokens),
              };
            }

            return acc;
          },
          {} as Record<string, GatewayModelPricing>,
        );
      } catch (error) {
        this.logger.error('Failed to load AI Gateway pricing metadata', error as Error);
        return undefined;
      }
    }

    return this.modelPricingById?.[modelId];
  }

  private parseGatewayPrice(value: string | number | undefined): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (typeof value === 'number') {
      return value;
    }

    const normalizedValue = value.toLowerCase();
    const numericMatch = value.match(/(\d+(\.\d+)?)/);

    if (!numericMatch) {
      return undefined;
    }

    const amount = Number(numericMatch[0]);

    if (Number.isNaN(amount)) {
      return undefined;
    }

    if (/(?:per\s*)?(?:1\s*m|million)/.test(normalizedValue)) {
      return amount / 1_000_000;
    }

    if (/(?:per\s*)?(?:1\s*k|thousand)/.test(normalizedValue)) {
      return amount / 1_000;
    }

    return amount;
  }
}
