'use client';

import { cn } from '@/utils/cn';
import { Maximize2Icon } from 'lucide-react';
import { ButtonHTMLAttributes, HTMLAttributes, useState } from 'react';

type CodeBlockProps = HTMLAttributes<HTMLPreElement> & {
  code: string;
  language?: string;
  showCopyButton?: boolean;
  onExpand?: () => void;
};

type CopyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  copied: boolean;
};

const CopyButton = ({ copied, className, ...props }: CopyButtonProps) => (
  <button
    type="button"
    className={cn(
      'rounded-md border border-zinc-200 px-2 py-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800',
      className,
    )}
    {...props}
  >
    {copied ? 'Copied' : 'Copy'}
  </button>
);

const ExpandButton = ({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'rounded-md border border-zinc-200 p-1 text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800',
      className,
    )}
    title="Expand"
    {...props}
  >
    <Maximize2Icon className="size-4" />
  </button>
);

export const CodeBlock = ({
  code,
  language = 'json',
  className,
  showCopyButton = true,
  onExpand,
  ...props
}: CodeBlockProps) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative w-full max-w-full">
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {onExpand && <ExpandButton onClick={onExpand} />}
        {showCopyButton && <CopyButton copied={copied} onClick={handleCopy} />}
      </div>
      <pre
        className={cn(
          'w-full max-w-full overflow-x-auto rounded-xl bg-zinc-950 p-4 text-sm text-zinc-100 dark:bg-zinc-900',
          className,
        )}
        data-language={language}
        {...props}
      >
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
};
