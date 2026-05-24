import * as React from 'react';
import { cn } from '@/lib/utils';

const Empty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full flex-col items-center justify-center p-8 text-center',
      className
    )}
    {...props}
  />
));
Empty.displayName = 'Empty';

const EmptyHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex max-w-sm flex-col items-center justify-center',
      className
    )}
    {...props}
  />
));
EmptyHeader.displayName = 'EmptyHeader';

const EmptyMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'icon' }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mb-4 flex items-center justify-center',
      variant === 'icon' && 'rounded-full bg-muted p-4',
      className
    )}
    {...props}
  />
));
EmptyMedia.displayName = 'EmptyMedia';

const EmptyTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
));
EmptyTitle.displayName = 'EmptyTitle';

const EmptyDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('mt-2 text-sm text-muted-foreground', className)}
    {...props}
  />
));
EmptyDescription.displayName = 'EmptyDescription';

const EmptyContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'mt-6 flex flex-col items-center justify-center gap-2',
      className
    )}
    {...props}
  />
));
EmptyContent.displayName = 'EmptyContent';

export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
};

