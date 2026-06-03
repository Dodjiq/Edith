// Server-side Stripe singleton. Null when STRIPE_SECRET_KEY is not configured
// so routes can degrade gracefully instead of throwing at import time.

import Stripe from 'stripe';

const secret = process.env.STRIPE_SECRET_KEY;

// Pin to the API version shipped with stripe@18.x types. If you bump stripe,
// update this literal to match `Stripe.LatestApiVersion` in the new types.
export const stripe: Stripe | null = secret
  ? new Stripe(secret, { apiVersion: '2025-08-27.basil' })
  : null;

export const isStripeConfigured = (): boolean => stripe !== null;
