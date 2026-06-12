import { generateText, createGateway } from 'ai';
import type { BriefAnalysis } from './brief-analyst.agent';

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY ?? '' });

export type CreativeStrategy = {
  variants: Array<{
    name: string;
    marketingAngle: string;
    hookText: string;
    callToAction: string;
  }>;
};

export async function buildCreativeStrategy(params: {
  brief: BriefAnalysis;
  variantsCount: number;
  platform: string;
}): Promise<CreativeStrategy> {
  const { text } = await generateText({
    model: gateway('claude-sonnet-4-6'),
    system: 'Tu es un stratège créatif en publicité vidéo. Réponds uniquement en JSON valide.',
    prompt: `Crée ${params.variantsCount} variantes créatives pour: ${JSON.stringify(params)}`,
  });
  return JSON.parse(text) as CreativeStrategy;
}
