'use client';

import {
  Queue,
  QueueSection,
  QueueSectionTrigger,
  QueueSectionLabel,
  QueueSectionContent,
  QueueList,
  QueueItem,
  QueueItemIndicator,
  QueueItemContent,
  QueueItemDescription,
} from './ai-elements/queue/queue';
import type { PlanState } from '../hooks/usePlanState';
import { LoaderIcon } from 'lucide-react';

type ChatbotPlanProps = {
  plan: PlanState | null;
};

export const ChatbotPlan = ({ plan }: ChatbotPlanProps) => {
  if (!plan) return null;

  const completedCount = plan.steps.filter((s) => s.status === 'completed').length;
  const totalCount = plan.steps.length;
  const isCompleted = completedCount === totalCount;

  return (
    <Queue>
      <QueueSection defaultOpen={!isCompleted}>
        <QueueSectionTrigger>
          <QueueSectionLabel label={plan.title} count={totalCount} />
        </QueueSectionTrigger>
        <QueueSectionContent>
          <QueueList>
            {plan.steps.map((step) => {
              const isStepCompleted = step.status === 'completed';
              const isStepInProgress = step.status === 'in_progress';

              return (
                <QueueItem key={step.id}>
                  <div className="flex items-center gap-3">
                    <div className="flex size-3 shrink-0 items-center justify-center">
                      {isStepInProgress ? (
                        <LoaderIcon className="text-muted-foreground size-3 animate-spin" />
                      ) : (
                        <QueueItemIndicator completed={isStepCompleted} />
                      )}
                    </div>
                    <QueueItemContent completed={isStepCompleted}>{step.title}</QueueItemContent>
                  </div>
                  {step.description && (
                    <QueueItemDescription completed={isStepCompleted}>{step.description}</QueueItemDescription>
                  )}
                </QueueItem>
              );
            })}
          </QueueList>
        </QueueSectionContent>
      </QueueSection>
    </Queue>
  );
};
