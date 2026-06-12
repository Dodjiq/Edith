import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = ({ className, ...props }) => (
  <input
    className={cn(
      'flex h-10 w-full rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-sm text-edith-text placeholder:text-edith-muted',
      'focus:outline-none focus:ring-2 focus:ring-edith-accent/40 focus:border-edith-accent/50',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors duration-150',
      className,
    )}
    {...props}
  />
);
