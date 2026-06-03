import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getPlanByKey, type PlanKey } from '@/lib/plans';
import { stripe } from '@/lib/stripe';

interface CheckoutBody {
  planKey?: PlanKey;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (process.env.BILLING_DISABLED === 'true') {
    return NextResponse.json({ mode: 'mock', url: '/dashboard?checkout=mock' });
  }

  if (!stripe) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 });
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const planKey = body.planKey;
  if (!planKey) {
    return NextResponse.json({ error: 'missing_plan_key' }, { status: 400 });
  }

  const plan = getPlanByKey(planKey);
  if (!plan || plan.key === 'free' || plan.stripePriceIdEnv === null) {
    return NextResponse.json({ error: 'invalid_plan' }, { status: 400 });
  }

  const priceId = process.env[plan.stripePriceIdEnv];
  if (!priceId) {
    return NextResponse.json({ error: 'price_id_not_configured' }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Resolve or create the Stripe customer for this user.
  const { data: existingCustomer, error: customerLookupError } = await admin
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (customerLookupError) {
    console.error('[stripe/checkout] customer lookup failed', customerLookupError);
    return NextResponse.json({ error: 'database_error' }, { status: 500 });
  }

  let stripeCustomerId: string;
  if (existingCustomer?.stripe_customer_id) {
    stripeCustomerId = existingCustomer.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    stripeCustomerId = customer.id;

    const { error: insertError } = await admin.from('stripe_customers').insert({
      user_id: user.id,
      stripe_customer_id: customer.id,
      email: user.email ?? null,
    });
    if (insertError) {
      console.error('[stripe/checkout] failed to persist stripe_customer', insertError);
    }
  }

  const origin = request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    metadata: {
      user_id: user.id,
      plan_key: plan.key,
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: 'checkout_session_missing_url' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
