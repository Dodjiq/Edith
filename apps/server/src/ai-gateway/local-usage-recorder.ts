import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';

interface UsageBreakdown {
  tokens: TokenStats;
  usd: CostStats;
}

interface TokenStats {
  total: number;
  input: number;
  output: number;
  reasoning: number;
  cachedInput: number;
  cachedOutput: number;
  cacheCreation: number;
}

interface CostStats {
  total: number;
  input: number;
  output: number;
  reasoning: number;
  cachedInput: number;
  cachedOutput: number;
  cacheCreation: number;
}

interface UsageReportFile {
  totals: UsageBreakdown;
  models: Record<string, UsageBreakdown>;
  lastUpdatedAt: string;
}

export interface UsageRecordPayload {
  modelId: string;
  tokens?: {
    total?: number;
    input?: number;
    output?: number;
    reasoning?: number;
    cachedInput?: number;
    cachedOutput?: number;
    cacheCreation?: number;
  };
  usd?: {
    total?: number;
    input?: number;
    output?: number;
    reasoning?: number;
    cachedInput?: number;
    cachedOutput?: number;
    cacheCreation?: number;
  };
}

const LOCAL_LOG_PATH = resolve(process.cwd(), 'data/ai-gateway-usage.json');
const IS_LOCAL_ENV = process.env.NODE_ENV === 'development';

export const recordLocalAiGatewayUsage = async (payload: UsageRecordPayload): Promise<void> => {
  if (!IS_LOCAL_ENV) {
    return;
  }

  try {
    await fs.mkdir(dirname(LOCAL_LOG_PATH), { recursive: true });
    const report = await readUsageReport();
    const modelBreakdown = report.models[payload.modelId] ?? createEmptyBreakdown();

    updateBreakdown(report.totals, payload);
    updateBreakdown(modelBreakdown, payload);

    report.models[payload.modelId] = modelBreakdown;
    report.lastUpdatedAt = new Date().toISOString();

    await fs.writeFile(LOCAL_LOG_PATH, JSON.stringify(report, null, 2), 'utf8');
  } catch (error) {
    console.error('[AiGatewayUsageRecorder] Failed to persist usage metrics', error);
  }
};

const readUsageReport = async (): Promise<UsageReportFile> => {
  try {
    const raw = await fs.readFile(LOCAL_LOG_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<UsageReportFile>;

    return {
      totals: parsed.totals ?? createEmptyBreakdown(),
      models: parsed.models ?? {},
      lastUpdatedAt: parsed.lastUpdatedAt ?? new Date().toISOString(),
    };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== 'ENOENT') {
      console.warn('[AiGatewayUsageRecorder] Resetting usage metrics due to read error', error);
    }

    return {
      totals: createEmptyBreakdown(),
      models: {},
      lastUpdatedAt: new Date().toISOString(),
    };
  }
};

const createEmptyBreakdown = (): UsageBreakdown => ({
  tokens: {
    total: 0,
    input: 0,
    output: 0,
    reasoning: 0,
    cachedInput: 0,
    cachedOutput: 0,
    cacheCreation: 0,
  },
  usd: {
    total: 0,
    input: 0,
    output: 0,
    reasoning: 0,
    cachedInput: 0,
    cachedOutput: 0,
    cacheCreation: 0,
  },
});

const updateBreakdown = (breakdown: UsageBreakdown, payload: UsageRecordPayload): void => {
  const tokenPayload = payload.tokens ?? {};
  const usdPayload = payload.usd ?? {};

  const totalTokens =
    tokenPayload.total ??
    sumDefined([
      tokenPayload.input,
      tokenPayload.output,
      tokenPayload.reasoning,
      tokenPayload.cachedInput,
      tokenPayload.cachedOutput,
      tokenPayload.cacheCreation,
    ]);

  addToStats(breakdown.tokens, 'total', totalTokens);
  addToStats(breakdown.tokens, 'input', tokenPayload.input);
  addToStats(breakdown.tokens, 'output', tokenPayload.output);
  addToStats(breakdown.tokens, 'reasoning', tokenPayload.reasoning);
  addToStats(breakdown.tokens, 'cachedInput', tokenPayload.cachedInput);
  addToStats(breakdown.tokens, 'cachedOutput', tokenPayload.cachedOutput);
  addToStats(breakdown.tokens, 'cacheCreation', tokenPayload.cacheCreation);

  const totalUsd =
    usdPayload.total ??
    sumDefined([
      usdPayload.input,
      usdPayload.output,
      usdPayload.reasoning,
      usdPayload.cachedInput,
      usdPayload.cachedOutput,
      usdPayload.cacheCreation,
    ]);

  const rounding = { roundToDecimals: 5 as const };
  addToStats(breakdown.usd, 'total', totalUsd, rounding);
  addToStats(breakdown.usd, 'input', usdPayload.input, rounding);
  addToStats(breakdown.usd, 'output', usdPayload.output, rounding);
  addToStats(breakdown.usd, 'reasoning', usdPayload.reasoning, rounding);
  addToStats(breakdown.usd, 'cachedInput', usdPayload.cachedInput, rounding);
  addToStats(breakdown.usd, 'cachedOutput', usdPayload.cachedOutput, rounding);
  addToStats(breakdown.usd, 'cacheCreation', usdPayload.cacheCreation, rounding);
};

const addToStats = (
  stats: TokenStats | CostStats,
  key: keyof TokenStats & keyof CostStats,
  value?: number,
  options?: { roundToDecimals?: number },
): void => {
  if (value === undefined || Number.isNaN(value)) {
    return;
  }

  stats[key] += value;

  if (options?.roundToDecimals !== undefined) {
    stats[key] = Number(stats[key].toFixed(options.roundToDecimals));
  }
};

const sumDefined = (values: Array<number | undefined>): number => {
  return values.reduce<number>((total, value) => {
    if (value === undefined || Number.isNaN(value)) {
      return total;
    }

    return total + value;
  }, 0);
};
