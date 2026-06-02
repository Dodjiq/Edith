import { z } from 'zod';

export const edithPresets = ['ugc_dynamic', 'ecommerce_ad', 'product_demo'] as const;
export const edithPlatforms = ['tiktok', 'reels', 'facebook_ads', 'shorts'] as const;
export const edithFormats = ['9:16', '1:1', '16:9'] as const;
export const edithLanguages = ['fr', 'en'] as const;

export type EdithPreset = (typeof edithPresets)[number];
export type EdithPlatform = (typeof edithPlatforms)[number];
export type EdithFormat = (typeof edithFormats)[number];
export type EdithLanguage = (typeof edithLanguages)[number];

export type EditPlanVariant = {
  name: string;
  marketingAngle: string;
  hookText: string;
  durationTargetSeconds: number;
  captions: {
    enabled: boolean;
    style: 'bold' | 'clean' | 'ugc';
    position: 'bottom' | 'center';
    highlightKeywords: boolean;
  };
  editing: {
    pace: 'slow' | 'medium' | 'fast';
    removeSilences: boolean;
    zoomPunches: boolean;
    jumpCuts: boolean;
    overlays: Array<{
      text: string;
      start: number;
      end: number;
      position: 'top' | 'center' | 'bottom';
    }>;
  };
  audio: {
    normalize: boolean;
    backgroundMusic: boolean;
    musicVolume: number;
  };
  export: {
    resolution: '1080x1920' | '1080x1080' | '1920x1080';
    fps: 30;
  };
};

export type EditPlan = {
  projectSummary: string;
  platform: EdithPlatform;
  language: EdithLanguage;
  format: EdithFormat;
  preset: EdithPreset;
  variants: EditPlanVariant[];
};

export const editPlanInputSchema = z.object({
  platform: z.enum(edithPlatforms).default('tiktok'),
  language: z.enum(edithLanguages).default('fr'),
  format: z.enum(edithFormats).default('9:16'),
  preset: z.enum(edithPresets).default('ugc_dynamic'),
  variantsCount: z.number().int().min(1).max(5).default(3),
  instructions: z.string().max(2000).default(''),
});

export type EditPlanInput = z.infer<typeof editPlanInputSchema>;

const resolutionByFormat: Record<EdithFormat, EditPlanVariant['export']['resolution']> = {
  '9:16': '1080x1920',
  '1:1': '1080x1080',
  '16:9': '1920x1080',
};

const presetAngles: Record<EdithPreset, string[]> = {
  ugc_dynamic: ['preuve sociale', 'reaction authentique', 'benefice immediat', 'avant apres', 'urgence test creatif'],
  ecommerce_ad: ['benefice produit', 'probleme solution', 'offre claire', 'comparaison', 'callout produit'],
  product_demo: ['demonstration etapes', 'usage simple', 'resultat visible', 'focus detail', 'routine produit'],
};

export const createEditPlanPrompt = (input: EditPlanInput): string => {
  return [
    'Tu generes un plan de montage publicitaire e-commerce pour Edith.',
    'Retourne uniquement du JSON valide, sans texte hors JSON.',
    'Chaque variante doit avoir un angle marketing different.',
    'Interdiction: promesses medicales/fausses, faux temoignages clients, claims trompeurs.',
    `Preset: ${input.preset}`,
    `Plateforme: ${input.platform}`,
    `Format: ${input.format}`,
    `Langue: ${input.language}`,
    `Nombre de variantes: ${input.variantsCount}`,
    `Instructions utilisateur: ${input.instructions || 'Aucune instruction specifique.'}`,
  ].join('\n');
};

export const generateMockEditPlan = (rawInput: Partial<EditPlanInput>): EditPlan => {
  const input = editPlanInputSchema.parse(rawInput);
  const angles = presetAngles[input.preset];

  return {
    projectSummary:
      input.instructions || 'Video produit e-commerce a transformer en variantes publicitaires courtes.',
    platform: input.platform,
    language: input.language,
    format: input.format,
    preset: input.preset,
    variants: Array.from({ length: input.variantsCount }, (_, index) => {
      const angle = angles[index % angles.length];
      return {
        name: `Variante ${index + 1} - ${angle}`,
        marketingAngle: angle,
        hookText: input.language === 'fr' ? 'Regarde ce que ce produit change' : 'See what this product changes',
        durationTargetSeconds: 24,
        captions: {
          enabled: true,
          style: input.preset === 'ugc_dynamic' ? 'ugc' : 'bold',
          position: 'bottom',
          highlightKeywords: true,
        },
        editing: {
          pace: input.preset === 'product_demo' ? 'medium' : 'fast',
          removeSilences: true,
          zoomPunches: input.format === '9:16',
          jumpCuts: input.preset !== 'product_demo',
          overlays: [
            {
              text: input.language === 'fr' ? 'Hook produit' : 'Product hook',
              start: 0,
              end: 3,
              position: 'top',
            },
          ],
        },
        audio: {
          normalize: true,
          backgroundMusic: input.preset !== 'product_demo',
          musicVolume: 0.18,
        },
        export: {
          resolution: resolutionByFormat[input.format],
          fps: 30,
        },
      };
    }),
  };
};
