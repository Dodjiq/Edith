import { cn } from '@/lib/utils';

type CardProps = { children: React.ReactNode; className?: string };

export const Card: React.FC<CardProps> = ({ children, className }) => (
  <div
    className={cn(
      'rounded-2xl border border-white/8 bg-white/3 text-edith-text',
      className,
    )}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ children, className }) => (
  <div className={cn('flex flex-col gap-1.5 p-6', className)}>{children}</div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className }) => (
  <h3 className={cn('text-lg font-semibold leading-tight tracking-tight text-edith-text', className)}>
    {children}
  </h3>
);

export const CardDescription: React.FC<CardProps> = ({ children, className }) => (
  <p className={cn('text-sm text-edith-muted', className)}>{children}</p>
);

export const CardContent: React.FC<CardProps> = ({ children, className }) => (
  <div className={cn('p-6 pt-0', className)}>{children}</div>
);

export const CardFooter: React.FC<CardProps> = ({ children, className }) => (
  <div className={cn('flex items-center p-6 pt-0', className)}>{children}</div>
);
