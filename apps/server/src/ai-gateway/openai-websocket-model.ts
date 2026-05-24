import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { createWebSocketFetch } from 'ai-sdk-openai-websocket-fetch';

export interface OpenAIWebSocketModelConfig {
  apiKey: string;
  modelId: string;
  baseURL?: string;
  organization?: string;
  project?: string;
}

export interface OpenAIWebSocketModelHandle {
  model: LanguageModel;
  close: () => void;
}

export function createOpenAIWebSocketModel({
  apiKey,
  modelId,
  baseURL,
  organization,
  project,
}: OpenAIWebSocketModelConfig): OpenAIWebSocketModelHandle {
  const webSocketUrl = buildOpenAIResponsesWebSocketUrl(baseURL);
  const wsFetch = createWebSocketFetch(webSocketUrl ? { url: webSocketUrl } : undefined);
  const openai = createOpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
    ...(organization ? { organization } : {}),
    ...(project ? { project } : {}),
    fetch: wsFetch,
  });

  return {
    model: openai.responses(stripOpenAIProviderPrefix(modelId)),
    close: () => wsFetch.close(),
  };
}

function stripOpenAIProviderPrefix(modelId: string): string {
  return modelId.startsWith('openai/') ? modelId.slice('openai/'.length) : modelId;
}

function buildOpenAIResponsesWebSocketUrl(baseURL?: string): string | undefined {
  if (!baseURL) {
    return undefined;
  }

  const url = new URL(baseURL);
  url.protocol = url.protocol === 'http:' ? 'ws:' : 'wss:';
  url.pathname = `${url.pathname.replace(/\/$/, '')}/responses`;
  url.search = '';
  url.hash = '';
  return url.toString();
}
