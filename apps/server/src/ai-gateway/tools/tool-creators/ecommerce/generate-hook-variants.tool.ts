import { generateObject, Tool } from 'ai';
import { editorToolNames, realtimeMessageTypes } from 'api-types';
import { buildHookPrompt, type HookTone } from '../../../../prompts/ecommerce-prompts';
import {
  generateHookVariantsInputSchema,
  generateHookVariantsOutputSchema,
  hookVariantSchema,
  type GenerateHookVariantsInput,
  type GenerateHookVariantsOutput,
  type GenerateHookVariantsResult,
  type HookVariant,
} from '../../ecommerce/types';
import type { ToolDependencies, ToolsContext } from '../types';

const HOOK_MODEL_ID = 'openai/gpt-4o-mini';
const DEFAULT_HOOK_COUNT = 5;
const DEFAULT_HOOK_TONE: HookTone = 'energetic';

function buildMockHooks({
  productName,
  angle,
  tone,
  count,
}: {
  productName: string;
  angle: GenerateHookVariantsInput['angle'];
  tone: HookTone;
  count: number;
}): HookVariant[] {
  const toneAdjective: Record<HookTone, string> = {
    energetic: 'Stop scrolling',
    reassuring: 'Voici pourquoi',
    urgent: 'Dernier jour',
    curious: 'Tu savais que',
  };
  const angleAngle: Record<GenerateHookVariantsInput['angle'], string> = {
    benefit: `${productName} change tout`,
    problem_solution: `${productName} règle ce problème`,
    social_proof: `Tout le monde adopte ${productName}`,
    demo: `Regarde ${productName} en action`,
    objection: `Non, ${productName} n'est pas trop cher`,
  };

  const base = `${toneAdjective[tone]}: ${angleAngle[angle]}`;
  return Array.from({ length: count }, (_, index) => ({
    hook: index === 0 ? base : `${base} (#${index + 1})`,
    durationHintSeconds: 3,
    language: 'fr' as const,
  }));
}

export function createGenerateHookVariantsTool(
  deps: ToolDependencies,
  _context?: ToolsContext,
): Tool<GenerateHookVariantsInput, GenerateHookVariantsResult> {
  const description = [
    'Generate short-form video ad HOOKS (the first 2-3 seconds) for a chosen angle.',
    'Call AFTER generateEcommerceAngles when the user wants concrete opening lines for their ad variants.',
    'RIGHT TOOL for: "give me hook ideas", "write opening lines", "TikTok hooks for X".',
    'Default count is 5; tone defaults to energetic.',
  ].join(' ');

  return {
    description,
    inputSchema: generateHookVariantsInputSchema,
    execute: async (
      input: GenerateHookVariantsInput,
      { toolCallId }: { toolCallId?: string },
    ): Promise<GenerateHookVariantsResult> => {
      const resolvedToolCallId = toolCallId ?? `generate-hook-variants-${Date.now()}`;
      const count = input.count ?? DEFAULT_HOOK_COUNT;
      const tone = input.tone ?? DEFAULT_HOOK_TONE;

      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.system,
        payload: {
          tool_name: editorToolNames.generateHookVariants,
          phase: 'start' as const,
          toolCallId: resolvedToolCallId,
          requestedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      const shouldMock =
        process.env.MOCK_AI_TOOLS === 'true' || !process.env.OPENAI_API_KEY;

      try {
        let hooks: HookVariant[];
        let source: 'model' | 'mock';

        if (shouldMock) {
          hooks = buildMockHooks({ productName: input.productName, angle: input.angle, tone, count });
          source = 'mock';
        } else {
          const prompt = buildHookPrompt({
            productName: input.productName,
            angle: input.angle,
            tone,
            count,
          });
          const model = deps.getLanguageModel(HOOK_MODEL_ID);
          const generation = await generateObject({
            model,
            schema: generateHookVariantsOutputSchema,
            prompt,
          });
          const parsed = generation.object as GenerateHookVariantsOutput;
          hooks = parsed.hooks.slice(0, count).map((hook) => hookVariantSchema.parse(hook));
          source = 'model';
        }

        const payload: GenerateHookVariantsResult = {
          status: 'completed',
          hooks,
          source,
          note: `Generated ${hooks.length} hook(s) via ${source}.`,
        };

        deps.realtimeService.dispatchMessage({
          type: realtimeMessageTypes.system,
          payload: {
            tool_name: editorToolNames.generateHookVariants,
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
        deps.logger?.warn(`generateHookVariants failed: ${message}`);

        const failurePayload: GenerateHookVariantsResult = {
          status: 'error',
          source: 'model',
          error: message,
        };

        deps.realtimeService.dispatchMessage({
          type: realtimeMessageTypes.system,
          payload: {
            tool_name: editorToolNames.generateHookVariants,
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
  } as unknown as Tool<GenerateHookVariantsInput, GenerateHookVariantsResult>;
}
