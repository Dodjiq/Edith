import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SupabaseService } from '../supabase/supabase.service';

type PlanKey = 'free' | 'starter' | 'growth' | 'agency';

const PLAN_ALLOWANCES: Record<PlanKey, number> = {
  free: 2,
  starter: 3,
  growth: 30,
  agency: 100,
};

type CreateCheckoutSessionParams = {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
};

type CreateCustomerPortalSessionParams = {
  userId: string;
  returnUrl: string;
};

type HandleWebhookParams = {
  rawBody: Buffer;
  signature: string;
};

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    const key = config.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key);
    } else {
      this.logger.debug('STRIPE_SECRET_KEY not configured — billing disabled');
    }
  }

  private requireStripe(): Stripe {
    if (!this.stripe) throw new Error('STRIPE_SECRET_KEY is not configured');
    return this.stripe;
  }

  async createCheckoutSession({
    userId,
    email,
    priceId,
    successUrl,
    cancelUrl,
  }: CreateCheckoutSessionParams): Promise<{ url: string }> {
    this.logger.debug(`createCheckoutSession: userId=${userId}, priceId=${priceId}`);

    const { data: existing } = await this.supabaseService.client
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let stripeCustomerId = existing?.stripe_customer_id as string | undefined;

    if (!stripeCustomerId) {
      const customer = await this.requireStripe().customers.create({ email, metadata: { userId } });
      stripeCustomerId = customer.id;

      await this.supabaseService.client
        .from('stripe_customers')
        .upsert({ user_id: userId, stripe_customer_id: stripeCustomerId, email })
        .then(({ error }) => { if (error) this.logger.debug(`upsert stripe_customers error: ${error.message}`); });
    }

    const session = await this.requireStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
    });

    this.logger.debug(`Checkout session created: sessionId=${session.id}`);
    return { url: session.url! };
  }

  async createCustomerPortalSession({
    userId,
    returnUrl,
  }: CreateCustomerPortalSessionParams): Promise<{ url: string }> {
    this.logger.debug(`createCustomerPortalSession: userId=${userId}`);

    const { data } = await this.supabaseService.client
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!data?.stripe_customer_id) {
      throw new Error('No Stripe customer found for this user');
    }

    const session = await this.requireStripe().billingPortal.sessions.create({
      customer: data.stripe_customer_id as string,
      return_url: returnUrl,
    });

    this.logger.debug(`Portal session created for userId=${userId}`);
    return { url: session.url };
  }

  async handleWebhook({ rawBody, signature }: HandleWebhookParams): Promise<void> {
    const webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;
    try {
      event = this.requireStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Webhook signature verification failed: ${message}`);
      throw new Error(`Webhook signature invalid: ${message}`);
    }

    this.logger.debug(`Webhook received: type=${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        this.logger.debug(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.debug('handleCheckoutCompleted: no userId in metadata');
      return;
    }

    this.logger.debug(`handleCheckoutCompleted: userId=${userId}, sessionId=${session.id}`);

    if (!session.subscription) {
      return;
    }

    const subscription = await this.requireStripe().subscriptions.retrieve(
      session.subscription as string,
    );

    const priceId = subscription.items.data[0]?.price.id ?? '';
    const plan = this.planFromPriceId(priceId);

    await this.supabaseService.client
      .from('stripe_customers')
      .upsert({
        user_id: userId,
        stripe_customer_id: subscription.customer as string,
        email: session.customer_email ?? '',
      })
      .then(({ error }) => { if (error) this.logger.debug(`upsert stripe_customers error: ${error.message}`); });

    await this.supabaseService.client
      .from('stripe_subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        price_id: priceId,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        metadata: subscription.metadata ?? {},
      })
      .then(({ error }) => { if (error) this.logger.debug(`upsert stripe_subscriptions error: ${error.message}`); });

    await this.supabaseService.client
      .from('profiles')
      .update({ plan })
      .eq('user_id', userId)
      .then(({ error }) => { if (error) this.logger.debug(`update profiles error: ${error.message}`); });

    await this.supabaseService.client
      .from('user_credits')
      .update({ monthly_allowance: PLAN_ALLOWANCES[plan] })
      .eq('user_id', userId)
      .then(({ error }) => { if (error) this.logger.debug(`update user_credits error: ${error.message}`); });

    this.logger.debug(`handleCheckoutCompleted done: userId=${userId}, plan=${plan}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const { data: customerRow } = await this.supabaseService.client
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single();

    if (!customerRow?.user_id) {
      this.logger.debug(`handleSubscriptionUpdated: no user found for customer=${subscription.customer}`);
      return;
    }

    const userId = customerRow.user_id as string;
    const priceId = subscription.items.data[0]?.price.id ?? '';
    const plan = this.planFromPriceId(priceId);

    this.logger.debug(`handleSubscriptionUpdated: userId=${userId}, plan=${plan}`);

    await this.supabaseService.client
      .from('stripe_subscriptions')
      .update({
        status: subscription.status,
        price_id: priceId,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        metadata: subscription.metadata ?? {},
      })
      .eq('stripe_subscription_id', subscription.id)
      .then(({ error }) => { if (error) this.logger.debug(`update stripe_subscriptions error: ${error.message}`); });

    await this.supabaseService.client
      .from('profiles')
      .update({ plan })
      .eq('user_id', userId)
      .then(({ error }) => { if (error) this.logger.debug(`update profiles plan error: ${error.message}`); });

    await this.supabaseService.client
      .from('user_credits')
      .update({ monthly_allowance: PLAN_ALLOWANCES[plan] })
      .eq('user_id', userId)
      .then(({ error }) => { if (error) this.logger.debug(`update user_credits allowance error: ${error.message}`); });

    this.logger.debug(`handleSubscriptionUpdated done: userId=${userId}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const { data: customerRow } = await this.supabaseService.client
      .from('stripe_customers')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single();

    if (!customerRow?.user_id) {
      this.logger.debug(`handleSubscriptionDeleted: no user found for customer=${subscription.customer}`);
      return;
    }

    const userId = customerRow.user_id as string;
    this.logger.debug(`handleSubscriptionDeleted: userId=${userId}`);

    await this.supabaseService.client
      .from('stripe_subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id)
      .then(({ error }) => { if (error) this.logger.debug(`update stripe_subscriptions canceled error: ${error.message}`); });

    await this.supabaseService.client
      .from('profiles')
      .update({ plan: 'starter' })
      .eq('user_id', userId)
      .then(({ error }) => { if (error) this.logger.debug(`update profiles starter error: ${error.message}`); });

    await this.supabaseService.client
      .from('user_credits')
      .update({ monthly_allowance: PLAN_ALLOWANCES.starter })
      .eq('user_id', userId)
      .then(({ error }) => { if (error) this.logger.debug(`update user_credits starter error: ${error.message}`); });

    this.logger.debug(`handleSubscriptionDeleted done: userId=${userId}`);
  }

  private planFromPriceId(priceId: string): PlanKey {
    const growthPriceId = process.env.STRIPE_PRICE_GROWTH;
    const agencyPriceId = process.env.STRIPE_PRICE_AGENCY;

    if (priceId && priceId === agencyPriceId) return 'agency';
    if (priceId && priceId === growthPriceId) return 'growth';
    return 'starter';
  }
}
