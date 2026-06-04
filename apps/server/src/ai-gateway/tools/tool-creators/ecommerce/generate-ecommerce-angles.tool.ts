import { generateObject, Tool } from 'ai';
import { editorToolNames, realtimeMessageTypes } from 'api-types';
import {
  buildAnglePrompt,
  type AngleKey,
} from '../../../../prompts/ecommerce-prompts';
import {
  ecommerceAngleSchema,
  generateEcommerceAnglesInputSchema,
  generateEcommerceAnglesOutputSchema,
  type EcommerceAngle,
  type GenerateEcommerceAnglesInput,
  type GenerateEcommerceAnglesOutput,
  type GenerateEcommerceAnglesResult,
} from '../../ecommerce/types';
import type { ToolDependencies, ToolsContext } from '../types';

const ECOMMERCE_ANGLE_MODEL_ID = 'openai/gpt-4o-mini';

function buildMockAngles({
  productName,
  productBenefits,
  productCategory,
  targetAudience,
}: GenerateEcommerceAnglesInput): EcommerceAngle[] {
  const primaryBenefit = productBenefits[0] ?? 'a clear, immediate benefit';
  const secondaryBenefit = productBenefits[1] ?? primaryBenefit;
  const audience = targetAudience ?? 'busy customers';
  const category = productCategory ?? 'product';

  return [
    {
      key: 'benefit' satisfies AngleKey,
      headline: `${productName}: ${primaryBenefit}`,
      body: `Show off the single biggest reason ${audience} love ${productName} — ${primaryBenefit}.`,
      idealHookStyle: 'punchy-benefit-statement',
    },
    {
      key: 'problem_solution' satisfies AngleKey,
      headline: `Tired of the old ${category}? Try ${productName}.`,
      body: `Open on the frustration ${audience} feel today, then reveal ${productName} as the fix that delivers ${secondaryBenefit}.`,
      idealHookStyle: 'pain-point-question',
    },
    {
      key: 'social_proof' satisfies AngleKey,
      headline: `Why ${audience} keep buying ${productName}`,
      body: `Lead with a testimonial or rating, then show ${productName} delivering on ${primaryBenefit}.`,
      idealHookStyle: 'testimonial-quote',
    },
  ];
}

export function createGenerateEcommerceAnglesTool(
  deps: ToolDependencies,
  _context?: ToolsContext,
): Tool<GenerateEcommerceAnglesInput, GenerateEcommerceAnglesResult> {
  const description = [
    'Generate 3-5 marketing angles for a product. Use BEFORE writing hooks or planning ad edits.',
    'Each angle picks one of: benefit, problem_solution, social_proof, demo, objection.',
    'RIGHT TOOL for user wording like: "what angles should I use", "give me ad angles", "marketing angles for X", or as the first step of an ecommerce ad workflow.',
  ].join(' ');

  return {
    description,
    inputSchema: generateEcommerceAnglesInputSchema,
    execute: async (
      input: GenerateEcommerceAnglesInput,
      { toolCallId }: { toolCallId?: string },
    ): Promise<GenerateEcommerceAnglesResult> => {
      const resolvedToolCallId = toolCallId ?? `generate-ecommerce-angles-${Date.now()}`;

      // Notify frontend the tool started
      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.system,
        payload: {
          tool_name: editorToolNames.generateEcommerceAngles,
          phase: 'start' as const,
          toolCallId: resolvedToolCallId,
          requestedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      const shouldMock =
        process.env.MOCK_AI_TOOLS === 'true' || !process.env.OPENAI_API_KEY;

      try {
        let angles: EcommerceAngle[];
        let source: 'model' | 'mock';

        if (shouldMock) {
          angles = buildMockAngles(input);
          source = 'mock';
        } else {
          const prompt = buildAnglePrompt(input);
          const model = deps.getLanguageModel(ECOMMERCE_ANGLE_MODEL_ID);
          const generation = await generateObject({
            model,
            schema: generateEcommerceAnglesOutputSchema,
            prompt,
          });
          const parsed = generation.object as GenerateEcommerceAnglesOutput;
          angles = parsed.angles.map((angle) => ecommerceAngleSchema.parse(angle));
          source = 'model';
        }

        const payload: GenerateEcommerceAnglesResult = {
          status: 'completed',
          angles,
          source,
          note: `Generated ${angles.length} angle(s) via ${source}.`,
        };

        deps.realtimeService.dispatchMessage({
          type: realtimeMessageTypes.system,
          payload: {
            tool_name: editorToolNames.generateEcommerceAngles,
            phase: 'result' as const,
            toolCallId: resolvedToolCallId,
            result: payload,
            requestedAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });

        return payload;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        deps.logger?.warn(`generateEcommerceAngles failed: ${message}`);

        const failurePayload: GenerateEcommerceAnglesResult = {
          status: 'error',
          source: 'model',
          error: message,
          note: 'Falling back to mock would lose model context; returning error so the agent can retry.',
        };

        deps.realtimeService.dispatchMessage({
          type: realtimeMessageTypes.system,
          payload: {
            tool_name: editorToolNames.generateEcommerceAngles,
            phase: 'error' as const,
            toolCallId: resolvedToolCallId,
            error: message,
            requestedAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });

        return failurePayload;
      }
    },
  } as unknown as Tool<GenerateEcommerceAnglesInput, GenerateEcommerceAnglesResult>;
}
