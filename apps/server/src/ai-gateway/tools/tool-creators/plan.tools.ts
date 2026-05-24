import { Tool } from 'ai';
import { z } from 'zod';
import type { CreatePlanInput, CreatePlanResult, UpdatePlanInput, UpdatePlanResult } from './types';

export function createCreatePlanTool(): Tool<CreatePlanInput, CreatePlanResult> {
  return {
    description:
      'Create a plan with a list of steps to execute complex tasks. ' +
      'Use this when the user request requires multiple distinct actions (e.g. "remove silences THEN add captions").' +
      'The title must stay very concise, do not add any other text to it.',
    inputSchema: z.object({
      title: z.string().min(1),
      steps: z.array(z.object({ id: z.string().min(1), title: z.string().min(1) })).min(1),
      reason: z.string().optional(),
    }),
    execute: async (input: CreatePlanInput) => ({
      status: 'success',
      note: `Plan "${input.title}" created with ${input.steps.length} steps.`,
    }),
  } as unknown as Tool<CreatePlanInput, CreatePlanResult>;
}

export function createUpdatePlanTool(): Tool<UpdatePlanInput, UpdatePlanResult> {
  return {
    description:
      'Update the status of a step in the current plan.' +
      'Only call this tool to mark a task as completed or failed.' +
      'The description must stay very concise, do not add any other text to it.',
    inputSchema: z.object({
      stepId: z.string().min(1),
      status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
      description: z.string().optional(),
      reason: z.string().optional(),
    }),
    execute: async (input: UpdatePlanInput) => ({
      status: 'success',
      note: `Step ${input.stepId} updated to ${input.status}.`,
    }),
  } as unknown as Tool<UpdatePlanInput, UpdatePlanResult>;
}
