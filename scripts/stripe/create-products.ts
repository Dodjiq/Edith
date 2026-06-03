// One-shot Stripe setup script.
// Creates the three Edith paid plans (Starter, Pro, Agency) as Stripe products
// with monthly EUR recurring prices, and prints the env block to paste into
// apps/frontend/.env.
//
// Idempotency: products are looked up by metadata.edith_plan_key; matching
// prices are reused if an active recurring monthly EUR price already exists
// with the expected unit_amount. Re-running this script is safe.
//
// Usage from repo root:
//   STRIPE_SECRET_KEY=sk_test_xxx pnpm stripe:setup

import Stripe from 'stripe';

interface SeedPlan {
  key: 'starter' | 'pro' | 'agency';
  name: string;
  priceEur: number;
  monthlyExports: number;
}

interface PlanResult {
  planKey: SeedPlan['key'];
  envVar: string;
  productId: string;
  priceId: string;
  reusedProduct: boolean;
  reusedPrice: boolean;
}

// Mirror of apps/frontend/src/lib/plans.ts. Kept inline because this script
// runs from the repo root without a TS build step that resolves workspace paths.
const SEED_PLANS: readonly SeedPlan[] = [
  { key: 'starter', name: 'Starter', priceEur: 9.99, monthlyExports: 10 },
  { key: 'pro', name: 'Pro', priceEur: 19.99, monthlyExports: 20 },
  { key: 'agency', name: 'Agency', priceEur: 49.99, monthlyExports: 30 },
] as const;

const PLAN_METADATA_KEY = 'edith_plan_key';
const STRIPE_API_VERSION = '2025-08-27.basil' as const;
const ENV_VAR_BY_KEY: Record<SeedPlan['key'], string> = {
  starter: 'STRIPE_STARTER_PRICE_ID',
  pro: 'STRIPE_PRO_PRICE_ID',
  agency: 'STRIPE_AGENCY_PRICE_ID',
};

const toUnitAmount = (priceEur: number): number => Math.round(priceEur * 100);

const findExistingProduct = async (
  stripe: Stripe,
  planKey: SeedPlan['key'],
): Promise<Stripe.Product | null> => {
  // metadata search is the official way to look up by custom keys without listing all products.
  const query = `active:'true' AND metadata['${PLAN_METADATA_KEY}']:'${planKey}'`;
  const result = await stripe.products.search({ query, limit: 1 });
  return result.data[0] ?? null;
};

const findExistingPrice = async (
  stripe: Stripe,
  productId: string,
  unitAmount: number,
): Promise<Stripe.Price | null> => {
  // List active prices for the product, then filter for a recurring monthly EUR price at the exact amount.
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 100,
  });

  const match = prices.data.find(
    (price) =>
      price.currency === 'eur' &&
      price.unit_amount === unitAmount &&
      price.recurring?.interval === 'month' &&
      price.type === 'recurring',
  );

  return match ?? null;
};

const ensureProduct = async (
  stripe: Stripe,
  plan: SeedPlan,
): Promise<{ product: Stripe.Product; reused: boolean }> => {
  const existing = await findExistingProduct(stripe, plan.key);
  if (existing) {
    return { product: existing, reused: true };
  }

  const created = await stripe.products.create({
    name: `Edith ${plan.name}`,
    description: `Edith ${plan.name} monthly subscription — ${plan.monthlyExports} exports/month`,
    metadata: { [PLAN_METADATA_KEY]: plan.key },
  });

  return { product: created, reused: false };
};

const ensurePrice = async (
  stripe: Stripe,
  plan: SeedPlan,
  product: Stripe.Product,
): Promise<{ price: Stripe.Price; reused: boolean }> => {
  const unitAmount = toUnitAmount(plan.priceEur);
  const existing = await findExistingPrice(stripe, product.id, unitAmount);
  if (existing) {
    return { price: existing, reused: true };
  }

  const created = await stripe.prices.create({
    product: product.id,
    unit_amount: unitAmount,
    currency: 'eur',
    recurring: { interval: 'month' },
    metadata: { [PLAN_METADATA_KEY]: plan.key },
  });

  return { price: created, reused: false };
};

const formatEnvBlock = (results: readonly PlanResult[]): string => {
  const lines = ['# Paste into apps/frontend/.env'];
  for (const result of results) {
    lines.push(`${result.envVar}=${result.priceId}`);
  }
  return lines.join('\n');
};

const main = async (): Promise<void> => {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    process.stderr.write(
      [
        'Error: STRIPE_SECRET_KEY env var is required.',
        '',
        'Grab a test key from https://dashboard.stripe.com/test/apikeys and run:',
        '  STRIPE_SECRET_KEY=sk_test_xxx pnpm stripe:setup',
        '',
      ].join('\n'),
    );
    process.exit(1);
  }

  if (!secret.startsWith('sk_')) {
    process.stderr.write(
      `Error: STRIPE_SECRET_KEY does not look like a Stripe secret key (expected sk_test_* or sk_live_*).\n`,
    );
    process.exit(1);
  }

  const mode: 'test' | 'live' = secret.startsWith('sk_live_') ? 'live' : 'test';
  process.stderr.write(`Stripe mode detected: ${mode}\n`);
  if (mode === 'live') {
    process.stderr.write(
      'Warning: live key detected. Products and prices will be created in LIVE mode.\n',
    );
  }

  const stripe = new Stripe(secret, { apiVersion: STRIPE_API_VERSION });

  const results: PlanResult[] = [];
  for (const plan of SEED_PLANS) {
    process.stderr.write(`\n→ ${plan.name} (${plan.key})\n`);

    const { product, reused: reusedProduct } = await ensureProduct(stripe, plan);
    process.stderr.write(
      `  product: ${product.id} (${reusedProduct ? 'reused' : 'created'})\n`,
    );

    const { price, reused: reusedPrice } = await ensurePrice(stripe, plan, product);
    process.stderr.write(
      `  price:   ${price.id} (${reusedPrice ? 'reused' : 'created'}) — ${toUnitAmount(plan.priceEur)} eur cents / month\n`,
    );

    results.push({
      planKey: plan.key,
      envVar: ENV_VAR_BY_KEY[plan.key],
      productId: product.id,
      priceId: price.id,
      reusedProduct,
      reusedPrice,
    });
  }

  // Final stdout: env block + JSON dump for record-keeping.
  process.stdout.write('\n');
  process.stdout.write(formatEnvBlock(results));
  process.stdout.write('\n\n');
  process.stdout.write('# Full IDs (JSON, for record-keeping)\n');
  process.stdout.write(`${JSON.stringify({ mode, plans: results }, null, 2)}\n`);
};

await main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`\nStripe setup failed: ${message}\n`);
  process.exit(1);
});
