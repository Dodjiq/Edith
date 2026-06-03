'use client';

import { cn } from '@/utils/cn';
import {
  AnchorHTMLAttributes,
  HTMLAttributes,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

type SourcesContextValue = {
  isOpen: boolean;
  toggle: () => void;
};

const SourcesContext = createContext<SourcesContextValue | null>(null);

const useSources = () => {
  const context = useContext(SourcesContext);
  if (!context) {
    throw new Error('Sources components must be nested within <Sources>.');
  }
  return context;
};

type SourcesProps = {
  children: React.ReactNode;
  className?: string;
};

export const Sources = ({ children, className }: SourcesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const value = useMemo(
    () => ({
      isOpen,
      toggle: () => setIsOpen((prev) => !prev),
    }),
    [isOpen],
  );

  return (
    <SourcesContext.Provider value={value}>
      <div className={cn('relative', className)}>{children}</div>
    </SourcesContext.Provider>
  );
};

type SourcesTriggerProps = HTMLAttributes<HTMLButtonElement> & {
  count: number;
};

export const SourcesTrigger = ({
  className,
  count,
  ...props
}: SourcesTriggerProps) => {
  const { toggle } = useSources();
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
        className,
      )}
      {...props}
    >
      Sources ({count})
    </button>
  );
};

export const SourcesContent = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const { isOpen } = useSources();
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute left-0 top-10 z-20 w-60 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900',
        className,
      )}
      {...props}
    />
  );
};

export const Source = ({
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a
    target="_blank"
    rel="noreferrer"
    className={cn(
      'block rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
      className,
    )}
    {...props}
  />
);

