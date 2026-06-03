'use client';

import React, { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { useEditorInteractionLockStore } from './state/editor-interaction-lock-store';

interface EditorInteractionLockBoundaryProps {
  children: React.ReactNode;
  className?: string;
  tooltipSide?: 'top' | 'bottom';
}

export const EditorInteractionLockBoundary: React.FC<EditorInteractionLockBoundaryProps> = ({
  children,
  className,
  tooltipSide = 'top',
}) => {
  const lock = useEditorInteractionLockStore((state) => state.lock);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  useEffect(() => {
    if (!lock) {
      setIsTooltipVisible(false);
      return;
    }

    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement)) {
      return;
    }

    if (rootRef.current?.contains(activeElement)) {
      activeElement.blur();
    }
  }, [lock]);

  if (!lock) {
    return (
      <div ref={rootRef} className={cn('relative', className)}>
        {children}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn('relative', className)} aria-label={lock.message}>
      {children}
      <div
        className="absolute inset-0 z-20 cursor-not-allowed bg-black/5"
        onPointerDown={(event) => event.preventDefault()}
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
      />
      <div
        className={cn(
          'pointer-events-none absolute left-1/2 z-30 max-w-72 -translate-x-1/2 rounded-md bg-black px-3 py-1.5 text-center text-xs text-white shadow-lg transition-opacity',
          tooltipSide === 'bottom' ? 'top-3' : 'bottom-3',
          isTooltipVisible ? 'opacity-100' : 'opacity-0',
        )}
      >
        {lock.message}
      </div>
    </div>
  );
};
