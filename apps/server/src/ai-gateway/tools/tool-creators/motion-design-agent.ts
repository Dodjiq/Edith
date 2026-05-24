import { z } from 'zod';
import type { DelegateMotionDesignTaskResult } from './types';

export { buildMotionDesignSpecialistPrompt } from '../../../prompts/subagents/motion-design.prompts';

const motionDesignDelegateOutputSchema = z.object({
  status: z.enum(['success', 'partial_success', 'needs_clarification', 'error', 'completed']),
  createdItemIds: z.array(z.string()).default([]),
  updatedItemIds: z.array(z.string()).default([]),
  deletedItemIds: z.array(z.string()).default([]),
  selectedItemIds: z.array(z.string()).default([]),
  usedTemplateIds: z.array(z.string()).default([]),
  summary: z.string().trim().min(1).max(500),
  unresolvedIssue: z.string().trim().max(300).nullable().optional(),
});

type MotionDesignDelegateOutput = z.infer<typeof motionDesignDelegateOutputSchema>;

const normalizeMotionDesignDelegateOutput = (
  data: MotionDesignDelegateOutput,
): DelegateMotionDesignTaskResult => {
  const { status, unresolvedIssue, ...rest } = data;
  return {
    ...rest,
    status: status === 'completed' ? 'success' : status,
    unresolvedIssue: unresolvedIssue?.trim() || undefined,
  };
};

export const defaultMotionDesignDelegateResult = (
  summary: string,
  unresolvedIssue?: string,
): DelegateMotionDesignTaskResult => ({
  status: unresolvedIssue ? 'error' : 'needs_clarification',
  createdItemIds: [],
  updatedItemIds: [],
  deletedItemIds: [],
  selectedItemIds: [],
  usedTemplateIds: [],
  summary,
  unresolvedIssue,
});

export const parseMotionDesignDelegateResult = (text: string): DelegateMotionDesignTaskResult => {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/```$/u, '')
    .trim();

  try {
    const parsed = motionDesignDelegateOutputSchema.safeParse(JSON.parse(cleaned));
    if (parsed.success) {
      return normalizeMotionDesignDelegateOutput(parsed.data);
    }
  } catch {
    // Keep the parent result compact when the specialist misses JSON.
  }

  return defaultMotionDesignDelegateResult(
    cleaned || 'The motion design specialist did not return a structured result.',
    'Invalid specialist output.',
  );
};

export const buildMotionDesignDelegateModelOutput = (output: DelegateMotionDesignTaskResult) => ({
  type: 'text' as const,
  value: JSON.stringify(output),
});
