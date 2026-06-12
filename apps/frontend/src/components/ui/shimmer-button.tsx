'use client';

import { type ComponentPropsWithoutRef, type CSSProperties, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<'button'> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = 'rgba(255,255,255,0.9)',
      shimmerSize = '0.1em',
      shimmerDuration = '3s',
      borderRadius = '99px',
      background = '#51e0cf',
      className,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        style={
          {
            '--spread': '90deg',
            '--shimmer-color': shimmerColor,
            '--radius': borderRadius,
            '--speed': shimmerDuration,
            '--cut': shimmerSize,
            '--bg': background,
            ...style,
          } as CSSProperties
        }
        className={cn(
          'group relative z-0 inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 font-semibold text-edith-neutral-100',
          '[background:var(--bg)] [border-radius:var(--radius)]',
          'transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px',
          className,
        )}
        {...props}
      >
        {/* Shimmer container — rotating conic gradient confined to a circle */}
        <div
          className={cn(
            '-z-30 blur-[2px]',
            'absolute inset-0 overflow-visible [container-type:size]',
          )}
        >
          <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            <div
              className="absolute -inset-full w-auto rotate-0 animate-spin-around [translate:0_0]"
              style={{
                background:
                  'conic-gradient(from calc(270deg - (var(--spread) * 0.5)), transparent 0, var(--shimmer-color) var(--spread), transparent var(--spread))',
              }}
            />
          </div>
        </div>

        {/* Children (above the shimmer) */}
        {children}

        {/* Highlight overlay (inner inset shadow that gets stronger on hover/active) */}
        <div
          className={cn(
            'insert-0 absolute size-full',
            'shadow-[inset_0_-8px_10px_rgba(255,255,255,0.12)]',
            'transform-gpu transition-all duration-300 ease-in-out',
            'group-hover:shadow-[inset_0_-6px_10px_rgba(255,255,255,0.25)]',
            'group-active:shadow-[inset_0_-10px_10px_rgba(255,255,255,0.25)]',
          )}
          style={{ borderRadius: 'var(--radius)' }}
        />

        {/* Backdrop — covers the conic-gradient inside the button, keeping only its border-glow visible */}
        <div
          className={cn('absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]')}
        />
      </button>
    );
  },
);

ShimmerButton.displayName = 'ShimmerButton';
