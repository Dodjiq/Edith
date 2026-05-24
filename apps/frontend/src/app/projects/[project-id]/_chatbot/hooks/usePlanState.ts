'use client';

import { useMemo } from 'react';
import type { ChatMessage } from '../types/chatbot';
import type { CreatePlanParams, UpdatePlanParams, PlanStep } from 'api-types';

export type PlanStepState = PlanStep & {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description?: string;
};

export type PlanState = {
  id: string;
  title: string;
  steps: PlanStepState[];
  status: 'active' | 'completed' | 'failed';
};

const parseToolInput = <T>(input: Record<string, unknown> | string | undefined): T | null => {
  if (!input) return null;
  if (typeof input === 'object') return input as T;
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
};

export const usePlanState = (messages: ChatMessage[]) => {
  return useMemo(() => {
    let currentPlan: PlanState | null = null;

    for (const message of messages) {
      if (message.role !== 'assistant') continue;

      for (const part of message.parts) {
        if (part.type !== 'tool') continue;

        if (part.name === 'create_plan') {
          const input = parseToolInput<CreatePlanParams>(part.input);
          if (input && Array.isArray(input.steps)) {
            currentPlan = {
              id: part.toolCallId,
              title: input.title,
              steps: input.steps.map((step) => ({
                ...step,
                status: 'pending',
              })),
              status: 'active',
            };
          }
        } else if (part.name === 'update_plan' && currentPlan) {
          const input = parseToolInput<UpdatePlanParams>(part.input);
          if (input && input.stepId) {
            const stepIndex = currentPlan.steps.findIndex((s) => s.id === input.stepId);
            if (stepIndex !== -1) {
              const planToUpdate: PlanState = currentPlan;
              const updatedStep: PlanStepState = {
                ...planToUpdate.steps[stepIndex],
                status: input.status,
                description: input.description,
              };

              const newSteps: PlanStepState[] = [...planToUpdate.steps];
              newSteps[stepIndex] = updatedStep;

              currentPlan = {
                ...planToUpdate,
                steps: newSteps,
              };

              if (newSteps.every((s) => s.status === 'completed')) {
                currentPlan.status = 'completed';
              } else if (newSteps.some((s) => s.status === 'failed')) {
                currentPlan.status = 'failed';
              }
            }
          }
        }
      }
    }

    return currentPlan;
  }, [messages]);
};
