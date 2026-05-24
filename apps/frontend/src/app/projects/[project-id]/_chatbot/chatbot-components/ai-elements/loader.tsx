'use client';

import { cn } from '@/utils/cn';

type LoaderProps = {
  className?: string;
  label?: string;
};

export const Loader = ({ className, label = 'Thinking' }: LoaderProps) => (
  <div
    className={cn(
      'flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
      className,
    )}
  >
    <span className="inline-flex size-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-white" />
    {label}…
  </div>
);

