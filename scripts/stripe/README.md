# Stripe setup script

One-shot Node script to provision the three Edith paid plans (Starter, Pro, Agency)
as Stripe products with monthly EUR recurring prices.

The script is idempotent: re-running it reuses existing products/prices that match
`metadata.edith_plan_key` and the expected currency/amount/interval, so it will
not create duplicates.

## Prerequisites

- A Stripe account with access to the dashboard.
- A **test mode** secret key (`sk_test_*`). Use a live key only when you are
  ready to provision production catalog entries.
- `pnpm install` has been run at the repo root (pulls in `tsx` and `stripe`).

## Step 1 — Create products and prices

1. Grab a test secret key from <https://dashboard.stripe.com/test/apikeys>.
2. From the repo root, run:

   ```bash
   STRIPE_SECRET_KEY=sk_test_xxx pnpm stripe:setup
   ```

   PowerShell variant:

   ```powershell
   $env:STRIPE_SECRET_KEY = "sk_test_xxx"; pnpm stripe:setup
   ```

3. The script prints progress to stderr and, on stdout, an env block that looks
   like:

   ```text
   # Paste into apps/frontend/.env
   STRIPE_STARTER_PRICE_ID=price_xxx
   STRIPE_PRO_PRICE_ID=price_yyy
   STRIPE_AGENCY_PRICE_ID=price_zzz
   ```

   Followed by a JSON dump with the full product + price IDs for record-keeping.

4. Copy the env block into `apps/frontend/.env`.

5. Make sure billing is enabled in the same env file:

   ```text
   BILLING_DISABLED=false
   STRIPE_SECRET_KEY=sk_test_xxx
   ```

6. Restart your dev server so the new env values are picked up.

## Step 2 — Configure the webhook

The script does not create the webhook endpoint or the `STRIPE_WEBHOOK_SECRET`.
Do this manually.

### Local development

Forward Stripe events to your local Next.js server with the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a `whsec_*` signing secret. Add it to `apps/frontend/.env`:

```text
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Keep the `stripe listen` process running while you test subscription flows.

### Production (Vercel)

1. In the Stripe dashboard, go to **Developers → Webhooks → Add endpoint**.
2. URL: `https://your-domain.com/api/stripe/webhook`.
3. Subscribe to the events your app handles (typically: `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`).
4. After creation, reveal the signing secret and store it as `STRIPE_WEBHOOK_SECRET`
   in your Vercel project env vars.
5. Redeploy.

## Notes

- The script targets Stripe API version `2025-08-27.basil`, matching
  `apps/frontend/src/lib/stripe.ts`. Update both if you bump the SDK.
- Products are identified by `metadata.edith_plan_key` (`starter`, `pro`, `agency`).
  Don't edit that metadata in the dashboard or the script will create a new
  product on the next run.
- The Free plan is not provisioned — it is gated entirely on the app side and
  never hits Stripe.
- Prices are immutable in Stripe. If you change `priceEur` in
  `apps/frontend/src/lib/plans.ts`, the script will create a **new** price; the
  old one stays around. Archive obsolete prices in the dashboard.
