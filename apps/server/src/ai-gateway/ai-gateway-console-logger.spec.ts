import { AiGatewayConsoleLogger } from './ai-gateway-console-logger';

describe('AiGatewayConsoleLogger', () => {
  const env = process.env as Record<string, string | undefined>;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalNoColor = process.env.NO_COLOR;

  beforeEach(() => {
    env.NODE_ENV = 'development';
    env.NO_COLOR = '1';
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    env.NODE_ENV = originalNodeEnv;
    env.NO_COLOR = originalNoColor;
    jest.restoreAllMocks();
  });

  const createLogger = () =>
    new AiGatewayConsoleLogger({
      messageId: 'message-123',
      mode: 'smart',
      modelId: 'openai/gpt-5.4',
      provider: 'openai',
      transport: 'openai-websocket',
      latestPrompt: 'Remove the silences and add captions.',
      editorPrompt: '<USER_MESSAGE>\nRemove the silences and add captions.\n</USER_MESSAGE>',
      systemPrompt: 'You are an expert video editor assistant.',
      providerOptions: {
        openai: {
          reasoningEffort: 'high',
        },
      },
      toolNames: ['remove_silences', 'set_captions'],
      requestContext: {
        modelId: 'openai/gpt-5.4',
        estimatedInputTokens: 1234,
        parts: [
          {
            id: 'prompt',
            label: 'Latest prompt',
            summary: 'Prompt summary',
            estimatedTokens: 12,
            characters: 42,
          },
        ],
      },
    });

  it('logs the request start with prompt previews', () => {
    const logger = createLogger();

    logger.start();

    expect(console.log).toHaveBeenCalledTimes(1);
    const output = (console.log as jest.Mock).mock.calls[0][0] as string;

    expect(output).toContain('[AI Gateway] request started');
    expect(output).toContain('mode=smart');
    expect(output).toContain('model=openai/gpt-5.4');
    expect(output).toContain('user message:');
    expect(output).toContain('Remove the silences and add captions.');
    expect(output).toContain('provider options:');
  });

  it('logs tool lifecycle and completion summary', () => {
    const logger = createLogger();

    logger.captureToolInputStart({
      toolCallId: 'tool-1',
      toolName: 'remove_silences',
      providerExecuted: false,
    });
    logger.captureToolInputDelta('tool-1', '{"itemIds":["item-1"]}');
    logger.captureToolInputFinished({
      toolCallId: 'tool-1',
      toolName: 'remove_silences',
      providerExecuted: false,
    });
    logger.logToolCall({
      toolCallId: 'tool-1',
      toolName: 'remove_silences',
      input: { itemIds: ['item-1'] },
      providerExecuted: false,
    });
    logger.logToolResult({
      toolCallId: 'tool-1',
      toolName: 'remove_silences',
      output: { removedCount: 2 },
      providerExecuted: false,
    });
    logger.complete({
      completion: 'Done. I removed the silences.',
      reasoning: 'The request is clear and remove_silences is the right tool.',
      usage: {
        inputTokens: 100,
        inputTokenDetails: {
          noCacheTokens: 100,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
        },
        outputTokens: 20,
        outputTokenDetails: {
          textTokens: 12,
          reasoningTokens: 8,
        },
        totalTokens: 120,
      },
      costUSD: {
        total: 0.0123,
        input: 0.004,
        output: 0.003,
        reasoning: 0.0053,
      },
    });

    const output = (console.log as jest.Mock).mock.calls.map((call) => call[0] as string).join('\n');

    expect(output).toContain('[AI Gateway] tool call #1 remove_silences');
    expect(output).toContain('[AI Gateway] tool result #1 remove_silences');
    expect(output).toContain('[AI Gateway] request completed');
    expect(output).toContain('tools=#1 remove_silences:completed');
    expect(output).toContain('reasoning:');
    expect(output).toContain('Done. I removed the silences.');
  });

  it('logs failures with the error stack', () => {
    const logger = createLogger();

    logger.failed(new Error('boom'));

    expect(console.error).toHaveBeenCalledTimes(1);
    const output = (console.error as jest.Mock).mock.calls[0][0] as string;

    expect(output).toContain('[AI Gateway] request failed');
    expect(output).toContain('boom');
  });
});
