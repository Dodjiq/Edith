# Stripe Integration Audit - Edith

Snapshot of the current Stripe surface area in the monorepo, the gaps blocking real billing, and the ordered steps to ship Free / Starter / Pro / Agency plans with monthly export quotas.

## 1. Existing surface

### API routes (all currently stubbed)

| Route | File | State |
|---|---|---|
| `POST /api/stripe/checkout` | `apps/frontend/src/app/api/stripe/checkout/route.ts` | **Mock**. Returns `{ mode: 'mock' }` when `BILLING_DISABLED !== 'false'`, otherwise `501 Not implemented`. No Stripe SDK call, no session creation. |
| `POST /api/stripe/portal` | `apps/frontend/src/app/api/stripe/portal/route.ts` | **Mock**. Same pattern: mock response or `501`. No `billingPortal.sessions.create`. |
| `POST /api/stripe/webhook` | `apps/frontend/src/app/api/stripe/webhook/route.ts` | **Mock**. Returns `{ received: true, mode: 'mock' }` or `501`. **No signature verification, no event dispatch, no DB sync.** |

The Stripe Node SDK is not declared in `apps/frontend/package.json` (a grep for `"stripe"` returned no match). It must be added before any of the routes above can call Stripe.

### Database (already provisioned in `supabase/schema.sql`)

| Table | Purpose | Status |
|---|---|---|
| `public.stripe_customers` (`user_id` PK, `stripe_customer_id` unique, `email`) | Maps Supabase user to Stripe customer | Ready, RLS read-only for the owner |
| `public.stripe_subscriptions` (`stripe_subscription_id` unique, `status`, `price_id`, `current_period_start/end`, `cancel_at_period_end`, `metadata`) | One row per Stripe subscription | Ready, RLS read-only for the owner |
| `public.user_credits` (`balance`, `reserved`, `monthly_allowance`, `refreshed_at`) | Per-user credit pool used by render pipeline | Ready, RLS read-only |
| `public.credit_transactions` (typed: `grant` / `reserve` / `spend` / `refund` / `adjustment`) | Append-only ledger | Ready, RLS read-only |

There is **no `profiles` table and no `plan` column anywhere**. Plan identity must be derived from `stripe_subscriptions.price_id` at read time (handled by the new `lib/plans.ts` helper) or persisted in a new column / table.

### Frontend touchpoints

- `apps/frontend/src/app/[locale]/pricing/page.tsx` - static page rendering 4 plans (`free`, `starter`, `pro`, `scale`) from i18n messages. CTA points to `/projects/new`. **No call to `/api/stripe/checkout`.** Plan key `scale` is mislabeled "Agency" in the messages file (`apps/frontend/messages/en.json` line 190, same in `fr.json`).
- `apps/frontend/src/app/[locale]/settings/billing/page.tsx` - placeholder copy, no portal link, no current-plan display, no quota display.
- `apps/frontend/src/app/[locale]/settings/page.tsx` - runtime checks panel including `STRIPE_SECRET_KEY` boolean check.
- `apps/frontend/src/app/[locale]/dashboard/page.tsx` - links to `/settings/billing`, no quota indicator.

### Env vars referenced today

`apps/frontend/.env.example` declares `BILLING_DISABLED=true` only. The settings page reads `process.env.STRIPE_SECRET_KEY` for a presence check, but the variable is not declared in the example file. No `STRIPE_*_PRICE_ID`, no `STRIPE_WEBHOOK_SECRET`.

## 2. Database state ready vs. missing

Ready: `stripe_customers`, `stripe_subscriptions`, `user_credits`, `credit_transactions`, RLS policies (owner read), `videos` storage bucket policies.

Missing for the spec:
- A persisted `plan` (or `plan_key`) per user. Options:
  - Add `plan public.plan_key not null default 'free'` to a new `profiles` table keyed on `auth.users(id)`, or
  - Derive on the fly from `stripe_subscriptions.price_id` via `getPlanByPriceId` (no schema change, slower lookup).
- A monthly export counter. The user needs `exports_used_this_period` (or rely on a count of `video_variants` where `status = 'completed'` since `current_period_start`). Simplest: add `monthly_exports_used integer not null default 0` and `monthly_exports_reset_at timestamptz` to `user_credits`, or repurpose `monthly_allowance` semantics.
- Webhook write access. Service-role writes are not blocked by RLS but the webhook route must use the Supabase service role client; today the frontend only exposes a publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). `SUPABASE_SERVICE_ROLE_KEY` is referenced in `apps/frontend/src/app/[locale]/settings/page.tsx` but is **not** in `.env.example`.

## 3. Gap analysis - blocking end-to-end

| Layer | Gap | Impact |
|---|---|---|
| Backend deps | `stripe` npm package not installed in `apps/frontend` | Routes cannot import the SDK |
| Checkout route | No `stripe.checkout.sessions.create`, no user lookup, no `stripe_customers` upsert, no `success_url` / `cancel_url`, no plan-to-price mapping | Pricing page has no working CTA |
| Portal route | No `stripe.billingPortal.sessions.create`, no `stripe_customers` lookup | Billing settings page cannot let users manage their subscription |
| Webhook route | No raw-body reading (Next.js App Router needs `await request.text()` then `Stripe.webhooks.constructEvent`), no `STRIPE_WEBHOOK_SECRET` check, no event handlers, no DB sync into `stripe_subscriptions` / `user_credits`, no quota reset on `invoice.paid` | Subscriptions never reflect in the DB; quotas never refresh |
| Quota enforcement | No middleware or service helper enforcing `monthlyExports`, `maxDurationSeconds`, `maxVariantsPerProject`, `watermark`, `voiceoverIncluded`, `advancedMode` at the render and edit boundaries | A free user can render 30 videos at 90s with voiceover |
| Plan resolution | No helper translating a Stripe `price_id` to a plan; no helper returning a user's current plan from the session | Frontend cannot display the current plan, server cannot gate features |
| Frontend pricing page | CTA links to `/projects/new` instead of POSTing to `/api/stripe/checkout` with the chosen plan key | Users cannot subscribe |
| Frontend billing page | No "Manage subscription" button calling `/api/stripe/portal` | Users cannot cancel / update card |
| Telemetry | No log on `invoice.payment_failed` -> downgrade path | Failed payments silently keep premium access |
| i18n | Plan key `scale` in messages should be `agency` to match the spec | Inconsistent naming between code, env, and Stripe metadata |

## 4. Ordered steps to finish the integration

1. **Schema**
   - Decide between (a) new `profiles` table with a `plan` column or (b) on-the-fly derivation via `getPlanByPriceId`. Recommended: keep `stripe_subscriptions.price_id` as the source of truth, add a denormalized `current_plan text` column to `stripe_customers` for fast reads.
   - Extend `user_credits` with `monthly_exports_used integer not null default 0` and `period_end timestamptz` so quotas survive across logins; mutate from the webhook on `invoice.paid` and from the render service on each export.
2. **Env**
   - Add to `apps/frontend/.env.example`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (only if Elements is used), `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `STRIPE_AGENCY_PRICE_ID`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`.
   - Document the matching Stripe Dashboard setup: 3 recurring prices in EUR (9.99, 19.99, 49.99), one customer portal config, one webhook endpoint pointed at `/api/stripe/webhook`.
3. **Helper layer**
   - Add `apps/frontend/src/lib/plans.ts` (done in this scaffold) - single source of plan limits, used by both pricing page and server-side gates.
   - Add `apps/frontend/src/lib/stripe/server.ts` exporting a memoized `getStripe()` returning a `new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '<pinned>' })`.
   - Add `apps/frontend/src/lib/supabase/admin.ts` for the service-role client.
4. **Checkout**
   - Implement `POST /api/stripe/checkout`: authenticate via Supabase server client, look up or create the `stripe_customers` row, resolve the requested `planKey` to a price via `PLANS[key].stripePriceIdEnv`, create a `checkout.sessions` with `mode: 'subscription'`, return `{ url }`. Free plan should not hit Stripe - upsert `stripe_subscriptions` with status `active` and `price_id = null`.
5. **Webhook**
   - Read the raw body (`request.text()`), verify with `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`, dispatch on `event.type`. Use the service-role client to write to Supabase.
6. **Portal**
   - Implement `POST /api/stripe/portal`: authenticate, fetch `stripe_customer_id`, create a `billingPortal.sessions.create({ customer, return_url })`, return `{ url }`. Render a button on `/settings/billing`.
7. **Quota enforcement**
   - In `apps/server` (NestJS) render service, before queuing a Modal job: load the user's plan via the helper, reject if `monthlyExports` reached, clamp duration to `maxDurationSeconds`, clamp `variants_count` to `maxVariantsPerProject`, refuse voiceover requests when `voiceoverIncluded === false`, append watermark when `watermark === true`.
   - On successful render completion, increment `user_credits.monthly_exports_used`.
8. **Frontend wiring**
   - Pricing page: turn each plan card CTA into a client-side `<form>` POSTing to `/api/stripe/checkout` with `{ planKey }`, then `window.location.href = url`.
   - Billing page: server-fetch the current plan + period_end + remaining exports, render a "Manage subscription" button calling `/api/stripe/portal`.
   - Dashboard: surface remaining exports for the current period.
9. **i18n**
   - Rename `pricing.plans.scale` to `pricing.plans.agency` in `apps/frontend/messages/en.json` and `fr.json`, update `planKeys` array in `pricing/page.tsx`.
10. **QA**
    - Use Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) and trigger the four events below.

## 5. Env vars to populate

```env
# apps/frontend/.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...   # only if Stripe.js is used in-browser

STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_AGENCY_PRICE_ID=price_...

STRIPE_SUCCESS_URL=https://edith.app/settings/billing?status=success
STRIPE_CANCEL_URL=https://edith.app/pricing?status=cancelled

SUPABASE_SERVICE_ROLE_KEY=eyJ...
BILLING_DISABLED=false
```

## 6. Webhook events to handle

| Event | Action |
|---|---|
| `checkout.session.completed` | Upsert `stripe_customers` (link `customer` to `user_id` via `client_reference_id` or `metadata.userId`). Upsert `stripe_subscriptions` from `session.subscription`. Reset `monthly_exports_used = 0`, set `period_end` from the subscription. |
| `customer.subscription.created` | Insert `stripe_subscriptions` row, set `current_period_*`, `price_id`, `status`. Derive plan via `getPlanByPriceId`. |
| `customer.subscription.updated` | Update `stripe_subscriptions` row (status, price_id, period dates, cancel_at_period_end). If `price_id` changed, log a `credit_transactions` row of type `adjustment` describing the plan change. |
| `customer.subscription.deleted` | Mark subscription `status = 'canceled'`. Downgrade to `free` plan limits at next access. |
| `invoice.paid` | Renewal trigger. Reset `monthly_exports_used = 0`, update `period_end`. |
| `invoice.payment_failed` | Mark `stripe_subscriptions.status = 'past_due'`. Optionally email the user. |
| `customer.subscription.trial_will_end` | Optional: notify the user 3 days before trial ends. |

## 7. Open questions

- Should the Free plan create a Stripe customer up front (so the user can upgrade without re-collecting info) or only at first paid checkout? Recommendation: lazy creation, on first paid `checkout`.
- Annual pricing? Not in the spec. Spec gives monthly only; defer.
- Proration on plan change? Stripe default behavior (`prorate`) is fine for MVP.
- Hard stop vs. soft limit on exports? Recommendation: hard stop on `monthlyExports`, with a clear UI message and a CTA to upgrade.

## 8. Reference - what this audit shipped

- New helper: `apps/frontend/src/lib/plans.ts` - plan config and `getPlanByPriceId`.
- This document: `docs/STRIPE_AUDIT.md`.
- Existing Stripe routes (`checkout`, `portal`, `webhook`) were **not modified** - they remain mocks gated on `BILLING_DISABLED`.
