import { cn } from '@/lib/utils';

type SectionBadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export const SectionBadge: React.FC<SectionBadgeProps> = ({ children, className }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase',
      className,
    )}
  >
    {children}
  </span>
);
