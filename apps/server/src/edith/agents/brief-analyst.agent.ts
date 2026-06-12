import { generateText, createGateway } from 'ai';

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY ?? '' });

export type BriefAnalysis = {
  mainObjective: string;
  targetAudience: string;
  keyMessages: string[];
  suggestedAngles: string[];
};

export async function analyzeBrief(params: {
  instructions: string;
  platform: string;
  preset: string;
  assetCount: number;
}): Promise<BriefAnalysis> {
  const { text } = await generateText({
    model: gateway('claude-sonnet-4-6'),
    system: 'Tu es un expert en publicité vidéo e-commerce. Réponds uniquement en JSON valide.',
    prompt: `Analyse ce brief publicitaire et retourne un JSON BriefAnalysis:\n${JSON.stringify(params)}`,
  });
  return JSON.parse(text) as BriefAnalysis;
}
