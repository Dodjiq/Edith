import { z } from 'zod';
import type { DelegateImagePictureTaskResult } from './types';

export { buildImageSpecialistPrompt } from '../../../prompts/subagents/image-picture.prompts';

const delegateResultSchema = z.object({
  status: z.enum(['success', 'partial_success', 'needs_clarification', 'error']),
  createdItemIds: z.array(z.string()).default([]),
  updatedItemIds: z.array(z.string()).default([]),
  deletedItemIds: z.array(z.string()).default([]),
  selectedItemIds: z.array(z.string()).default([]),
  usedAssetIds: z.array(z.string()).default([]),
  summary: z.string().trim().min(1).max(500),
  unresolvedIssue: z.string().trim().max(300).optional(),
});

export const defaultDelegateResult = (
  summary: string,
  unresolvedIssue?: string,
): DelegateImagePictureTaskResult => ({
  status: unresolvedIssue ? 'error' : 'needs_clarification',
  createdItemIds: [],
  updatedItemIds: [],
  deletedItemIds: [],
  selectedItemIds: [],
  usedAssetIds: [],
  summary,
  unresolvedIssue,
});

export const parseDelegateResult = (text: string): DelegateImagePictureTaskResult => {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```$/u, '')
    .trim();
  try {
    const parsed = delegateResultSchema.safeParse(JSON.parse(cleaned));
    if (parsed.success) return parsed.data;
  } catch {
    // Keep the parent result compact when the specialist misses JSON.
  }
  return defaultDelegateResult(
    cleaned || 'The image specialist did not return a structured result.',
    'Invalid specialist output.',
  );
};

export const buildImageDelegateModelOutput = (output: DelegateImagePictureTaskResult) => ({
  type: 'text' as const,
  value: JSON.stringify(output),
});
