const ANSI_RESET = '\u001b[0m';
const ANSI_BLUE = '\u001b[34m';
const ANSI_CYAN = '\u001b[36m';
const ANSI_GREEN = '\u001b[32m';
const ANSI_RED = '\u001b[31m';
const ANSI_YELLOW = '\u001b[33m';

export const logColors = {
  blue: ANSI_BLUE,
  cyan: ANSI_CYAN,
  green: ANSI_GREEN,
  red: ANSI_RED,
  yellow: ANSI_YELLOW,
} as const;

export const colorize = (value: string, color: string): string => {
  if (process.env.NO_COLOR === '1') {
    return value;
  }

  return `${color}${value}${ANSI_RESET}`;
};

const stringifyValue = (value: unknown): string | null => {
  if (value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
      try {
        return JSON.stringify(JSON.parse(trimmedValue), null, 2);
      } catch {
        return trimmedValue;
      }
    }

    return trimmedValue;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const truncatePreview = (value: string | null, limit: number): string | null => {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length <= limit) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, limit)}\n... [truncated ${normalizedValue.length - limit} chars]`;
};

export const previewValue = (value: unknown, limit: number): string | null => {
  return truncatePreview(stringifyValue(value), limit);
};

export const summarizeValue = (value: unknown): string => {
  if (value === undefined) {
    return 'unknown';
  }

  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    const preview = truncatePreview(value.replace(/\s+/g, ' ').trim(), 120);
    return preview ?? 'empty string';
  }

  if (Array.isArray(value)) {
    return `array(${value.length})`;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    const visibleKeys = keys.slice(0, 6).join(', ');
    return `object(keys=[${visibleKeys}${keys.length > 6 ? ', ...' : ''}])`;
  }

  return String(value);
};

export const formatDuration = (durationMs: number): string => {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(1)}s`;
};

export const formatMoney = (value?: number): string => {
  if (value === undefined || Number.isNaN(value)) {
    return 'n/a';
  }

  return `$${value.toFixed(4)}`;
};

export const formatExecutionTarget = (providerExecuted?: boolean): string => {
  if (providerExecuted === undefined) {
    return 'unknown';
  }

  return providerExecuted ? 'provider' : 'local';
};

export const formatToolSummary = (
  toolSummaries: Array<{ order: number; toolName: string; status: string }>,
): string => {
  if (toolSummaries.length === 0) {
    return 'none';
  }

  return toolSummaries.map((trace) => `#${trace.order} ${trace.toolName}:${trace.status}`).join(' | ');
};
