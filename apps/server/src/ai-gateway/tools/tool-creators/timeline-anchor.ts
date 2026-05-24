import { z } from 'zod';
import type { ToolsContext } from './types';

export type TimelineAnchorInput = {
  startFrame?: number;
  startTimeInSeconds?: number;
  afterItemId?: string;
};

export const timelineAnchorSchemaFields = {
  startFrame: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Absolute 0-based frame. For the beginning of the timeline, use only startFrame: 0.'),
  startTimeInSeconds: z
    .number()
    .min(0)
    .optional()
    .describe('Absolute start time in seconds. Do not combine with startFrame or afterItemId.'),
  afterItemId: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe('Existing timeline item ID to place after. Never invent placeholder values; omit if unknown.'),
};

const getKnownItemIds = (context?: ToolsContext) => {
  return new Set(context?.projectState?.projectItemsInfo.map((item) => item.itemId) ?? []);
};

export const normalizeTimelineAnchor = (
  { startFrame, startTimeInSeconds, afterItemId }: TimelineAnchorInput,
  context?: ToolsContext,
): TimelineAnchorInput => {
  const cleanAfterItemId = afterItemId?.trim() || undefined;
  const hasProjectState = Boolean(context?.projectState);
  const knownItemIds = getKnownItemIds(context);
  const isKnownAfterItem = Boolean(cleanAfterItemId && knownItemIds.has(cleanAfterItemId));

  if (
    isKnownAfterItem ||
    (cleanAfterItemId && !hasProjectState && startFrame === undefined && startTimeInSeconds === undefined)
  ) {
    return { afterItemId: cleanAfterItemId };
  }

  if (startFrame !== undefined) {
    return { startFrame };
  }

  if (startTimeInSeconds !== undefined) {
    return { startTimeInSeconds };
  }

  if (cleanAfterItemId && !hasProjectState) {
    return { afterItemId: cleanAfterItemId };
  }

  return {};
};
