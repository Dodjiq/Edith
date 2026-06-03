import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (process.env.BILLING_DISABLED === 'true') {
    return NextResponse.json({ mode: 'mock', url: '/dashboard?portal=mock' });
  }

  if (!stripe) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: customerRow, error: customerLookupError } = await admin
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (customerLookupError) {
    console.error('[stripe/portal] customer lookup failed', customerLookupError);
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }

  if (!customerRow?.stripe_customer_id) {
    return NextResponse.json({ error: 'no_customer' }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerRow.stripe_customer_id,
    return_url: `${origin}/settings/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
