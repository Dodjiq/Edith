'use client';

import { Badge } from '@/app/projects/[project-id]/_chatbot/chatbot-components/ai-elements/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/projects/[project-id]/_chatbot/chatbot-components/ai-elements/conversation/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ToolUIPart } from 'ai';
import { CheckCircleIcon, ChevronDownIcon, CircleIcon, ClockIcon, WrenchIcon, XCircleIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { createContext, isValidElement, useContext, useState } from 'react';
import { CodeBlock } from './code-block';
import type { ToolState } from '../../../types/chatbot';
import { useIsDevMode } from '@/app/projects/[project-id]/_editor-container/editor/context/DevModeContext';
import { getToolTitle } from '../../../utils/tool-labels';

type ExpandModalState = {
  isOpen: boolean;
  title: string;
  code: string;
};

const ExpandModalContext = createContext<{
  openModal: (title: string, code: string) => void;
} | null>(null);

const useExpandModal = () => {
  const context = useContext(ExpandModalContext);
  if (!context) {
    throw new Error('useExpandModal must be used within ExpandModalProvider');
  }
  return context;
};

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, children, ...props }: ToolProps) => {
  const [modalState, setModalState] = useState<ExpandModalState>({
    isOpen: false,
    title: '',
    code: '',
  });

  const openModal = (title: string, code: string) => {
    setModalState({ isOpen: true, title, code });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ExpandModalContext.Provider value={{ openModal }}>
      <Collapsible
        className={cn(
          'not-prose border-muted-foreground/10 mb-4 w-full min-w-0 max-w-full overflow-hidden rounded-md border-[1.5px]',
          className,
        )}
        {...props}
      >
        {children}
      </Collapsible>
      <Dialog open={modalState.isOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent size="full" className="flex h-[95vh] flex-col">
          <DialogHeader>
            <DialogTitle>{modalState.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <CodeBlock code={modalState.code} language="json" />
          </div>
        </DialogContent>
      </Dialog>
    </ExpandModalContext.Provider>
  );
};

export type ToolHeaderProps = {
  title?: string;
  type: string;
  state: ToolState;
  className?: string;
};

const getStatusBadge = (status: ToolState) => {
  const labels: Record<ToolState, string> = {
    'input-streaming': 'Pending',
    'input-available': 'Running',
    'approval-requested': 'Awaiting Approval',
    'approval-responded': 'Responded',
    'output-available': 'Completed',
    'output-error': 'Error',
    'output-denied': 'Denied',
  };

  const icons: Record<ToolState, ReactNode> = {
    'input-streaming': <CircleIcon className="size-4" />,
    'input-available': <ClockIcon className="size-4 animate-pulse" />,
    'approval-requested': <ClockIcon className="size-4 text-yellow-600" />,
    'approval-responded': <CheckCircleIcon className="size-4 text-blue-600" />,
    'output-available': <CheckCircleIcon className="size-4 text-green-600" />,
    'output-error': <XCircleIcon className="size-4 text-red-600" />,
    'output-denied': <XCircleIcon className="size-4 text-orange-600" />,
  };

  return (
    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
      {icons[status]}
      {labels[status]}
    </Badge>
  );
};

export const ToolHeader = ({ className, title, type, state, ...props }: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn('flex w-full min-w-0 max-w-full items-center justify-between gap-4 p-3 text-left', className)}
    {...props}
  >
    <div className="flex min-w-0 items-center gap-2">
      <WrenchIcon className="text-muted-foreground size-4" />
      <span className="truncate text-sm font-medium">{getToolTitle(type, title)}</span>
      {getStatusBadge(state)}
    </div>
    <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      'text-popover-foreground data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 w-full min-w-0 max-w-full overflow-hidden outline-none',
      className,
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<'div'> & {
  input: ToolUIPart['input'];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => {
  const isDevMode = useIsDevMode();
  const { openModal } = useExpandModal();

  if (!isDevMode) {
    return null;
  }

  const code = JSON.stringify(input, null, 2);

  return (
    <div className={cn('w-full min-w-0 max-w-full space-y-2 overflow-hidden p-4', className)} {...props}>
      <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Parameters</h4>
      <div className="bg-muted/50 w-full min-w-0 max-w-full overflow-hidden rounded-md">
        <CodeBlock code={code} language="json" onExpand={() => openModal('Parameters', code)} />
      </div>
    </div>
  );
};

export type ToolOutputProps = ComponentProps<'div'> & {
  output: ToolUIPart['output'];
  errorText: ToolUIPart['errorText'];
};

export const ToolOutput = ({ className, output, errorText, ...props }: ToolOutputProps) => {
  const { openModal } = useExpandModal();

  if (!(output || errorText)) {
    return null;
  }

  const getCodeString = (): string | null => {
    if (typeof output === 'object' && !isValidElement(output)) {
      return JSON.stringify(output, null, 2);
    } else if (typeof output === 'string') {
      return output;
    }
    return null;
  };

  const codeString = getCodeString();
  const title = errorText ? 'Error' : 'Result';

  let Output = <div>{output as ReactNode}</div>;

  if (codeString) {
    Output = <CodeBlock code={codeString} language="json" onExpand={() => openModal(title, codeString)} />;
  }

  return (
    <div className={cn('w-full min-w-0 max-w-full space-y-2 p-4', className)} {...props}>
      <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{title}</h4>
      <div
        className={cn(
          'min-w-0 max-w-full overflow-x-auto rounded-md text-xs [&_table]:w-full',
          errorText ? 'bg-destructive/10 text-destructive' : 'bg-muted/50 text-foreground',
        )}
      >
        {errorText && <div>{errorText}</div>}
        {Output}
      </div>
    </div>
  );
};
