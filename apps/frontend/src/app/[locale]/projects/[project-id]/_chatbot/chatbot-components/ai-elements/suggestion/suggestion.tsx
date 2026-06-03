'use client';

import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/buttons/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

export type SuggestionsProps = ComponentProps<typeof ScrollArea>;

export const Suggestions = ({ className, children, ...props }: SuggestionsProps) => (
  <ScrollArea className="w-full overflow-x-auto whitespace-nowrap" {...props}>
    <div className={cn('flex w-max flex-nowrap items-center gap-2', className)}>{children}</div>
    <ScrollBar className="hidden" orientation="horizontal" />
  </ScrollArea>
);

export type SuggestionProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  suggestion: string;
  onClick?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onClick,
  className,
  variant = 'outline',
  size = 'sm',
  children,
  ...props
}: SuggestionProps) => {
  const handleClick = () => {
    onClick?.(suggestion);
  };

  return (
    <Button
      className={cn('cursor-pointer rounded-full px-4', className)}
      onClick={handleClick}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};

export type AddPresetSuggestionProps = {
  onClick?: () => void;
};

export const AddPresetSuggestion = ({ onClick }: AddPresetSuggestionProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-dashed border-zinc-600 px-4 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-300"
    >
      <PlusIcon className="size-4" />
      Add a preset
    </button>
  );
};
