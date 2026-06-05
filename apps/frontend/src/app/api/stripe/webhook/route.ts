import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { createAdminClient } from '@/utils/supabase/admin';
import { getPlanByPriceId, type PlanConfig } from '@/lib/plans';
import { stripe } from '@/lib/stripe';

type AdminClient = ReturnType<typeof createAdminClient>;

const toIsoFromUnix = (unix: number | null | undefined): string | null => {
  if (typeof unix !== 'number' || Number.isNaN(unix)) return null;
  return new Date(unix * 1000).toISOString();
};

const extractPriceId = (subscription: Stripe.Subscription): string | null => {
  const firstItem = subscription.items?.data?.[0];
  return firstItem?.price?.id ?? null;
};

// In Stripe API 2025-08-27 (stripe-node 18.x), `current_period_*` moved off
// Subscription onto each SubscriptionItem. We use the first item's window as
// the canonical period for our single-price plans.
const extractPeriodWindow = (
  subscription: Stripe.Subscription,
): { start: string | null; end: string | null } => {
  const firstItem = subscription.items?.data?.[0];
  return {
    start: toIsoFromUnix(firstItem?.current_period_start),
    end: toIsoFromUnix(firstItem?.current_period_end),
  };
};

// Invoice.subscription moved to invoice.parent.subscription_details.subscription
// in the 2025-08-27 API. Read the new path with a narrow type guard so callers
// don't need to know the shape.
const extractInvoiceSubscriptionId = (invoice: Stripe.Invoice): string | null => {
  const parent = invoice.parent;
  if (!parent || parent.type !== 'subscription_details') return null;
  const subscription = parent.subscription_details?.subscription;
  if (!subscription) return null;
  return typeof subscription === 'string' ? subscription : subscription.id;
};

const resolveUserIdForCustomer = async (
  admin: AdminClient,
  stripeCustomerId: string,
): Promise<string | null> => {
  const { data, error } = await admin
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  if (error) {
    console.error('[stripe/webhook] customer lookup failed', error);
    return null;
  }
  return data?.user_id ?? null;
};

const upsertSubscriptionRow = async (
  admin: AdminClient,
  userId: string,
  subscription: Stripe.Subscription,
): Promise<void> => {
  const priceId = extractPriceId(subscription);
  const { start: periodStart, end: periodEnd } = extractPeriodWindow(subscription);
  const { error } = await admin
    .from('stripe_subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_customer_id:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        price_id: priceId,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        metadata: (subscription.metadata as Record<string, unknown>) ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_subscription_id' },
    );

  if (error) {
    console.error('[stripe/webhook] failed to upsert subscription', error);
  }
};

const writeGrantTransaction = async (
  admin: AdminClient,
  userId: string,
  amount: number,
  reason: string,
  metadata: Record<string, unknown>,
): Promise<void> => {
  const { error } = await admin.from('credit_transactions').insert({
    user_id: userId,
    type: 'grant',
    amount,
    reason,
    metadata,
  });
  if (error) {
    console.error('[stripe/webhook] failed to write credit transaction', error);
  }
};

const refreshMonthlyAllowance = async (
  admin: AdminClient,
  userId: string,
  plan: PlanConfig,
): Promise<void> => {
  const nowIso = new Date().toISOString();
  const { error } = await admin
    .from('user_credits')
    .upsert(
      {
        user_id: userId,
        monthly_allowance: plan.monthlyExports,
        refreshed_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.error(
      '[stripe/webhook] failed to refresh monthly allowance, skipping (schema may not be ready)',
      error,
    );
  }
};

const handleCheckoutSessionCompleted = async (
  admin: AdminClient,
  session: Stripe.Checkout.Session,
): Promise<void> => {
  if (!stripe) return;
  if (session.mode !== 'subscription') return;

  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  if (!subscriptionId) {
    console.error('[stripe/webhook] checkout.session.completed without subscription id');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  // Prefer the metadata user_id we set on the checkout session, fallback to the
  // stripe_customers lookup so we still recover if metadata is missing.
  const metadataUserId = (session.metadata?.user_id as string | undefined) ?? null;
  const userId = metadataUserId ?? (await resolveUserIdForCustomer(admin, customerId));
  if (!userId) {
    console.error('[stripe/webhook] could not resolve user_id for completed checkout');
    return;
  }

  await upsertSubscriptionRow(admin, userId, subscription);

  const priceId = extractPriceId(subscription);
  const plan = priceId ? getPlanByPriceId(priceId) : null;
  if (plan) {
    await refreshMonthlyAllowance(admin, userId, plan);
    await writeGrantTransaction(admin, userId, plan.monthlyExports, 'subscription_initial_grant', {
      stripe_subscription_id: subscription.id,
      plan_key: plan.key,
    });
  }
};

const handleSubscriptionUpsert = async (
  admin: AdminClient,
  subscription: Stripe.Subscription,
): Promise<void> => {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;
  const userId = await resolveUserIdForCustomer(admin, customerId);
  if (!userId) {
    console.error('[stripe/webhook] subscription event without resolvable user_id');
    return;
  }
  await upsertSubscriptionRow(admin, userId, subscription);
};

const handleSubscriptionDeleted = async (
  admin: AdminClient,
  subscription: Stripe.Subscription,
): Promise<void> => {
  const { error } = await admin
    .from('stripe_subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[stripe/webhook] failed to mark subscription canceled', error);
  }
};

const handleInvoicePaid = async (
  admin: AdminClient,
  invoice: Stripe.Invoice,
): Promise<void> => {
  if (!stripe) return;

  const subscriptionId = extractInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;
  const userId = await resolveUserIdForCustomer(admin, customerId);
  if (!userId) {
    console.error('[stripe/webhook] invoice.paid: could not resolve user_id');
    return;
  }

  // Keep subscription row in sync (period dates roll forward on renewal).
  await upsertSubscriptionRow(admin, userId, subscription);

  const priceId = extractPriceId(subscription);
  const plan = priceId ? getPlanByPriceId(priceId) : null;
  if (!plan) {
    console.error('[stripe/webhook] invoice.paid: no plan resolved for price', priceId);
    return;
  }

  await refreshMonthlyAllowance(admin, userId, plan);
  await writeGrantTransaction(admin, userId, plan.monthlyExports, 'subscription_renewal_grant', {
    stripe_subscription_id: subscription.id,
    stripe_invoice_id: invoice.id,
    plan_key: plan.key,
  });
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (process.env.BILLING_DISABLED === 'true') {
    return NextResponse.json({ received: true, mode: 'mock' });
  }

  if (!stripe) {
    return NextResponse.json({ error: 'stripe_not_configured' }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'webhook_secret_not_configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    console.error('[stripe/webhook] signature verification failed', message);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(admin, event.data.object as Stripe.Checkout.Session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await handleSubscriptionUpsert(admin, event.data.object as Stripe.Subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(admin, event.data.object as Stripe.Subscription);
        break;
      }
      case 'invoice.paid': {
        await handleInvoicePaid(admin, event.data.object as Stripe.Invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.error('[stripe/webhook] invoice.payment_failed', {
          invoice_id: invoice.id,
          customer: invoice.customer,
        });
        break;
      }
      default: {
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
      }
    }
  } catch (error) {
    console.error('[stripe/webhook] handler threw', event.type, error);
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
