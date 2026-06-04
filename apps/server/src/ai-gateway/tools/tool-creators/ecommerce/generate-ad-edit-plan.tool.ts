import { generateObject, Tool } from 'ai';
import { editorToolNames, realtimeMessageTypes } from 'api-types';
import { ECOMMERCE_SYSTEM_PRIMER, type AdFormat } from '../../../../prompts/ecommerce-prompts';
import {
  adEditPlanSchema,
  generateAdEditPlanInputSchema,
  type AdEditPlan,
  type AdEditPlanVariant,
  type GenerateAdEditPlanInput,
  type GenerateAdEditPlanResult,
} from '../../ecommerce/types';
import type { ToolDependencies, ToolsContext } from '../types';

const PLAN_MODEL_ID = 'openai/gpt-4o-mini';

const RESOLUTIONS_BY_FORMAT: Record<AdFormat, string> = {
  '9:16': '1080x1920',
  '1:1': '1080x1080',
  '16:9': '1920x1080',
};

const CROPS_BY_FORMAT: Record<AdFormat, string> = {
  '9:16': 'center-vertical',
  '1:1': 'center-square',
  '16:9': 'center-horizontal',
};

function buildMockPlan({
  angle,
  variantsCount,
  format,
}: GenerateAdEditPlanInput): AdEditPlan {
  const variants: AdEditPlanVariant[] = Array.from({ length: variantsCount }, (_, index) => ({
    name: `${angle}-variant-${index + 1}`,
    angle,
    duration_target_seconds: 25 + index * 5,
    hook_text: `Stop scrolling — variant ${index + 1}`,
    captions: {
      enabled: true,
      style: 'bold_tiktok' as const,
      position: 'bottom' as const,
    },
    editing: {
      remove_silences: true,
      crop: CROPS_BY_FORMAT[format],
      jump_cuts: true,
      zoom_punches: true,
      benefit_overlays: true,
    },
    voiceover: {
      enabled: false,
      provider: 'none' as const,
    },
    export: {
      resolution: RESOLUTIONS_BY_FORMAT[format],
      fps: 30,
    },
  }));

  return { variants };
}

function buildPlanPrompt(input: GenerateAdEditPlanInput): string {
  const segmentsBlock = input.transcriptionSegments?.length
    ? `Transcript segments (start-end seconds):\n${input.transcriptionSegments
        .slice(0, 60)
        .map((s) => `[${s.start.toFixed(2)}-${s.end.toFixed(2)}] ${s.text}`)
        .join('\n')}`
    : 'No transcription available; produce general defaults.';

  return [
    ECOMMERCE_SYSTEM_PRIMER,
    `Project: ${input.projectId}`,
    `Angle: ${input.angle}`,
    `Format: ${input.format} (resolution ${RESOLUTIONS_BY_FORMAT[input.format]}, crop ${CROPS_BY_FORMAT[input.format]})`,
    `Variants to produce: ${input.variantsCount}`,
    input.instructions ? `Additional instructions: ${input.instructions}` : undefined,
    segmentsBlock,
    'Produce an ad edit plan with the requested number of variants. Each variant fully specifies captions, editing, voiceover, and export blocks per the provided schema.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function createGenerateAdEditPlanTool(
  deps: ToolDependencies,
  _context?: ToolsContext,
): Tool<GenerateAdEditPlanInput, GenerateAdEditPlanResult> {
  const description = [
    'Produce a STRUCTURED ad edit plan covering multiple variants for an e-commerce video.',
    'Use AFTER picking an angle (generateEcommerceAngles) and ideally hooks (generateHookVariants).',
    'Each plan variant carries: name, angle, duration_target_seconds, hook_text, captions, editing, voiceover, export.',
    'Format must be one of 9:16, 1:1, 16:9. variantsCount between 1 and 10.',
  ].join(' ');

  return {
    description,
    inputSchema: generateAdEditPlanInputSchema,
    execute: async (
      input: GenerateAdEditPlanInput,
      { toolCallId }: { toolCallId?: string },
    ): Promise<GenerateAdEditPlanResult> => {
      const resolvedToolCallId = toolCallId ?? `generate-ad-edit-plan-${Date.now()}`;

      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.system,
        payload: {
          tool_name: editorToolNames.generateAdEditPlan,
          phase: 'start' as const,
          toolCallId: resolvedToolCallId,
          requestedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      const shouldMock =
        process.env.MOCK_AI_TOOLS === 'true' || !process.env.OPENAI_API_KEY;

      try {
        let plan: AdEditPlan;
        let source: 'model' | 'mock';

        if (shouldMock) {
          plan = buildMockPlan(input);
          source = 'mock';
        } else {
          const model = deps.getLanguageModel(PLAN_MODEL_ID);
          const generation = await generateObject({
            model,
            schema: adEditPlanSchema,
            prompt: buildPlanPrompt(input),
          });
          const parsed = generation.object as AdEditPlan;
          // Trim to requested count in case the model overshoots.
          plan = {
            variants: parsed.variants.slice(0, input.variantsCount),
          };
          source = 'model';
        }

        const payload: GenerateAdEditPlanResult = {
          status: 'completed',
          plan,
          source,
          note: `Generated plan with ${plan.variants.length} variant(s) via ${source}.`,
        };

        deps.realtimeService.dispatchMessage({
          type: realtimeMessageTypes.system,
          payload: {
            tool_name: editorToolNames.generateAdEditPlan,
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
        deps.logger?.warn(`generateAdEditPlan failed: ${message}`);

        const failurePayload: GenerateAdEditPlanResult = {
          status: 'error',
          source: 'model',
          error: message,
        };

        deps.realtimeService.dispatchMessage({
          type: realtimeMessageTypes.system,
          payload: {
            tool_name: editorToolNames.generateAdEditPlan,
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
  } as unknown as Tool<GenerateAdEditPlanInput, GenerateAdEditPlanResult>;
}
