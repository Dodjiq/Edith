'use client';

import { cn } from '@/lib/utils';
import type { PlanKey } from '@/types/database';

const PLAN_LABELS: Record<PlanKey, string> = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  agency: 'Agency',
};

type CreditsBadgeProps = {
  used: number;
  allowance: number;
  plan: PlanKey;
};

const CreditsBadge: React.FC<CreditsBadgeProps> = ({ used, allowance, plan }) => {
  const safeAllowance = allowance > 0 ? allowance : 1;
  const ratio = Math.min(used / safeAllowance, 1);
  const percent = Math.round(ratio * 100);

  const barColor =
    ratio < 0.8
      ? 'bg-edith-accent'
      : ratio < 1
        ? 'bg-amber-400'
        : 'bg-red-500';

  const textColor =
    ratio < 0.8
      ? 'text-edith-accent'
      : ratio < 1
        ? 'text-amber-400'
        : 'text-red-400';

  return (
    <div className='flex flex-col gap-2 rounded-xl border border-white/8 bg-edith-bg2 px-5 py-4'>
      <div className='flex items-center justify-between text-xs'>
        <span className='text-edith-muted'>Exports ce mois</span>
        <span className='flex items-center gap-1.5'>
          <span className={cn('font-semibold', textColor)}>
            {used} / {allowance}
          </span>
          <span className='rounded-full border border-white/10 px-1.5 py-0.5 text-edith-muted'>
            {PLAN_LABELS[plan]}
          </span>
        </span>
      </div>
      <div className='h-1.5 w-full overflow-hidden rounded-full bg-white/8'>
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export { CreditsBadge };
