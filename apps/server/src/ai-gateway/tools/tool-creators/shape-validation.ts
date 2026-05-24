import { z } from 'zod';
import type { AddShapeItemsInput } from './types';

const shapeKindSchema = z.enum(['solid', 'rectangle', 'rounded_rectangle', 'square', 'circle', 'ellipse']);

const shapeStyleSchema = z.object({
  left: z.number().optional(),
  top: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  opacity: z.number().optional(),
  rotation: z.number().optional(),
  fillColor: z.string().trim().min(1).optional(),
  borderRadius: z.number().min(0).optional(),
  keepAspectRatio: z.boolean().optional(),
  fadeInDurationInSeconds: z.number().min(0).optional(),
  fadeOutDurationInSeconds: z.number().min(0).optional(),
});

export const shapeItemInputSchema = z.object({
  shapeKind: shapeKindSchema,
  startFrame: z.number().int().min(0).optional(),
  startTimeInSeconds: z.number().min(0).optional(),
  durationInFrames: z.number().int().positive().optional(),
  durationInSeconds: z.number().positive().optional(),
  xOnCanvas: z.number().optional(),
  yOnCanvas: z.number().optional(),
  style: shapeStyleSchema.optional(),
});

export const shapePatchSchema = shapeStyleSchema
  .extend({
    shapeKind: shapeKindSchema.optional(),
    from: z.number().int().min(0).optional(),
    durationInFrames: z.number().int().positive().optional(),
    startTimeInSeconds: z.number().min(0).optional(),
    durationInSeconds: z.number().positive().optional(),
    xOnCanvas: z.number().optional(),
    yOnCanvas: z.number().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'Provide at least one patch field',
  });

const hasConflictingTiming = ({ frame, seconds, fps }: { frame?: number; seconds?: number; fps: number }) =>
  frame !== undefined && seconds !== undefined && frame !== Math.round(seconds * fps);

export const validateShapeTimings = ({ items, fps }: { items: AddShapeItemsInput['items']; fps: number }) => {
  const invalidItem = items.find(
    (item) =>
      hasConflictingTiming({ frame: item.startFrame, seconds: item.startTimeInSeconds, fps }) ||
      hasConflictingTiming({ frame: item.durationInFrames, seconds: item.durationInSeconds, fps }),
  );

  if (!invalidItem) return null;
  return `Conflicting timing fields for ${invalidItem.shapeKind}. Frame and seconds values must resolve to the same frame at ${fps}fps.`;
};
