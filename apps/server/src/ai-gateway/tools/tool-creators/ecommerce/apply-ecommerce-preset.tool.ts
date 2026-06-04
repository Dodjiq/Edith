import { Tool } from 'ai';
import { editorToolNames, realtimeMessageTypes } from 'api-types';
import type { AdFormat, EcommercePreset } from '../../../../prompts/ecommerce-prompts';
import {
  applyEcommercePresetInputSchema,
  type ApplyEcommercePresetInput,
  type ApplyEcommercePresetResult,
  type EcommercePresetTemplate,
} from '../../ecommerce/types';
import type { ToolDependencies, ToolsContext } from '../types';

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

const PRESET_TEMPLATES: Record<EcommercePreset, Omit<EcommercePresetTemplate, 'export' | 'editing'> & {
  editing: Omit<EcommercePresetTemplate['editing'], 'crop'>;
}> = {
  ugc_dynamic: {
    captions: { enabled: true, style: 'bold_tiktok', position: 'bottom' },
    editing: {
      remove_silences: true,
      jump_cuts: true,
      zoom_punches: true,
      benefit_overlays: true,
    },
    voiceover: { enabled: false, provider: 'none' },
  },
  ecommerce_ad: {
    captions: { enabled: true, style: 'bold_tiktok', position: 'bottom' },
    editing: {
      remove_silences: false,
      jump_cuts: false,
      zoom_punches: true,
      benefit_overlays: true,
    },
    voiceover: { enabled: false, provider: 'none' },
  },
  product_demo: {
    captions: { enabled: true, style: 'clean_white', position: 'bottom' },
    editing: {
      remove_silences: true,
      jump_cuts: false,
      zoom_punches: false,
      benefit_overlays: true,
    },
    voiceover: { enabled: false, provider: 'none' },
  },
};

function buildTemplate({ preset, format }: ApplyEcommercePresetInput): EcommercePresetTemplate {
  const base = PRESET_TEMPLATES[preset];
  return {
    captions: { ...base.captions },
    editing: {
      ...base.editing,
      crop: CROPS_BY_FORMAT[format],
    },
    voiceover: { ...base.voiceover },
    export: {
      resolution: RESOLUTIONS_BY_FORMAT[format],
      fps: 30,
    },
  };
}

export function createApplyEcommercePresetTool(
  deps: ToolDependencies,
  _context?: ToolsContext,
): Tool<ApplyEcommercePresetInput, ApplyEcommercePresetResult> {
  const description = [
    'Apply a hard-coded e-commerce ad preset to get a partial edit-plan template the agent can merge into adEditPlanSchema variants.',
    'Presets: ugc_dynamic (TikTok UGC vibe), ecommerce_ad (polished product ad), product_demo (clean walkthrough).',
    'Always synchronous; no LLM call. RIGHT TOOL for: "use the UGC preset", "apply ecommerce ad preset", "give me product demo defaults".',
  ].join(' ');

  return {
    description,
    inputSchema: applyEcommercePresetInputSchema,
    execute: async (
      input: ApplyEcommercePresetInput,
      { toolCallId }: { toolCallId?: string },
    ): Promise<ApplyEcommercePresetResult> => {
      const resolvedToolCallId = toolCallId ?? `apply-ecommerce-preset-${Date.now()}`;

      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.system,
        payload: {
          tool_name: editorToolNames.applyEcommercePreset,
          phase: 'start' as const,
          toolCallId: resolvedToolCallId,
          requestedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      const template = buildTemplate(input);
      const payload: ApplyEcommercePresetResult = {
        status: 'completed',
        preset: input.preset,
        format: input.format,
        template,
        source: 'mock',
        note: `Applied preset ${input.preset} for ${input.format}.`,
      };

      deps.realtimeService.dispatchMessage({
        type: realtimeMessageTypes.system,
        payload: {
          tool_name: editorToolNames.applyEcommercePreset,
          phase: 'result' as const,
          toolCallId: resolvedToolCallId,
          result: payload,
          requestedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      return payload;
    },
  } as unknown as Tool<ApplyEcommercePresetInput, ApplyEcommercePresetResult>;
}
