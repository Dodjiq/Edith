'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckIcon, CopyIcon } from 'lucide-react';

import { Button, type ButtonProps } from '@/components/buttons/button';
import { cn } from '@/lib/utils';
import { useControlledState } from '@/hooks/use-controlled-state';

type CopyButtonProps = Omit<ButtonProps, 'children'> & {
  content: string;
  copied?: boolean;
  onCopiedChange?: (copied: boolean, content?: string) => void;
  delay?: number;
};

const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      className,
      content,
      copied,
      onCopiedChange,
      onClick,
      variant = 'ghost',
      size = 'icon-sm',
      delay = 3000,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const [isCopied, setIsCopied] = useControlledState({
      value: copied,
      onChange: onCopiedChange,
    });

    const handleCopy = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (copied) return;
        if (content) {
          navigator.clipboard
            .writeText(content)
            .then(() => {
              setIsCopied(true);
              onCopiedChange?.(true, content);
              setTimeout(() => {
                setIsCopied(false);
                onCopiedChange?.(false);
              }, delay);
            })
            .catch((error) => {
              console.error('Error copying command', error);
            });
        }
      },
      [onClick, copied, content, setIsCopied, onCopiedChange, delay],
    );

    const Icon = isCopied ? CheckIcon : CopyIcon;

    return (
      <Button
        ref={ref}
        className={cn(
          'shrink-0 rounded-md transition-colors [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0',
          className,
        )}
        onClick={handleCopy}
        variant={variant}
        size={size}
        type={type}
        {...props}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={isCopied ? 'check' : 'copy'}
            data-slot="copy-button-icon"
            initial={{ scale: 0, opacity: 0.4, filter: 'blur(4px)' }}
            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
            exit={{ scale: 0, opacity: 0.4, filter: 'blur(4px)' }}
            transition={{ duration: 0.25 }}
          >
            <Icon />
          </motion.span>
        </AnimatePresence>
      </Button>
    );
  },
);

CopyButton.displayName = 'CopyButton';

export { CopyButton, type CopyButtonProps };
