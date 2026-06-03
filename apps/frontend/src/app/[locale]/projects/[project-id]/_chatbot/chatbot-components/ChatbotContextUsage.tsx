'use client';

import type { LanguageModelUsage } from 'ai';
import { getContext } from 'tokenlens';
import { chatModeModelIds, type ChatMode } from 'api-types';

import { useChatContext } from '../context/ChatContext';
import {
  Context,
  ContextContent,
  ContextTrigger,
} from '@/app/[locale]/projects/[project-id]/_chatbot/chatbot-components/ai-elements/context';
import { Progress } from '@/components/ui/progress';

const TOKENLENS_MODEL_ID_ALIASES: Record<string, string> = {
  'openai/gpt-5.2': 'openai/gpt-5',
  'openai/gpt-5.2-pro': 'openai/gpt-5',
  'openai/gpt-5.4': 'openai/gpt-5',
  'openai/gpt-5.4-pro': 'openai/gpt-5',
  'openai/gpt-5.5': 'openai/gpt-5',
  'google/gemini-3-flash': 'google/gemini-2.5-flash',
  'google/gemini-3-pro-preview': 'google/gemini-2.5-pro',
};

const resolveTokenLensModelId = (modelId: string) => TOKENLENS_MODEL_ID_ALIASES[modelId] ?? modelId;

type ChatbotContextUsageProps = {
  mode?: ChatMode;
};

const ICON_RADIUS = 10;
const ICON_VIEWBOX = 24;
const ICON_CENTER = 12;
const ICON_STROKE_WIDTH = 2;

type ContextRingIconProps = {
  usedPercent: number;
};

const ContextRingIcon: React.FC<ContextRingIconProps> = ({ usedPercent }) => {
  const circumference = 2 * Math.PI * ICON_RADIUS;
  const percent = Math.max(0, Math.min(1, usedPercent));
  const dashOffset = circumference * (1 - percent);

  return (
    <svg
      aria-hidden="true"
      height="20"
      style={{ color: 'currentColor' }}
      viewBox={`0 0 ${ICON_VIEWBOX} ${ICON_VIEWBOX}`}
      width="20"
    >
      <circle
        cx={ICON_CENTER}
        cy={ICON_CENTER}
        fill="none"
        opacity="0.25"
        r={ICON_RADIUS}
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
      />
      <circle
        cx={ICON_CENTER}
        cy={ICON_CENTER}
        fill="none"
        opacity="0.7"
        r={ICON_RADIUS}
        stroke="currentColor"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeWidth={ICON_STROKE_WIDTH}
        style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
      />
    </svg>
  );
};

export const ChatbotContextUsage: React.FC<ChatbotContextUsageProps> = ({ mode }) => {
  const { messages, latestModelId, latestRequestContext, latestUsage } = useChatContext();
  const effectiveModelId = mode ? chatModeModelIds[mode] : latestModelId;

  if (messages.length === 0) {
    return null;
  }

  if (!effectiveModelId) {
    return null;
  }

  const tokenLensModelId = resolveTokenLensModelId(effectiveModelId);

  const tokenUsage: LanguageModelUsage | undefined = latestUsage
    ? {
      inputTokens: latestUsage.inputTokens,
      inputTokenDetails: {
        noCacheTokens: latestUsage.inputTokens,
        cacheReadTokens: latestUsage.cachedInputTokens,
        cacheWriteTokens: undefined,
      },
      outputTokens: latestUsage.outputTokens,
      outputTokenDetails: {
        textTokens: latestUsage.outputTokens,
        reasoningTokens: latestUsage.reasoningTokens,
      },
      totalTokens: latestUsage.totalTokens,
      reasoningTokens: latestUsage.reasoningTokens,
      cachedInputTokens: latestUsage.cachedInputTokens,
    }
    : undefined;

  const usedTokens =
    tokenUsage?.totalTokens ??
    (tokenUsage?.inputTokens ?? 0) + (tokenUsage?.outputTokens ?? 0) + (tokenUsage?.reasoningTokens ?? 0);
  const modelContext = getContext({ modelId: tokenLensModelId });
  const maxTokens = modelContext.maxTotal ?? modelContext.maxInput;

  if (!maxTokens) {
    return null;
  }

  const requestContext =
    latestRequestContext && latestRequestContext.modelId === effectiveModelId ? latestRequestContext : undefined;
  const promptContextTokens =
    requestContext?.actualInputTokens ?? requestContext?.estimatedInputTokens ?? tokenUsage?.inputTokens ?? usedTokens;
  const usedPercent = Math.max(0, Math.min(1, maxTokens > 0 ? promptContextTokens / maxTokens : 0));
  const percentText = new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(usedPercent);
  const usedText = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(promptContextTokens);
  const maxText = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(maxTokens);

  return (
    <Context usedTokens={promptContextTokens} maxTokens={maxTokens} usage={tokenUsage} modelId={tokenLensModelId} closeDelay={200}>
      <ContextTrigger>
        <button
          type="button"
          aria-label={`${percentText} - ${usedText}/${maxText} prompt context used`}
          className="rounded-md p-1 text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
        >
          <ContextRingIcon usedPercent={usedPercent} />
        </button>
      </ContextTrigger>
      <ContextContent align="end" sideOffset={0} className="w-72">
        <div className="space-y-2 p-3 text-xs">
          <p className="whitespace-nowrap leading-none">
            <span className="text-muted-foreground">{percentText}</span>
            <span className="text-muted-foreground"> - </span>
            <span className="font-mono">
              {usedText}/{maxText}
            </span>
            <span className="text-muted-foreground ml-1">context used</span>
          </p>
          <Progress className="h-1 bg-zinc-200/60 dark:bg-zinc-700/60" value={usedPercent * 100} />
        </div>
      </ContextContent>
    </Context>
  );
};
