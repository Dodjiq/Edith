import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'accent';

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-edith-accent/15 text-edith-accent border-edith-accent/20',
  secondary: 'bg-white/8 text-edith-muted border-white/10',
  outline: 'bg-transparent text-edith-text border-white/15',
  accent: 'bg-edith-accent text-edith-bg border-transparent',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
      variantClasses[variant],
      className,
    )}
  >
    {children}
  </span>
);
