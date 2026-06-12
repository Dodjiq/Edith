import { generateText, createGateway } from 'ai';

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY ?? '' });

export type EditPlan = {
  scenes: Array<{ assetPath: string; startMs: number; endMs: number; type: string }>;
  captions: Array<{ text: string; startMs: number; endMs: number }>;
  totalDurationMs: number;
};

export async function buildEditPlan(params: {
  variant: { marketingAngle: string; hookText: string };
  assets: Array<{ path: string; durationSeconds: number }>;
  outputFormat: string;
}): Promise<EditPlan> {
  const { text } = await generateText({
    model: gateway('claude-sonnet-4-6'),
    system: 'Tu es un monteur vidéo expert. Réponds uniquement en JSON valide.',
    prompt: `Crée le plan de montage pour: ${JSON.stringify(params)}`,
  });
  return JSON.parse(text) as EditPlan;
}
