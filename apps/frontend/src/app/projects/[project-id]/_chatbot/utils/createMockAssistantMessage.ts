import { ChainOfThoughtStep, ChatMessage, ToolState } from '../types/chatbot';
import { createId } from './createId';

type PromptMeta = {
  webSearch?: boolean;
  model?: string;
};

type MockAssistantArgs = {
  prompt: string;
  attachmentCount?: number;
  meta?: PromptMeta;
};

const SAMPLE_SOURCES = [
  'https://research.voicecheap.ai/editor-overview',
  'https://voicecheap.ai/blog/ai-video-editor',
  'https://docs.voicecheap.ai/product-updates',
];

const TOOL_STATES: ToolState[] = ['input-available', 'output-available', 'approval-requested'];

const pickToolState = (meta?: PromptMeta): ToolState => {
  if (meta?.webSearch) {
    return 'output-available';
  }
  return TOOL_STATES[Math.floor(Math.random() * TOOL_STATES.length)];
};

const buildChainOfThoughtSteps = ({
  prompt,
  meta,
  attachmentCount,
}: {
  prompt: string;
  meta?: PromptMeta;
  attachmentCount?: number;
}): ChainOfThoughtStep[] => {
  const highlightedPrompt = prompt.length > 100 ? `${prompt.slice(0, 97)}…` : prompt;

  const steps: ChainOfThoughtStep[] = [
    {
      id: createId(),
      label: 'Understand the request',
      description: 'Summarize the editing goal from the latest instruction.',
      status: 'complete',
      content: `Key takeaways: ${highlightedPrompt}`,
    },
    {
      id: createId(),
      label: 'Collect references',
      description: meta?.webSearch
        ? 'Using web search to gather supporting resources.'
        : 'Re-using the internal library for stylistic inspiration.',
      status: meta?.webSearch ? 'active' : 'complete',
      searchResults: meta?.webSearch
        ? SAMPLE_SOURCES.map((url) => ({
            id: createId(),
            label: new URL(url).hostname,
            href: url,
          }))
        : undefined,
    },
  ];

  if (attachmentCount && attachmentCount > 0) {
    steps.push({
      id: createId(),
      label: 'Review attachments',
      description: `Detected ${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''} for additional context.`,
      status: 'complete',
      content: 'Extracting beats, colors, and keywords from the provided assets.',
    });
  }

  const finalStep: ChainOfThoughtStep = {
    id: createId(),
    label: 'Draft edit plan',
    description: 'Provide actionable edits, transitions, and overlays.',
    status: 'pending',
    content: 'Preparing final instructions with timing, motion cues, and export notes.',
  };

  if (meta?.webSearch) {
    finalStep.image = {
      alt: 'Reference storyboard still',
      url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
    };
  }

  steps.push(finalStep);

  return steps;
};

const buildToolPart = ({
  prompt,
  meta,
  attachmentCount,
}: {
  prompt: string;
  meta?: PromptMeta;
  attachmentCount?: number;
}) => {
  const state = pickToolState(meta);
  const toolName = meta?.webSearch ? 'web_search' : 'timeline_optimizer';

  return {
    type: 'tool' as const,
    toolCallId: createId(),
    name: toolName,
    state,
    input: {
      prompt,
      model: meta?.model ?? 'openai/gpt-4o',
      webSearch: Boolean(meta?.webSearch),
      attachments: attachmentCount ?? 0,
    },
    output:
      state === 'output-available'
        ? {
            summary: 'Assembled contextual data to support the edit plan.',
            highlights: meta?.webSearch
              ? SAMPLE_SOURCES.map((url) => ({
                  href: url,
                  title: new URL(url).hostname,
                }))
              : ['Reused branded lower thirds', 'Synced captions with beat markers'],
          }
        : undefined,
    errorText: state === 'output-error' ? 'The tool failed to fetch search results.' : undefined,
    title: toolName === 'web_search' ? 'Web search' : 'Timeline optimizer',
  };
};

export const createMockAssistantMessage = ({
  prompt,
  attachmentCount = 0,
  meta,
}: MockAssistantArgs): ChatMessage => {
  const highlightedPrompt = prompt.length > 120 ? `${prompt.slice(0, 117)}…` : prompt;

  const chainOfThoughtPart = {
    type: 'chain-of-thought' as const,
    title: 'Reasoning steps',
    defaultOpen: true,
    steps: buildChainOfThoughtSteps({ prompt, meta, attachmentCount }),
  };

  const sourceParts: ChatMessage['parts'] = SAMPLE_SOURCES.slice(0, 2).map((url) => ({
    type: 'source-url' as const,
    url,
    title: new URL(url).hostname,
  }));

  const baseParts: ChatMessage['parts'] = [
    {
      type: 'reasoning',
      text: meta?.webSearch
        ? 'Streaming reasoning with live search insights...'
        : 'Evaluating your request to outline actionable edits.',
      state: 'complete',
    },
    chainOfThoughtPart,
    buildToolPart({ prompt, meta, attachmentCount }),
    {
      type: 'text',
      text: [
        `Here is a concise plan for "${highlightedPrompt}".`,
        attachmentCount
          ? `I see ${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''}; I will reference them when applying edits.`
          : null,
        meta?.model ? `Model preference: ${meta.model}.` : null,
        meta?.webSearch ? 'Web search was enabled to cross-check facts.' : null,
      ]
        .filter(Boolean)
        .join(' '),
    },
    ...sourceParts,
  ];

  return {
    id: createId(),
    role: 'assistant',
    parts: baseParts,
    messageIndex: 0,
  };
};
