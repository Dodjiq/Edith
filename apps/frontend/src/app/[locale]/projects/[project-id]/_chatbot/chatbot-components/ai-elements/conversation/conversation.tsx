'use client';

import { Button } from '@/components/buttons/button';
import { cn } from '@/lib/utils';
import { ArrowDownIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { createContext, useCallback, useContext } from 'react';
import { useStickToBottom } from 'use-stick-to-bottom';
import { ScrollArea } from '@/components/ui/scroll-area';

const ConversationContext = createContext<ReturnType<typeof useStickToBottom> | null>(null);

export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversationContext must be used within a Conversation provider');
  }
  return context;
};

export type ConversationProps = ComponentProps<typeof ScrollArea> & {
  initial?: 'smooth' | 'instant';
  resize?: 'smooth' | 'instant';
};

export const Conversation = ({
  className,
  children,
  initial = 'smooth',
  resize = 'smooth',
  ...props
}: ConversationProps) => {
  const stickToBottom = useStickToBottom({ initial, resize });

  return (
    <ConversationContext.Provider value={stickToBottom}>
      <ScrollArea
        className={cn('relative min-w-0 max-w-full flex-1 overflow-hidden', className)}
        viewportRef={stickToBottom.scrollRef}
        {...props}
      >
        {children}
      </ScrollArea>
    </ConversationContext.Provider>
  );
};

export type ConversationContentProps = ComponentProps<'div'>;

export const ConversationContent = ({ className, ...props }: ConversationContentProps) => {
  const { contentRef } = useConversationContext();
  return (
    <div ref={contentRef} className={cn('flex w-full min-w-0 max-w-full flex-col gap-8 p-4', className)} {...props} />
  );
};

export type ConversationEmptyStateProps = ComponentProps<'div'> & {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
};

export const ConversationEmptyState = ({
  className,
  title = 'No messages yet',
  description = 'Start a conversation to see messages here',
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => (
  <div
    className={cn('flex size-full flex-col items-center justify-center gap-3 p-8 text-center', className)}
    {...props}
  >
    {children ?? (
      <>
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{title}</h3>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      </>
    )}
  </div>
);

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({ className, ...props }: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useConversationContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    !isAtBottom && (
      <Button
        className={cn('absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full', className)}
        onClick={handleScrollToBottom}
        size="icon"
        type="button"
        variant="outline"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  );
};
