import { cn } from '@/lib/utils';

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export const Container: React.FC<ContainerProps> = ({ children, className }) => (
  <div className={cn('mx-auto w-full max-w-7xl px-6 lg:px-10', className)}>
    {children}
  </div>
);
