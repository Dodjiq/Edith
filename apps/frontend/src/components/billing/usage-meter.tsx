'use client';

import { cn } from '@/lib/utils';

type UsageMeterProps = {
  used: number;
  allowance: number;
  plan: string;
};

export const UsageMeter: React.FC<UsageMeterProps> = ({ used, allowance, plan }) => {
  const percentage = allowance > 0 ? Math.min((used / allowance) * 100, 100) : 0;
  const isAtLimit = used >= allowance;
  const isNearLimit = percentage >= 80 && !isAtLimit;

  const barColor = isAtLimit
    ? 'bg-red-500'
    : isNearLimit
      ? 'bg-orange-400'
      : 'bg-edith-accent';

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between text-sm'>
        <span className='text-edith-muted'>
          <span className='font-semibold text-edith-text'>{used}</span>
          {' / '}
          <span className='text-edith-text'>{allowance}</span>
          {' exports utilisés ce mois'}
        </span>
        <span className='text-xs capitalize text-edith-muted'>{plan}</span>
      </div>

      <div className='h-2 w-full overflow-hidden rounded-full bg-white/8'>
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isAtLimit && (
        <p className='text-xs font-medium text-red-400'>
          Quota atteint — Passez à un plan supérieur pour continuer à exporter.
        </p>
      )}
    </div>
  );
};
