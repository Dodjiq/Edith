import type { MotionDesignTemplateProps } from './motion-design';

export type MotionDesignTimingUnit = 'characters' | 'lines' | 'items' | 'none';

export type MotionDesignTimingCheck = {
  templateId: string;
  unit: MotionDesignTimingUnit;
  contentUnits: number;
  requestedFramesPerUnit: number;
  effectiveFramesPerUnit: number;
  completionFrame: number;
  availableFrames: number;
  completesBeforeEnd: boolean;
  autoFitApplied: boolean;
  note: string;
};

type MotionDesignTimingInput = {
  templateId: string;
  props?: MotionDesignTemplateProps;
  durationInFrames: number;
};

const COMPLETION_HOLD_FRAMES = 6;

const clampPositive = (value: number | undefined, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;

const getMotionText = (props: MotionDesignTemplateProps | undefined, fallback: string) =>
  props?.text?.trim() || props?.label?.trim() || fallback;

const getMotionItems = (props: MotionDesignTemplateProps | undefined, fallback: string[]) => {
  if (Array.isArray(props?.items) && props.items.length) return props.items;
  if (typeof props?.items === 'string' && props.items.trim()) {
    return props.items
      .split(/[,\n|]/u)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return getMotionText(props, fallback.join('|'))
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
};

const getTypewriterText = (props: MotionDesignTemplateProps | undefined) =>
  (Array.isArray(props?.commandLines) ? props.commandLines.join('\n') : props?.commandLines) ??
  getMotionText(props, 'Typing a precise thought.').replace(/\|/g, '\n');

const getTimingShape = ({ templateId, props }: Pick<MotionDesignTimingInput, 'templateId' | 'props'>) => {
  if (templateId === 'typing-code-block') {
    return {
      unit: 'characters' as const,
      contentUnits: (props?.code ?? 'const motion = true;').length,
      requestedFramesPerUnit: 2 / clampPositive(props?.typingSpeed, 1),
    };
  }

  if (templateId === 'basic-code-block') {
    return {
      unit: 'lines' as const,
      contentUnits: (props?.code ?? 'const motion = true;').split('\n').filter(Boolean).length,
      requestedFramesPerUnit: clampPositive(props?.lineRevealIntervalFrames, 12),
    };
  }

  if (
    ['basic-typewriter', 'cli-simulation', 'multitext-typewriter', 'variable-speed-typewriter', 'terminal-3d'].includes(
      templateId,
    )
  ) {
    return {
      unit: 'characters' as const,
      contentUnits: getTypewriterText(props).length,
      requestedFramesPerUnit: 3 / clampPositive(props?.typingSpeed ?? props?.intensity, 1),
    };
  }

  if (
    ['blur-word-title', 'fade-in-text', 'word-by-word', 'character-by-character', 'slide-from-left'].includes(templateId)
  ) {
    const text = getMotionText(props, 'Motion');
    return {
      unit: 'items' as const,
      contentUnits: templateId === 'character-by-character' ? text.length : text.split(/\s+/).filter(Boolean).length,
      requestedFramesPerUnit: clampPositive(props?.staggerFrames, 3),
    };
  }

  if (
    [
      'staggered-fade-in',
      'list-reveal',
      'card-stack-3d',
      'elements-3d-scene',
      'carousel-3d',
      'cube-navigation-3d',
      'step-timing-context',
    ].includes(templateId)
  ) {
    return {
      unit: 'items' as const,
      contentUnits: getMotionItems(props, ['Plan', 'Edit', 'Render']).length,
      requestedFramesPerUnit: clampPositive(props?.staggerFrames, 8),
    };
  }

  if (['grid-stagger', 'mosaic-reframe', 'fracture-reassemble', 'easings-visualizer'].includes(templateId)) {
    return {
      unit: 'items' as const,
      contentUnits: 16,
      requestedFramesPerUnit: clampPositive(props?.staggerFrames, 2),
    };
  }

  return {
    unit: 'none' as const,
    contentUnits: 0,
    requestedFramesPerUnit: 0,
  };
};

export const getMotionDesignTimingCheck = ({
  templateId,
  props,
  durationInFrames,
}: MotionDesignTimingInput): MotionDesignTimingCheck => {
  const shape = getTimingShape({ templateId, props });
  const safeDuration = Math.max(1, Math.round(durationInFrames));
  const availableFrames = Math.max(1, safeDuration - COMPLETION_HOLD_FRAMES);

  if (shape.unit === 'none' || shape.contentUnits <= 0) {
    return {
      templateId,
      unit: shape.unit,
      contentUnits: shape.contentUnits,
      requestedFramesPerUnit: 0,
      effectiveFramesPerUnit: 0,
      completionFrame: 0,
      availableFrames,
      completesBeforeEnd: true,
      autoFitApplied: false,
      note: 'Template has no progressive reveal timing.',
    };
  }

  const revealUnits = shape.unit === 'lines' || shape.unit === 'items' ? Math.max(1, shape.contentUnits - 1) : shape.contentUnits;
  const maxFramesPerUnit = availableFrames / revealUnits;
  const requestedFramesPerUnit = clampPositive(shape.requestedFramesPerUnit, 1);
  const effectiveFramesPerUnit = Math.min(requestedFramesPerUnit, maxFramesPerUnit);
  const completionFrame = Math.ceil(revealUnits * effectiveFramesPerUnit);
  const autoFitApplied = effectiveFramesPerUnit < requestedFramesPerUnit;

  return {
    templateId,
    unit: shape.unit,
    contentUnits: shape.contentUnits,
    requestedFramesPerUnit,
    effectiveFramesPerUnit,
    completionFrame,
    availableFrames,
    completesBeforeEnd: completionFrame <= safeDuration,
    autoFitApplied,
    note: autoFitApplied
      ? 'Auto-fit accelerated the reveal so it completes inside the item duration.'
      : 'Reveal completes inside the item duration.',
  };
};
