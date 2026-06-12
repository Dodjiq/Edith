import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { UsageMeter } from '@/components/billing/usage-meter';
import { PlanCards } from '@/components/billing/plan-cards';
import type { Profile, UserCredits } from '@/types/database';

type StripeSubscription = {
  id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

const BillingPage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: profile }, { data: credits }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .single<Pick<Profile, 'plan'>>(),
    supabase
      .from('user_credits')
      .select('monthly_allowance, monthly_exports_used')
      .eq('user_id', user.id)
      .single<Pick<UserCredits, 'monthly_allowance' | 'monthly_exports_used'>>(),
    supabase
      .from('stripe_subscriptions')
      .select('id, status, current_period_end, cancel_at_period_end')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('current_period_end', { ascending: false })
      .limit(1)
      .returns<StripeSubscription[]>(),
  ]);

  const currentPlan = profile?.plan ?? 'free';
  const used = credits?.monthly_exports_used ?? 0;
  const allowance = credits?.monthly_allowance ?? 2;
  const activeSubscription = subscriptions?.[0] ?? null;

  const renewalDate = activeSubscription?.current_period_end
    ? new Date(activeSubscription.current_period_end).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-xl font-semibold text-edith-text'>Facturation</h1>
        <p className='mt-1 text-sm text-edith-muted'>Gérez votre abonnement et votre usage mensuel.</p>
      </div>

      <div className='rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-xs font-medium uppercase tracking-widest text-edith-muted'>Plan actuel</p>
            <p className='mt-1 text-2xl font-bold capitalize text-edith-accent'>{currentPlan}</p>
          </div>
          {renewalDate && (
            <div className='text-right'>
              <p className='text-xs text-edith-muted'>Renouvellement</p>
              <p className='mt-1 text-sm text-edith-text'>{renewalDate}</p>
              {activeSubscription?.cancel_at_period_end && (
                <p className='mt-0.5 text-xs text-orange-400'>Annulation en cours</p>
              )}
            </div>
          )}
        </div>

        <UsageMeter used={used} allowance={allowance} plan={currentPlan} />
      </div>

      <div>
        <h2 className='mb-4 text-base font-semibold text-edith-text'>Changer de plan</h2>
        <PlanCards currentPlan={currentPlan} userId={user.id} userEmail={user.email ?? ''} />
      </div>
    </div>
  );
};

export default BillingPage;
