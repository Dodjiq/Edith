import type { LanguageModelUsage } from 'ai';

export const getReasoningTokens = (usage?: LanguageModelUsage): number | undefined => {
  return usage?.outputTokenDetails?.reasoningTokens;
};

export const getCachedInputTokens = (usage?: LanguageModelUsage): number | undefined => {
  return usage?.inputTokenDetails?.cacheReadTokens;
};

export const getCacheCreationTokens = (usage?: LanguageModelUsage): number | undefined => {
  return usage?.inputTokenDetails?.cacheWriteTokens;
};

export const getUncachedInputTokens = (usage?: LanguageModelUsage): number | undefined => {
  return usage?.inputTokenDetails?.noCacheTokens ?? usage?.inputTokens;
};

export const getOutputTextTokens = (usage?: LanguageModelUsage): number | undefined => {
  if (!usage) {
    return undefined;
  }

  if (usage.outputTokenDetails?.textTokens !== undefined) {
    return usage.outputTokenDetails.textTokens;
  }

  const reasoningTokens = getReasoningTokens(usage);
  if (usage.outputTokens !== undefined && reasoningTokens !== undefined) {
    return Math.max(usage.outputTokens - reasoningTokens, 0);
  }

  return usage.outputTokens;
};
