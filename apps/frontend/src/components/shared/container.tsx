import { cn } from '@/lib/utils';

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export const Container: React.FC<ContainerProps> = ({ children, className, style }) => (
  <div className={cn('mx-auto w-full max-w-7xl px-6 lg:px-10', className)} style={style}>
    {children}
  </div>
);
