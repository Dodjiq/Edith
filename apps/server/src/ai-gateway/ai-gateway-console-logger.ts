import { LanguageModelUsage } from 'ai';
import { ChatStreamCost } from 'api-types';
import {
  getCachedInputTokens,
  getCacheCreationTokens,
  getOutputTextTokens,
  getReasoningTokens,
  getUncachedInputTokens,
} from './usage-utils';
import {
  colorize,
  formatDuration,
  formatExecutionTarget,
  formatMoney,
  formatToolSummary,
  logColors,
  previewValue,
  summarizeValue,
  truncatePreview,
} from './ai-gateway-log-utils';
import { AiGatewayConsoleLoggerParams, ToolPayload, ToolTrace } from './ai-gateway-console-logger.types';

const LOG_PREFIX = '[AI Gateway]';
const ANSI_GRAY = '\u001b[90m';
const PROMPT_PREVIEW_LIMIT = 1_400;
const TOOL_PREVIEW_LIMIT = 900;
const REASONING_PREVIEW_LIMIT = 2_400;
const RESPONSE_PREVIEW_LIMIT = 1_400;

export class AiGatewayConsoleLogger {
  private readonly startedAt = Date.now();
  private readonly toolTraces = new Map<string, ToolTrace>();
  private readonly isEnabled = process.env.NODE_ENV !== 'test';

  constructor(private readonly params: AiGatewayConsoleLoggerParams) {}

  start(): void {
    this.print('request started', [
      this.inline('message', this.params.messageId),
      this.inline('mode', this.params.mode),
      this.inline('model', this.params.modelId),
      this.inline('provider', this.params.provider),
      this.inline('transport', this.params.transport),
      this.inline('tools', this.params.toolNames.join(', ') || 'none'),
      this.inline(
        'context',
        `estimated=${this.params.requestContext.estimatedInputTokens} tokens | ${this.params.requestContext.parts
          .map((part) => `${part.id}:${part.summary}`)
          .join(' | ')}`,
      ),
      ...this.multiline('user message', truncatePreview(this.params.latestPrompt, PROMPT_PREVIEW_LIMIT)),
      ...this.multiline('editor prompt', truncatePreview(this.params.editorPrompt, PROMPT_PREVIEW_LIMIT)),
      ...this.multiline('system prompt', truncatePreview(this.params.systemPrompt, PROMPT_PREVIEW_LIMIT)),
      ...this.multiline('provider options', previewValue(this.params.providerOptions, TOOL_PREVIEW_LIMIT)),
    ]);
  }

  captureToolInputStart(payload: ToolPayload): void {
    const trace = this.getTrace(payload);
    trace.status = 'preparing';
    trace.providerExecuted = payload.providerExecuted;
  }

  captureToolInputDelta(toolCallId: string, delta: string): void {
    const trace = this.getTrace({ toolCallId, toolName: 'tool' });
    trace.inputBuffer += delta;
  }

  captureToolInputFinished(payload: ToolPayload & { input?: unknown }): void {
    const trace = this.getTrace(payload);
    trace.providerExecuted = payload.providerExecuted ?? trace.providerExecuted;
    trace.input = payload.input ?? trace.input ?? truncatePreview(trace.inputBuffer, TOOL_PREVIEW_LIMIT);
  }

  logToolCall(payload: ToolPayload & { input?: unknown }): void {
    const trace = this.getTrace(payload);
    trace.status = 'called';
    trace.providerExecuted = payload.providerExecuted ?? trace.providerExecuted;
    trace.input = payload.input ?? trace.input ?? truncatePreview(trace.inputBuffer, TOOL_PREVIEW_LIMIT);

    if (trace.hasLoggedCall) {
      return;
    }

    trace.hasLoggedCall = true;
    this.print(`tool call #${trace.order} ${trace.toolName}`, [
      this.inline('message', this.params.messageId),
      this.inline('model', this.params.modelId),
      this.inline('call id', trace.toolCallId),
      this.inline('execution', formatExecutionTarget(trace.providerExecuted)),
      this.inline('input summary', summarizeValue(trace.input)),
      ...this.multiline('input', previewValue(trace.input, TOOL_PREVIEW_LIMIT)),
    ]);
  }

  logToolResult(payload: ToolPayload & { input?: unknown; output?: unknown; preliminary?: boolean }): void {
    const trace = this.getTrace(payload);
    trace.providerExecuted = payload.providerExecuted ?? trace.providerExecuted;
    trace.input = payload.input ?? trace.input;
    trace.output = payload.output;

    if (payload.preliminary) {
      return;
    }

    trace.status = 'completed';

    if (trace.hasLoggedCompletion) {
      return;
    }

    trace.hasLoggedCompletion = true;
    this.print(
      `tool result #${trace.order} ${trace.toolName}`,
      [
        this.inline('message', this.params.messageId),
        this.inline('call id', trace.toolCallId),
        this.inline('execution', formatExecutionTarget(trace.providerExecuted)),
        this.inline('output summary', summarizeValue(trace.output)),
        ...this.multiline('output', previewValue(trace.output, TOOL_PREVIEW_LIMIT)),
      ],
      'success',
    );
  }

  logToolError(payload: ToolPayload & { input?: unknown; error: string }): void {
    const trace = this.getTrace(payload);
    trace.status = 'error';
    trace.providerExecuted = payload.providerExecuted ?? trace.providerExecuted;
    trace.input = payload.input ?? trace.input;
    trace.error = payload.error;

    if (trace.hasLoggedCompletion) {
      return;
    }

    trace.hasLoggedCompletion = true;
    this.print(
      `tool error #${trace.order} ${trace.toolName}`,
      [
        this.inline('message', this.params.messageId),
        this.inline('call id', trace.toolCallId),
        this.inline('execution', formatExecutionTarget(trace.providerExecuted)),
        ...this.multiline('input', previewValue(trace.input, TOOL_PREVIEW_LIMIT)),
        ...this.multiline('error', truncatePreview(payload.error, TOOL_PREVIEW_LIMIT)),
      ],
      'error',
    );
  }

  complete(params: {
    completion: string;
    reasoning: string;
    usage?: LanguageModelUsage;
    costUSD?: ChatStreamCost;
  }): void {
    const usage = params.usage;
    const uncachedInputTokens = getUncachedInputTokens(usage);
    const cachedInputTokens = getCachedInputTokens(usage);
    const cacheCreationTokens = getCacheCreationTokens(usage);
    const outputTextTokens = getOutputTextTokens(usage);
    const reasoningTokens = getReasoningTokens(usage);

    this.print(
      'request completed',
      [
        this.inline('message', this.params.messageId),
        this.inline('duration', formatDuration(Date.now() - this.startedAt)),
        this.inline('model', this.params.modelId),
        this.inline(
          'usage',
          usage
            ? `total=${usage.totalTokens}, input=${uncachedInputTokens ?? usage.inputTokens}, cachedInput=${cachedInputTokens ?? 0}, cacheCreation=${cacheCreationTokens ?? 0}, output=${outputTextTokens ?? usage.outputTokens}, reasoning=${reasoningTokens ?? 0}`
            : 'not reported',
        ),
        this.inline(
          'cost',
          params.costUSD
            ? `total=${formatMoney(params.costUSD.total)}, input=${formatMoney(params.costUSD.input)}, output=${formatMoney(params.costUSD.output)}, reasoning=${formatMoney(params.costUSD.reasoning)}`
            : 'not available',
        ),
        this.inline('tools', formatToolSummary(Array.from(this.toolTraces.values()))),
        ...this.multiline('reasoning', truncatePreview(params.reasoning, REASONING_PREVIEW_LIMIT)),
        ...this.multiline('response', truncatePreview(params.completion, RESPONSE_PREVIEW_LIMIT)),
      ],
      'success',
    );
  }

  aborted(): void {
    this.print(
      'request aborted',
      [
        this.inline('message', this.params.messageId),
        this.inline('duration', formatDuration(Date.now() - this.startedAt)),
        this.inline('tools', formatToolSummary(Array.from(this.toolTraces.values()))),
      ],
      'warn',
    );
  }

  failed(error: unknown): void {
    const errorMessage =
      error instanceof Error
        ? truncatePreview(error.stack ?? error.message, REASONING_PREVIEW_LIMIT)
        : previewValue(error, REASONING_PREVIEW_LIMIT);

    this.print(
      'request failed',
      [
        this.inline('message', this.params.messageId),
        this.inline('duration', formatDuration(Date.now() - this.startedAt)),
        this.inline('tools', formatToolSummary(Array.from(this.toolTraces.values()))),
        ...this.multiline('error', errorMessage),
      ],
      'error',
    );
  }

  private getTrace(payload: ToolPayload): ToolTrace {
    const existingTrace = this.toolTraces.get(payload.toolCallId);

    if (existingTrace) {
      if (payload.toolName !== 'tool') {
        existingTrace.toolName = payload.toolName;
      }

      if (payload.providerExecuted !== undefined) {
        existingTrace.providerExecuted = payload.providerExecuted;
      }

      return existingTrace;
    }

    const trace: ToolTrace = {
      order: this.toolTraces.size + 1,
      toolCallId: payload.toolCallId,
      toolName: payload.toolName,
      providerExecuted: payload.providerExecuted,
      inputBuffer: '',
      status: 'preparing',
      hasLoggedCall: false,
      hasLoggedCompletion: false,
    };

    this.toolTraces.set(payload.toolCallId, trace);
    return trace;
  }

  private inline(label: string, value: string): string {
    return `${colorize(label, logColors.blue)}=${value}`;
  }

  private multiline(label: string, value: string | null): string[] {
    if (!value) {
      return [];
    }

    return [colorize(`${label}:`, logColors.blue), this.indent(value)];
  }

  private indent(value: string): string {
    return value
      .split('\n')
      .map((line) => `    ${line}`)
      .join('\n');
  }

  private print(title: string, lines: string[], level: 'info' | 'success' | 'warn' | 'error' = 'info'): void {
    if (!this.isEnabled) {
      return;
    }

    const color =
      level === 'error'
        ? logColors.red
        : level === 'warn'
          ? logColors.yellow
          : level === 'success'
            ? logColors.green
            : logColors.cyan;
    const output = `\n${colorize(`${LOG_PREFIX} ${title}`, color)}\n${lines
      .filter((line) => line.trim().length > 0)
      .map((line) => `  ${line}`)
      .join(`\n${colorize(`  |`, ANSI_GRAY)} `)}\n`;

    if (level === 'error') {
      console.error(output);
      return;
    }

    if (level === 'warn') {
      console.warn(output);
      return;
    }

    console.log(output);
  }
}
