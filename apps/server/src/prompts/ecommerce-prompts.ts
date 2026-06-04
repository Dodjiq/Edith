/**
 * Shared prompt fragments for e-commerce ad generation tools.
 * These prompts are tailored for Edith's e-commerce specialization:
 * turning product/UGC videos into ad variants.
 */

export const ECOMMERCE_SYSTEM_PRIMER = [
  'You are an e-commerce ad copy specialist.',
  'You write concise, conversion-oriented copy for short-form video ads (TikTok, Reels, Shorts).',
  'You favor concrete benefit statements over fluffy adjectives.',
  'You write in the language of the target audience; default to French unless the user indicates English.',
].join(' ');

export const ANGLE_KEYS = ['benefit', 'problem_solution', 'social_proof', 'demo', 'objection'] as const;
export type AngleKey = (typeof ANGLE_KEYS)[number];

export const HOOK_TONES = ['energetic', 'reassuring', 'urgent', 'curious'] as const;
export type HookTone = (typeof HOOK_TONES)[number];

export const AD_FORMATS = ['9:16', '1:1', '16:9'] as const;
export type AdFormat = (typeof AD_FORMATS)[number];

export const CAPTION_STYLES = ['bold_tiktok', 'clean_white', 'none'] as const;
export type CaptionStyleKey = (typeof CAPTION_STYLES)[number];

export const CAPTION_POSITIONS = ['bottom', 'top', 'center'] as const;
export type CaptionPosition = (typeof CAPTION_POSITIONS)[number];

export const VOICEOVER_PROVIDERS = ['omni_voice_modal', 'elevenlabs', 'none'] as const;
export type VoiceoverProvider = (typeof VOICEOVER_PROVIDERS)[number];

export const ECOMMERCE_PRESETS = ['ugc_dynamic', 'ecommerce_ad', 'product_demo'] as const;
export type EcommercePreset = (typeof ECOMMERCE_PRESETS)[number];

export function buildAnglePrompt({
  productName,
  productBenefits,
  productCategory,
  targetAudience,
}: {
  productName: string;
  productBenefits: string[];
  productCategory?: string;
  targetAudience?: string;
}): string {
  return [
    ECOMMERCE_SYSTEM_PRIMER,
    `Product: ${productName}`,
    productCategory ? `Category: ${productCategory}` : undefined,
    targetAudience ? `Target audience: ${targetAudience}` : undefined,
    `Key benefits:\n${productBenefits.map((benefit) => `- ${benefit}`).join('\n')}`,
    'Produce 3 to 5 distinct marketing angles. Each angle must pick a different `key` from: benefit, problem_solution, social_proof, demo, objection.',
    'Each angle returns: { key, headline (under 70 chars), body (1-2 sentences), idealHookStyle (short tag like "question" or "stat" or "shock") }.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildHookPrompt({
  productName,
  angle,
  tone,
  count,
}: {
  productName: string;
  angle: AngleKey;
  tone: HookTone;
  count: number;
}): string {
  return [
    ECOMMERCE_SYSTEM_PRIMER,
    `Generate ${count} short video-ad hooks for: ${productName}`,
    `Angle: ${angle}`,
    `Tone: ${tone}`,
    'Each hook is the first 2-3 seconds of a short-form ad. Maximum 12 words.',
    'durationHintSeconds: between 2 and 5.',
    'language: "fr" or "en" depending on what feels natural; default to "fr".',
  ].join('\n');
}
