import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { LanguageModelUsage } from 'ai';
import { ChatMode, ChatStreamCost, SendMessageRequestArray } from 'api-types';
import { getReasoningTokens } from './usage-utils';
import { serializeConversationMessage, sortConversationMessages } from './chat-history';

const IS_LOCAL_ENV = process.env.NODE_ENV !== 'production';
const LOGS_FOLDER = resolve(process.cwd(), 'data/conversation-logs');

interface ToolEventForLog {
  type: string;
  toolCallId: string;
  toolName: string;
  input?: Record<string, unknown> | string;
  output?: unknown;
  error?: string;
}

interface ConversationToolCall {
  toolCallId: string;
  toolName: string;
  input?: Record<string, unknown> | string;
  output?: unknown;
  error?: string;
  status: 'started' | 'in-progress' | 'completed' | 'error';
}

interface RecordConversationParams {
  modelId: string;
  mode: ChatMode;
  systemPrompt: string;
  messages: SendMessageRequestArray;
  reasoning: string;
  finalResponse: string;
  toolEvents: ToolEventForLog[];
  usage?: LanguageModelUsage;
  costUSD?: ChatStreamCost;
  /** Optional context window size in tokens (if known from gateway) */
  contextWindowSize?: number;
}

/**
 * Records a conversation log as Markdown file (local dev only).
 */
export const recordConversationLog = async (params: RecordConversationParams): Promise<void> => {
  if (!IS_LOCAL_ENV) return;

  try {
    await fs.mkdir(LOGS_FOLDER, { recursive: true });

    const logId = generateLogId();
    const sortedMessages = sortConversationMessages(params.messages);
    const toolCalls = processToolEvents(params.toolEvents);

    const inputTokens = params.usage?.inputTokens ?? 0;
    const outputTokens = params.usage?.outputTokens ?? 0;
    const reasoningTokens = getReasoningTokens(params.usage); // Keep undefined if not reported
    const totalTokens = params.usage?.totalTokens ?? 0;

    // Check if provider reports reasoning tokens but we have reasoning content
    const hasReasoningContent = params.reasoning.length > 0;
    const reasoningNotReported = (reasoningTokens === undefined || reasoningTokens === 0) && hasReasoningContent;

    const markdown = buildMarkdown({
      logId,
      modelId: params.modelId,
      mode: params.mode,
      timestamp: new Date().toISOString(),
      systemPrompt: params.systemPrompt,
      messages: sortedMessages,
      reasoning: params.reasoning,
      finalResponse: params.finalResponse,
      toolCalls,
      usage: { inputTokens, outputTokens, reasoningTokens, totalTokens, reasoningNotReported },
      contextWindowSize: params.contextWindowSize,
      costUSD: params.costUSD,
    });

    const filepath = resolve(LOGS_FOLDER, `${logId}.md`);
    await fs.writeFile(filepath, markdown, 'utf8');
    console.log(`[ConversationLog] Saved: ${logId}.md`);
  } catch (error) {
    console.error('[ConversationLog] Failed to save', error);
  }
};

interface MarkdownParams {
  logId: string;
  modelId: string;
  mode: string;
  timestamp: string;
  systemPrompt: string;
  messages: SendMessageRequestArray;
  reasoning: string;
  finalResponse: string;
  toolCalls: ConversationToolCall[];
  usage: { inputTokens: number; outputTokens: number; reasoningTokens?: number; totalTokens: number; reasoningNotReported: boolean };
  contextWindowSize?: number;
  costUSD?: ChatStreamCost;
}

const buildMarkdown = (p: MarkdownParams): string => {
  const lines: string[] = [];

  // Header
  lines.push(`# Conversation Log: ${p.logId}`);
  lines.push('');
  lines.push(`**Timestamp:** ${p.timestamp}`);
  lines.push(`**Model:** ${p.modelId}`);
  lines.push(`**Mode:** ${p.mode}`);
  lines.push('');

  // Usage summary
  lines.push('## 📊 Usage Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Input tokens | ${p.usage.inputTokens.toLocaleString()} |`);
  lines.push(`| Output tokens | ${p.usage.outputTokens.toLocaleString()} |`);
  if (p.usage.reasoningNotReported) {
    lines.push(`| Reasoning tokens | ⚠️ Not reported by provider |`);
  } else if (p.usage.reasoningTokens !== undefined && p.usage.reasoningTokens > 0) {
    lines.push(`| Reasoning tokens | ${p.usage.reasoningTokens.toLocaleString()} |`);
  }
  lines.push(`| **Total tokens** | **${p.usage.totalTokens.toLocaleString()}** |`);

  if (p.contextWindowSize) {
    const usagePercentage = ((p.usage.totalTokens / p.contextWindowSize) * 100).toFixed(2);
    lines.push(
      `| Context window | ${p.usage.totalTokens.toLocaleString()} / ${p.contextWindowSize.toLocaleString()} (${usagePercentage}%) |`,
    );
  }

  if (p.costUSD?.total !== undefined) {
    lines.push(`| **Estimated cost** | **$${p.costUSD.total.toFixed(4)}** |`);
  }
  lines.push('');

  // System prompt (collapsible)
  lines.push('## 🔧 System Prompt');
  lines.push('');
  lines.push('<details>');
  lines.push('<summary>Click to expand system prompt</summary>');
  lines.push('');
  lines.push('```');
  lines.push(p.systemPrompt.trim());
  lines.push('```');
  lines.push('</details>');
  lines.push('');

  // Conversation
  lines.push('## 💬 Conversation');
  lines.push('');

  for (const msg of p.messages) {
    const role = msg.role === 'assistant' ? '🤖 Assistant' : '👤 User';
    lines.push(`### ${role}`);
    if (msg.id) {
      lines.push(`*Message ID: ${msg.id}*`);
    }
    lines.push('');
    lines.push(serializeConversationMessage(msg));
    lines.push('');
  }

  // Reasoning
  if (p.reasoning) {
    lines.push('## 🧠 Reasoning');
    lines.push('');
    lines.push(p.reasoning);
    lines.push('');
  }

  // Tool calls
  if (p.toolCalls.length > 0) {
    lines.push('## 🛠️ Tool Calls');
    lines.push('');

    for (const tool of p.toolCalls) {
      const statusEmoji = tool.status === 'completed' ? '✅' : tool.status === 'error' ? '❌' : '⏳';
      lines.push(`### ${statusEmoji} ${tool.toolName}`);
      lines.push(`*Call ID: ${tool.toolCallId} | Status: ${tool.status}*`);
      lines.push('');

      if (tool.input) {
        lines.push('**Input:**');
        lines.push('```json');
        lines.push(JSON.stringify(tool.input, null, 2));
        lines.push('```');
        lines.push('');
      }

      if (tool.output) {
        lines.push('**Output:**');
        lines.push('```json');
        lines.push(JSON.stringify(tool.output, null, 2));
        lines.push('```');
        lines.push('');
      }

      if (tool.error) {
        lines.push('**Error:**');
        lines.push('```');
        lines.push(tool.error);
        lines.push('```');
        lines.push('');
      }
    }
  }

  // Final response
  lines.push('## ✨ Final Response');
  lines.push('');
  lines.push(p.finalResponse);
  lines.push('');

  return lines.join('\n');
};

const processToolEvents = (events: ToolEventForLog[]): ConversationToolCall[] => {
  const map = new Map<string, ConversationToolCall>();

  for (const e of events) {
    const existing = map.get(e.toolCallId);

    if (e.type === 'tool-input-start') {
      map.set(e.toolCallId, { toolCallId: e.toolCallId, toolName: e.toolName, status: 'started' });
    } else if (e.type === 'tool-input-delta' && existing) {
      existing.status = 'in-progress';
    } else if (e.type === 'tool-input-finished') {
      if (existing) {
        existing.input = e.input;
        existing.status = 'in-progress';
      } else {
        map.set(e.toolCallId, {
          toolCallId: e.toolCallId,
          toolName: e.toolName,
          input: e.input,
          status: 'in-progress',
        });
      }
    } else if (e.type === 'tool-result') {
      if (existing) {
        existing.input = e.input ?? existing.input;
        existing.output = e.output;
        existing.status = 'completed';
      } else {
        map.set(e.toolCallId, {
          toolCallId: e.toolCallId,
          toolName: e.toolName,
          input: e.input,
          output: e.output,
          status: 'completed',
        });
      }
    } else if (e.type === 'tool-error') {
      if (existing) {
        existing.input = e.input ?? existing.input;
        existing.error = e.error;
        existing.status = 'error';
      } else {
        map.set(e.toolCallId, {
          toolCallId: e.toolCallId,
          toolName: e.toolName,
          input: e.input,
          error: e.error,
          status: 'error',
        });
      }
    }
  }

  return Array.from(map.values());
};

const generateLogId = (): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  const rand = Math.random().toString(36).slice(2, 8);
  return `conv-${date}-${time}-${rand}`;
};
