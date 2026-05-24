import {
  getUnsupportedMotionDesignPropKeys,
  motionDesignEffectIds,
  motionDesignKnownPropKeys,
  motionDesignTemplateIds,
  type MotionDesignItemPatchInput,
  type MotionDesignTemplateProps,
} from 'api-types';
import { z } from 'zod';
import type { AddMotionDesignItemsInput, ToolsContext } from './types';

export const motionDesignTemplateIdSchema = z
  .string()
  .trim()
  .refine((value) => (motionDesignTemplateIds as readonly string[]).includes(value), {
    message: 'Unknown motion design template ID',
  });

export const motionDesignPropsSchema = z
  .record(z.unknown())
  .superRefine((props, ctx) => {
    const stringKeys = [
      'text',
      'secondaryText',
      'label',
      'code',
      'prefix',
      'suffix',
      'primaryColor',
      'accentColor',
      'backgroundColor',
      'seed',
    ];
    const numberKeys = [
      'value',
      'endValue',
      'fontSize',
      'density',
      'intensity',
      'typingSpeed',
      'lineRevealIntervalFrames',
      'staggerFrames',
    ];
    stringKeys.forEach((key) => {
      if (props[key] !== undefined && typeof props[key] !== 'string') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} must be a string` });
      }
    });
    numberKeys.forEach((key) => {
      if (props[key] !== undefined && typeof props[key] !== 'number') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} must be a number` });
      }
    });
    ['items', 'commandLines'].forEach((key) => {
      const value = props[key];
      if (
        value !== undefined &&
        typeof value !== 'string' &&
        (!Array.isArray(value) || !value.every((item) => typeof item === 'string'))
      ) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} must be a string or string array` });
      }
    });
    if (props.direction !== undefined && !['left', 'right', 'up', 'down'].includes(String(props.direction))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['direction'], message: 'direction must be left, right, up, or down' });
    }
  })
  .transform((props) => props as MotionDesignTemplateProps);

export const motionDesignEffectsSchema = z.array(
  z
    .object({
      id: z.string().trim().min(1),
      effectId: z
        .string()
        .trim()
        .refine((value) => motionDesignEffectIds.includes(value), {
          message: 'Unknown motion design effect ID',
        }),
      props: z.record(z.unknown()).default({}),
    })
    .strict(),
);

const addUnsupportedPropIssues = ({
  templateId,
  props,
  path,
  ctx,
}: {
  templateId: string;
  props?: MotionDesignTemplateProps;
  path: (string | number)[];
  ctx: z.RefinementCtx;
}) => {
  const unsupportedProps = getUnsupportedMotionDesignPropKeys(templateId, props);
  if (unsupportedProps.length === 0) return;
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message: `Unsupported prop(s) for ${templateId}: ${unsupportedProps.join(', ')}. Supported props: ${motionDesignKnownPropKeys.join(', ')}`,
  });
};

export const motionDesignStyleSchema = z
  .object({
    left: z.number().optional(),
    top: z.number().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    opacity: z.number().min(0).max(1).optional(),
    rotation: z.number().optional(),
    fadeInDurationInSeconds: z.number().min(0).optional(),
    fadeOutDurationInSeconds: z.number().min(0).optional(),
  })
  .strict();

export const motionDesignItemInputSchema = z
  .object({
    templateId: motionDesignTemplateIdSchema,
    startFrame: z.number().int().min(0).optional(),
    startTimeInSeconds: z.number().min(0).optional(),
    durationInFrames: z.number().int().positive().optional(),
    durationInSeconds: z.number().positive().optional(),
    xOnCanvas: z.number().optional(),
    yOnCanvas: z.number().optional(),
    props: motionDesignPropsSchema.optional(),
    effects: motionDesignEffectsSchema.optional(),
    style: motionDesignStyleSchema.optional(),
  })
  .superRefine((item, ctx) => {
    addUnsupportedPropIssues({ templateId: item.templateId, props: item.props, path: ['props'], ctx });
  });

export const motionDesignPatchSchema = motionDesignStyleSchema
  .extend({
    templateId: motionDesignTemplateIdSchema.optional(),
    props: motionDesignPropsSchema.optional(),
    effects: motionDesignEffectsSchema.optional(),
    from: z.number().int().min(0).optional(),
    durationInFrames: z.number().int().positive().optional(),
    startTimeInSeconds: z.number().min(0).optional(),
    durationInSeconds: z.number().positive().optional(),
    xOnCanvas: z.number().optional(),
    yOnCanvas: z.number().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'Provide at least one patch field',
  })
  .superRefine((patch, ctx) => {
    if (!patch.templateId) return;
    addUnsupportedPropIssues({ templateId: patch.templateId, props: patch.props, path: ['props'], ctx });
  });

const hasConflictingTiming = ({ frame, seconds, fps }: { frame?: number; seconds?: number; fps: number }) =>
  frame !== undefined && seconds !== undefined && frame !== Math.round(seconds * fps);

export const validateMotionDesignTimings = ({
  items,
  fps,
}: {
  items: AddMotionDesignItemsInput['items'];
  fps: number;
}) => {
  const invalidItem = items.find(
    (item) =>
      hasConflictingTiming({ frame: item.startFrame, seconds: item.startTimeInSeconds, fps }) ||
      hasConflictingTiming({ frame: item.durationInFrames, seconds: item.durationInSeconds, fps }),
  );

  if (!invalidItem) return null;
  return `Conflicting timing fields for ${invalidItem.templateId}. Frame and seconds values must resolve to the same frame at ${fps}fps.`;
};

const getTemplateIdFromContext = (itemId: string, context?: ToolsContext) => {
  const state = context?.projectState;
  const motionItems = [
    ...(state?.visibleMotionDesignItemsInfo ?? []),
    ...(state?.nearbyOverlayItemsInfo ?? []).filter((item) => item.type === 'motion-design'),
  ];
  const item = motionItems.find((motionItem) => motionItem.itemId === itemId);
  return typeof item?.templateId === 'string' ? item.templateId : undefined;
};

export const validateMotionDesignPatchProps = ({
  itemIds,
  patch,
  context,
}: {
  itemIds: string[];
  patch: MotionDesignItemPatchInput;
  context?: ToolsContext;
}) => {
  if (!patch.props) return null;

  const rejectedProps = new Set<string>();
  for (const itemId of itemIds) {
    const templateId = patch.templateId ?? getTemplateIdFromContext(itemId, context);
    if (!templateId) continue;
    getUnsupportedMotionDesignPropKeys(templateId, patch.props).forEach((prop) => rejectedProps.add(prop));
  }

  if (rejectedProps.size === 0) return null;
  const rejected = Array.from(rejectedProps);
  return {
    rejectedProps: rejected,
    message: `Unsupported motion design prop(s): ${rejected.join(', ')}.`,
  };
};
