import { z } from 'zod';
import type { DelegateShapeOverlayTaskResult } from './types';

export { buildShapeSpecialistPrompt } from '../../../prompts/subagents/shape-overlay.prompts';

const delegateResultSchema = z.object({
  status: z.enum(['success', 'partial_success', 'needs_clarification', 'error']),
  createdItemIds: z.array(z.string()).default([]),
  updatedItemIds: z.array(z.string()).default([]),
  deletedItemIds: z.array(z.string()).default([]),
  selectedItemIds: z.array(z.string()).default([]),
  summary: z.string().trim().min(1).max(500),
  unresolvedIssue: z.string().trim().max(300).optional(),
});

export const defaultShapeDelegateResult = (
  summary: string,
  unresolvedIssue?: string,
): DelegateShapeOverlayTaskResult => ({
  status: unresolvedIssue ? 'error' : 'needs_clarification',
  createdItemIds: [],
  updatedItemIds: [],
  deletedItemIds: [],
  selectedItemIds: [],
  summary,
  unresolvedIssue,
});

export const parseShapeDelegateResult = (text: string): DelegateShapeOverlayTaskResult => {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```$/u, '')
    .trim();

  try {
    const parsed = delegateResultSchema.safeParse(JSON.parse(cleaned));
    if (parsed.success) return parsed.data;
  } catch {
    // Keep the main agent compact even if the specialist returned prose.
  }

  return defaultShapeDelegateResult(
    cleaned || 'The shape specialist did not return a structured result.',
    'Invalid specialist output.',
  );
};

export const buildShapeDelegateModelOutput = (output: DelegateShapeOverlayTaskResult) => ({
  type: 'text' as const,
  value: JSON.stringify(output),
});
