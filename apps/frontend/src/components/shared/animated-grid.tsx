'use client';

import { cn } from '@/lib/utils';

type AnimatedGridProps = {
  className?: string;
};

export const AnimatedGrid: React.FC<AnimatedGridProps> = ({ className }) => (
  <div
    className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    aria-hidden="true"
  >
    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }}
    />
  </div>
);
