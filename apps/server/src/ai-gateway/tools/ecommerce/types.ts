import { z } from 'zod';
import {
  AD_FORMATS,
  ANGLE_KEYS,
  CAPTION_POSITIONS,
  CAPTION_STYLES,
  ECOMMERCE_PRESETS,
  HOOK_TONES,
  VOICEOVER_PROVIDERS,
} from '../../../prompts/ecommerce-prompts';

// ============================================
// Shared enums (zod)
// ============================================

export const angleKeySchema = z.enum(ANGLE_KEYS);
export const hookToneSchema = z.enum(HOOK_TONES);
export const adFormatSchema = z.enum(AD_FORMATS);
export const captionStyleSchema = z.enum(CAPTION_STYLES);
export const captionPositionSchema = z.enum(CAPTION_POSITIONS);
export const voiceoverProviderSchema = z.enum(VOICEOVER_PROVIDERS);
export const ecommercePresetSchema = z.enum(ECOMMERCE_PRESETS);

export const adLanguageSchema = z.enum(['fr', 'en']);
export type AdLanguage = z.infer<typeof adLanguageSchema>;

// ============================================
// generateEcommerceAngles
// ============================================

export const generateEcommerceAnglesInputSchema = z.object({
  productName: z.string().trim().min(1, 'productName is required'),
  productBenefits: z
    .array(z.string().trim().min(1))
    .min(1, 'Provide at least one product benefit'),
  productCategory: z.string().trim().min(1).optional(),
  targetAudience: z.string().trim().min(1).optional(),
});
export type GenerateEcommerceAnglesInput = z.infer<typeof generateEcommerceAnglesInputSchema>;

export const ecommerceAngleSchema = z.object({
  key: angleKeySchema,
  headline: z.string().min(1),
  body: z.string().min(1),
  idealHookStyle: z.string().min(1),
});
export type EcommerceAngle = z.infer<typeof ecommerceAngleSchema>;

export const generateEcommerceAnglesOutputSchema = z.object({
  angles: z.array(ecommerceAngleSchema).min(3).max(5),
});
export type GenerateEcommerceAnglesOutput = z.infer<typeof generateEcommerceAnglesOutputSchema>;

export type GenerateEcommerceAnglesResult = {
  status: 'completed' | 'error';
  angles?: EcommerceAngle[];
  source: 'model' | 'mock';
  note?: string;
  error?: string;
};

// ============================================
// generateHookVariants
// ============================================

export const generateHookVariantsInputSchema = z.object({
  productName: z.string().trim().min(1, 'productName is required'),
  angle: angleKeySchema,
  tone: hookToneSchema.optional(),
  count: z.number().int().min(1).max(20).optional(),
});
export type GenerateHookVariantsInput = z.infer<typeof generateHookVariantsInputSchema>;

export const hookVariantSchema = z.object({
  hook: z.string().min(1),
  durationHintSeconds: z.number().min(1).max(10),
  language: adLanguageSchema,
});
export type HookVariant = z.infer<typeof hookVariantSchema>;

export const generateHookVariantsOutputSchema = z.object({
  hooks: z.array(hookVariantSchema).min(1),
});
export type GenerateHookVariantsOutput = z.infer<typeof generateHookVariantsOutputSchema>;

export type GenerateHookVariantsResult = {
  status: 'completed' | 'error';
  hooks?: HookVariant[];
  source: 'model' | 'mock';
  note?: string;
  error?: string;
};

// ============================================
// generateAdEditPlan
// ============================================

export const transcriptionSegmentSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string(),
});
export type TranscriptionSegment = z.infer<typeof transcriptionSegmentSchema>;

export const generateAdEditPlanInputSchema = z.object({
  projectId: z.string().trim().min(1, 'projectId is required'),
  transcriptionSegments: z.array(transcriptionSegmentSchema).optional(),
  instructions: z.string().trim().optional(),
  angle: z.string().trim().min(1, 'angle is required'),
  variantsCount: z.number().int().min(1).max(10),
  format: adFormatSchema,
});
export type GenerateAdEditPlanInput = z.infer<typeof generateAdEditPlanInputSchema>;

export const adEditPlanVariantSchema = z.object({
  name: z.string().min(1),
  angle: z.string().min(1),
  duration_target_seconds: z.number().positive(),
  hook_text: z.string().min(1),
  captions: z.object({
    enabled: z.boolean(),
    style: captionStyleSchema,
    position: captionPositionSchema,
  }),
  editing: z.object({
    remove_silences: z.boolean(),
    crop: z.string().min(1),
    jump_cuts: z.boolean(),
    zoom_punches: z.boolean(),
    benefit_overlays: z.boolean(),
  }),
  voiceover: z.object({
    enabled: z.boolean(),
    provider: voiceoverProviderSchema,
  }),
  export: z.object({
    resolution: z.string().min(1),
    fps: z.number().int().positive(),
  }),
});
export type AdEditPlanVariant = z.infer<typeof adEditPlanVariantSchema>;

export const adEditPlanSchema = z.object({
  variants: z.array(adEditPlanVariantSchema).min(1),
});
export type AdEditPlan = z.infer<typeof adEditPlanSchema>;

export type GenerateAdEditPlanResult = {
  status: 'completed' | 'error';
  plan?: AdEditPlan;
  source: 'model' | 'mock';
  note?: string;
  error?: string;
};

// ============================================
// applyEcommercePreset
// ============================================

export const applyEcommercePresetInputSchema = z.object({
  preset: ecommercePresetSchema,
  format: adFormatSchema,
});
export type ApplyEcommercePresetInput = z.infer<typeof applyEcommercePresetInputSchema>;

/** Partial template the caller merges into an AdEditPlanVariant. */
export type EcommercePresetTemplate = {
  captions: {
    enabled: boolean;
    style: z.infer<typeof captionStyleSchema>;
    position: z.infer<typeof captionPositionSchema>;
  };
  editing: {
    remove_silences: boolean;
    crop: string;
    jump_cuts: boolean;
    zoom_punches: boolean;
    benefit_overlays: boolean;
  };
  voiceover: {
    enabled: boolean;
    provider: z.infer<typeof voiceoverProviderSchema>;
  };
  export: {
    resolution: string;
    fps: number;
  };
};

export type ApplyEcommercePresetResult = {
  status: 'completed';
  preset: z.infer<typeof ecommercePresetSchema>;
  format: z.infer<typeof adFormatSchema>;
  template: EcommercePresetTemplate;
  source: 'mock';
  note?: string;
};
