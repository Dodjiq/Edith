import { Tool } from 'ai';
import { ChatRequestContext, ChatRequestContextPart, DigestProjectStateRequest, SendMessageRequestArray } from 'api-types';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { serializeConversationMessage } from './chat-history';

const ESTIMATED_CHARS_PER_TOKEN = 4;
const PROMPT_PREVIEW_LENGTH = 90;

const normalizeText = (value?: string) => value?.trim() ?? '';

const estimateTokens = (text: string) => {
  const normalized = normalizeText(text);

  if (!normalized) {
    return 0;
  }

  return Math.max(1, Math.ceil(normalized.length / ESTIMATED_CHARS_PER_TOKEN));
};

const summarizePrompt = (text: string) => {
  const normalized = normalizeText(text).replace(/\s+/g, ' ');

  if (!normalized) {
    return 'No prompt provided.';
  }

  if (normalized.length <= PROMPT_PREVIEW_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, PROMPT_PREVIEW_LENGTH - 1)}...`;
};

const pluralize = (count: number, singular: string, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

const isZodSchema = (value: unknown): value is { safeParse: (input: unknown) => unknown } =>
  typeof value === 'object' && value !== null && 'safeParse' in value && typeof value.safeParse === 'function';

const zodToJsonSchemaLoose = zodToJsonSchema as (schema: unknown, options?: Record<string, unknown>) => unknown;

const serializeToolDefinitions = (tools: Record<string, Tool>) => {
  const entries = Object.entries(tools).map(([name, tool]) => {
    const rawInputSchema = (tool as { inputSchema?: unknown }).inputSchema;
    const schema = isZodSchema(rawInputSchema)
      ? zodToJsonSchemaLoose(rawInputSchema, {
          $refStrategy: 'none',
          name: `${name}Input`,
          target: 'jsonSchema7',
        })
      : undefined;

    return {
      name,
      description: normalizeText(tool.description),
      inputSchema: schema,
    };
  });

  return JSON.stringify(entries, null, 2);
};

const serializeHistory = (messages: SendMessageRequestArray) =>
  messages
    .map((message) => `[${message.role}] ${serializeConversationMessage(message)}`)
    .join('\n\n')
    .trim();

const summarizeProjectState = (state?: DigestProjectStateRequest) => {
  if (!state) {
    return 'No project snapshot attached.';
  }

  const trackCount = state.tracksInfo.numberOfTracks;
  const itemCount = state.projectItemsInfo.length;
  const assetCount = state.assetsStatusInfo?.length ?? 0;
  const selectedCount = state.selectedItemsInfo.length;

  return [
    pluralize(trackCount, 'track'),
    pluralize(itemCount, 'item'),
    pluralize(assetCount, 'asset'),
    pluralize(selectedCount, 'selected item'),
  ].join(', ');
};

const createPart = ({
  id,
  label,
  summary,
  text,
}: {
  id: ChatRequestContextPart['id'];
  label: string;
  summary: string;
  text: string;
}): ChatRequestContextPart => ({
  id,
  label,
  summary,
  estimatedTokens: estimateTokens(text),
  characters: normalizeText(text).length,
});

export const buildChatRequestContext = ({
  modelId,
  systemPrompt,
  tools,
  history,
  latestPrompt,
  formattedProjectState,
  latestState,
}: {
  modelId: string;
  systemPrompt: string;
  tools: Record<string, Tool>;
  history: SendMessageRequestArray;
  latestPrompt: string;
  formattedProjectState?: string;
  latestState?: DigestProjectStateRequest;
}): ChatRequestContext => {
  const toolsText = serializeToolDefinitions(tools);
  const historyText = serializeHistory(history);
  const projectStateText = formattedProjectState
    ? `<PROJECT_STATE>\n${formattedProjectState}\n</PROJECT_STATE>`
    : '';
  const promptText = normalizeText(latestPrompt)
    ? `<USER_MESSAGE>\n${normalizeText(latestPrompt)}\n</USER_MESSAGE>`
    : '';

  const parts = [
    createPart({
      id: 'system',
      label: 'System instructions',
      summary: 'Workflow, editing rules, captions, and planning guidance.',
      text: systemPrompt,
    }),
    createPart({
      id: 'tools',
      label: 'Tool definitions',
      summary: `${pluralize(Object.keys(tools).length, 'tool')} with descriptions and input schemas.`,
      text: toolsText,
    }),
    createPart({
      id: 'history',
      label: 'Conversation history',
      summary: history.length > 0 ? `${pluralize(history.length, 'previous message')}.` : 'No previous messages.',
      text: historyText,
    }),
    createPart({
      id: 'project-state',
      label: 'Project snapshot',
      summary: summarizeProjectState(latestState),
      text: projectStateText,
    }),
    createPart({
      id: 'prompt',
      label: 'Latest prompt',
      summary: summarizePrompt(latestPrompt),
      text: promptText,
    }),
  ].filter((part) => part.characters > 0 || part.id === 'history');

  return {
    modelId,
    estimatedInputTokens: parts.reduce((total, part) => total + part.estimatedTokens, 0),
    parts,
  };
};
