export const motionDesignCategories = [
  'text',
  'typewriter',
  'code',
  'gradient',
  'particles',
  'motion',
  'data',
  '3d',
  'showcase',
  'chat',
  'social',
  'frames',
  'gaia',
] as const;

export type MotionDesignCategory = (typeof motionDesignCategories)[number];

export type MotionDesignDirection = 'left' | 'right' | 'up' | 'down';

export type MotionDesignSource = 'framedeck' | 'motion-studio';

export type MotionDesignPropValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | Record<string, unknown>
  | Record<string, unknown>[];

export type MotionDesignTemplateProps = Record<string, MotionDesignPropValue | undefined> & {
  text?: string;
  secondaryText?: string;
  label?: string;
  value?: number;
  endValue?: number;
  prefix?: string;
  suffix?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  density?: number;
  intensity?: number;
  direction?: MotionDesignDirection;
  items?: string[] | string;
  code?: string;
  commandLines?: string[] | string;
  seed?: string;
  typingSpeed?: number;
  lineRevealIntervalFrames?: number;
  staggerFrames?: number;
};

export type MotionDesignControlDefinition = {
  key: string;
  label: string;
  type?:
  | 'text'
  | 'textarea'
  | 'number'
  | 'color'
  | 'select'
  | 'switch'
  | 'image'
  | 'chat'
  | 'scenario'
  | 'composition'
  | 'slots'
  | 'innerProps'
  | 'imageList'
  | 'terminalLines'
  | 'iconPreset'
  | 'section';
  kind?: string;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  placeholder?: string;
  options?: readonly ({ value: string; label: string } | string)[];
  fields?: readonly MotionDesignControlDefinition[];
  [key: string]: unknown;
};

export type MotionDesignNativeSize = {
  width: number;
  height: number;
  fps: number;
};

export type MotionDesignTemplate = {
  id: string;
  source: MotionDesignSource;
  sourceBit: string;
  motionStudioId?: string;
  label: string;
  category: MotionDesignCategory;
  description: string;
  detail?: string;
  tags: string[];
  defaultDurationInFrames: number;
  defaultProps: MotionDesignTemplateProps;
  controls: readonly MotionDesignControlDefinition[];
  defaultBox?: 'center' | 'full-frame';
  nativeSize?: MotionDesignNativeSize;
  brandMode?: 'branded' | 'locked';
  phoneFitMode?: 'cover' | 'width' | 'contain';
  supportsEffects?: boolean;
};

export type MotionDesignTemplateId = string;

export type MotionDesignTemplateWithAgentDescription = MotionDesignTemplate & {
  agentDescription: string;
};

export type MotionDesignEffectDefinition = {
  id: string;
  title: string;
  description: string;
  trigger: 'enter' | 'exit' | 'loop' | 'range';
  defaultProps: Record<string, MotionDesignPropValue | undefined>;
  fields: readonly MotionDesignControlDefinition[];
};

export type MotionDesignEffectInput = {
  id: string;
  effectId: string;
  props: Record<string, MotionDesignPropValue | undefined>;
};
