import type { ChatMode } from 'api-types';

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'moonshot' | 'xai';

export interface ThinkingConfig {
  budgetTokens: number;
  // OpenAI specific
  reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
  reasoningSummary?: 'auto' | 'detailed';
  // Anthropic Opus specific
  effort?: 'low' | 'medium' | 'high';
  // Google Gemini 3 specific
  thinkingLevel?: 'low' | 'high';
}

export interface ModelConfig {
  provider: ProviderType;
  thinking: ThinkingConfig;
}

// Mode-specific overrides for thinking config
// Allows using the same model with different reasoning efforts per mode
type ModeOverride = Partial<ThinkingConfig>;
type ModeOverrides = Partial<Record<ChatMode, ModeOverride>>;

export const MODE_THINKING_OVERRIDES: Record<string, ModeOverrides> = {
  'openai/gpt-5.5': {
    fast: { reasoningEffort: 'low' },
    normal: { reasoningEffort: 'medium' },
    smart: { reasoningEffort: 'high' },
    pro: { reasoningEffort: 'xhigh' },
  },
  'openai/gpt-5.2': {
    normal: { reasoningEffort: 'low' },
    smart: { reasoningEffort: 'medium' },
  },
  'openai/gpt-5.4': {
    normal: { reasoningEffort: 'low' },
    smart: { reasoningEffort: 'high' },
  },
};

// Model registry: maps model IDs to their configurations
export const MODEL_REGISTRY: Record<string, ModelConfig> = {
  // OpenAI models
  'openai/gpt-5.1-thinking': {
    provider: 'openai',
    thinking: {
      budgetTokens: 20000,
      reasoningEffort: 'high',
      reasoningSummary: 'detailed',
    },
  },

  'openai/gpt-5.2': {
    provider: 'openai',
    thinking: {
      budgetTokens: 20000,
      reasoningEffort: 'high',
      reasoningSummary: 'detailed',
    },
  },

  'openai/gpt-5.2-pro': {
    provider: 'openai',
    thinking: {
      budgetTokens: 2000000,
      reasoningEffort: 'high',
      reasoningSummary: 'detailed',
    },
  },

  'openai/gpt-5.4': {
    provider: 'openai',
    thinking: {
      budgetTokens: 20000,
      reasoningEffort: 'high',
      reasoningSummary: 'detailed',
    },
  },

  'openai/gpt-5.4-pro': {
    provider: 'openai',
    thinking: {
      budgetTokens: 2000000,
      reasoningEffort: 'high',
      reasoningSummary: 'detailed',
    },
  },

  'openai/gpt-5.5': {
    provider: 'openai',
    thinking: {
      budgetTokens: 20000,
      reasoningEffort: 'high',
      reasoningSummary: 'detailed',
    },
  },

  'anthropic/claude-haiku-4.5': {
    provider: 'anthropic',
    thinking: { budgetTokens: 3000 },
  },
  'anthropic/claude-sonnet-4.5': {
    provider: 'anthropic',
    thinking: { budgetTokens: 3000 },
  },
  'anthropic/claude-opus-4.5': {
    provider: 'anthropic',
    thinking: {
      budgetTokens: 10000,
      effort: 'high', //? Effort is not supported for OPUS 4.5 models and higher
    },
  },

  // Google Gemini models
  'google/gemini-3-pro-preview': {
    provider: 'google',
    thinking: {
      budgetTokens: 10000,
      thinkingLevel: 'low',
    },
  },

  'google/gemini-3.5-flash': {
    provider: 'google',
    thinking: {
      budgetTokens: 20000,
      thinkingLevel: 'low',
    },
  },

  'google/gemini-3-flash': {
    provider: 'google',
    thinking: {
      budgetTokens: 20000,
      thinkingLevel: 'low',
    },
  },

  'google/gemini-3.1-flash-lite-preview': {
    provider: 'google',
    thinking: {
      budgetTokens: 12000,
      thinkingLevel: 'low',
    },
  },

  // Moonshot models
  'moonshotai/kimi-k2-thinking-turbo': {
    provider: 'moonshot',
    thinking: { budgetTokens: 3000 },
  },

  // xAI Grok models
  'xai/grok-4.1-fast-reasoning': {
    provider: 'xai',
    thinking: {
      budgetTokens: 10000,
      reasoningEffort: 'high',
    },
  },
};

// Extracts provider name from model ID (e.g., 'openai/gpt-5' -> 'openai')
function getProviderFromModelId(modelId: string): ProviderType | null {
  const prefix = modelId.split('/')[0];
  const providerMap: Record<string, ProviderType> = {
    openai: 'openai',
    anthropic: 'anthropic',
    google: 'google',
    moonshotai: 'moonshot',
    xai: 'xai',
  };
  return providerMap[prefix] ?? null;
}

type ProviderOptions = {
  openai?: {
    reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
    reasoningSummary?: 'auto' | 'detailed';
  };
  anthropic?: {
    thinking: { type: 'enabled'; budgetTokens: number };
    effort?: 'low' | 'medium' | 'high';
  };
  google?: {
    thinkingConfig: {
      thinkingLevel?: 'low' | 'high';
      thinkingBudget?: number;
      includeThoughts: boolean;
    };
  };
  moonshot?: {
    thinking: { type: 'enabled'; budgetTokens: number };
  };
  xai?: {
    reasoningEffort?: 'low' | 'medium' | 'high';
  };
};

// Builds provider options for streamText based on model configuration
// Accepts optional mode to apply mode-specific overrides (e.g., different reasoning efforts)
export function buildProviderOptions(modelId: string, mode?: ChatMode): ProviderOptions {
  const config = MODEL_REGISTRY[modelId];
  const provider = config?.provider ?? getProviderFromModelId(modelId);

  if (!config) {
    // Fallback for unknown models - return empty options
    return {};
  }

  // Apply mode-specific overrides if available
  const modeOverrides = mode ? MODE_THINKING_OVERRIDES[modelId]?.[mode] : undefined;
  const thinking: ThinkingConfig = modeOverrides ? { ...config.thinking, ...modeOverrides } : config.thinking;

  switch (provider) {
    case 'openai':
      // OpenAI uses reasoningEffort and reasoningSummary, NOT thinking.budgetTokens
      return {
        openai: {
          ...(thinking.reasoningEffort ? { reasoningEffort: thinking.reasoningEffort } : {}),
          ...(thinking.reasoningSummary ? { reasoningSummary: thinking.reasoningSummary } : {}),
        },
      };

    case 'anthropic':
      return {
        anthropic: {
          thinking: {
            type: 'enabled',
            budgetTokens: thinking.budgetTokens,
          },
          ...(thinking.effort ? { effort: thinking.effort } : {}),
        },
      };

    case 'google':
      // Gemini 3 uses thinkingLevel, Gemini 2.5 uses thinkingBudget
      return {
        google: {
          thinkingConfig: {
            ...(thinking.thinkingLevel
              ? { thinkingLevel: thinking.thinkingLevel }
              : { thinkingBudget: thinking.budgetTokens }),
            includeThoughts: true,
          },
        },
      };

    case 'moonshot':
      // Moonshot uses similar format to Anthropic
      return {
        moonshot: {
          thinking: {
            type: 'enabled',
            budgetTokens: thinking.budgetTokens,
          },
        },
      };

    case 'xai': {
      // xAI Grok uses reasoningEffort for reasoning models (only low/medium/high are valid)
      const xaiEffort = thinking.reasoningEffort as 'low' | 'medium' | 'high' | undefined;
      return {
        xai: {
          ...(xaiEffort ? { reasoningEffort: xaiEffort } : {}),
        },
      };
    }

    default:
      return {};
  }
}

// Gets model config, with fallback for unknown models
export function getModelConfig(modelId: string): ModelConfig | null {
  return MODEL_REGISTRY[modelId] ?? null;
}

// Returns required headers for a model (e.g., Anthropic beta headers for interleaved thinking)
export function getModelHeaders(modelId: string): Record<string, string> {
  const config = MODEL_REGISTRY[modelId];
  const provider = config?.provider ?? getProviderFromModelId(modelId);

  if (provider === 'anthropic') {
    // Required for interleaved thinking (reasoning with tool calls)
    return { 'anthropic-beta': 'interleaved-thinking-2025-05-14' };
  }

  return {};
}
