# Edith — Récap réveil

> Document généré automatiquement pendant que tu dormais. Mis à jour vague par vague.

Date : 2026-06-04

---

## 🚀 Ce qui a été fait pendant la nuit

### Wave 5 — Backend auth + DB resilience + CI

#### Migration 003 (idempotency render) — appliquée live
- `render_jobs.client_request_id` (text, unique par user)
- `render_jobs.credits_counted_at` (timestamptz, flag charge crédit)
- Index unique partiel sur (`user_id`, `client_request_id`) when not null
- Index sur `credits_counted_at`

→ Empêche le double-count d'export sur retry render.

#### Migration 004 (atomic RPC) — appliquée live
- Fonction Postgres `public.increment_user_exports(p_user_id uuid, p_delta integer) returns integer`
- Atomic upsert + auto-reset si `monthly_exports_reset_at < now()`
- Security definer + grant `authenticated, service_role`
- `lib/quota.ts` mis à jour : appelle la RPC, fallback RMW si erreur

→ Plus de race condition sur compteur quota.

#### NestJS backend Supabase JWT guard
- Nouveau module `apps/server/src/auth/`
  - `auth.module.ts` (Global)
  - `supabase.service.ts` (singleton service-role)
  - `supabase-auth.guard.ts` (`CanActivate`, valide Bearer JWT, attache `req.user`)
  - `current-user.decorator.ts` + `public.decorator.ts`
- Guard enregistré globalement via `APP_GUARD` dans `app.module.ts`
- `main.ts` CORS sync sur `FRONTEND_URL` env
- `apps/server/.env` + `.env.example` synchronisés (localhost:3000 / 4000 / 4005)
- Dep `@supabase/supabase-js` ajoutée

→ Toutes les routes serveur sont par défaut auth-protected. Healthcheck + realtime marqués `@Public()`.

#### Pricing + routes + landing cleanup
- `pricing/page.tsx` : nouveau subtitle marketing, bannière dev conditionnelle `BILLING_DISABLED===true`
- `[locale]/projects/page.tsx` créé (liste tous les projets utilisateur)
- Landing `[locale]/page.tsx` : auth state check, nav affiche `Dashboard` + `SignOutButton` si connecté
- `[locale]/login/` (mockup OAuth doublon) supprimé entièrement
- i18n keys mises à jour : `pricing.subtitle`, `pricing.dev_banner`, `nav.dashboard`, `projects_list.*`

#### Vercel + GitHub Actions CI
- `apps/frontend/vercel.json` :
  - Region `fra1`
  - Build chain `api-types` puis `frontend`
  - Function timeouts : stripe webhook 30s, render start 60s, auth callback 10s
- `.github/workflows/typecheck.yml` : pnpm + node 22, runs api-types build + frontend tsc + server tsc
- `.github/workflows/ci.yml` : lint + frontend build avec env mockées
- `.gitignore` étendu (build/, .idea/, .vscode/*, .modal.toml, .vercel/)
- `README.md` : sections Deployment + CI ajoutées

---

### Wave 6 — E-commerce specialization (en cours / TBD)

- **Agent T** : enhancement `render_worker.py` (watermark drawtext, silence trimming via silencedetect, zoom punches, captions burn-in stylés, voiceover mixin)
- **Agent U** : NestJS AI gateway — 4 nouveaux tools spécialisés e-commerce
  - `generateEcommerceAngles` (angles marketing)
  - `generateHookVariants` (hooks courts par angle)
  - `generateAdEditPlan` (plan de montage JSON structuré)
  - `applyEcommercePreset` (presets statiques ugc_dynamic / ecommerce_ad / product_demo)
  - Mock branching activé si `MOCK_AI_TOOLS=true` ou pas d'OPENAI_API_KEY
- **Agent V** : dashboard realtime — hook `useProjectRealtime` + `DashboardLiveStatus` composant client, subscribe Supabase realtime sur `projects` table, refresh dashboard auto sur INSERT/UPDATE
- **Agent W** : i18n partial editor — namespace `projects_editor.*` FR+EN, chatbot header + prompt input + preset panel + action-row strings traduits

---

## ⚠️ Toujours manquant (au moment d'aller dormir)

### Bloqué sur secrets utilisateur

Ces étapes ne peuvent pas avancer sans qu'**tu** remplisses ces vars dans `apps/frontend/.env` (+ `apps/server/.env` pour la dernière) :

| Var | Source | Effet |
|-----|--------|-------|
| `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/test/apikeys | Lancer `pnpm stripe:setup` → fill `STRIPE_*_PRICE_ID` → checkout actif |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen --forward-to localhost:3000/api/stripe/webhook` (dev) ou Stripe dashboard (prod) | Webhook signature verify OK |
| `MODAL_TOKEN_ID` + `MODAL_TOKEN_SECRET` | `modal token new` (cf. `modal/DEPLOY.md`) | Déployer worker render |
| `MODAL_RENDER_ENDPOINT_URL` | output `modal deploy modal/render_worker.py` | Render réel non-mock |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | AI gateway tools + captions |
| `HF_TOKEN` (optionnel) | https://huggingface.co/settings/tokens | Transcription Whisper plus rapide |

→ Une fois fait, `pnpm stripe:setup` + `modal deploy` + redémarrage dev.

### À faire après wake-up (P1+)

1. **Backend deploy** — Vercel ne marche pas pour NestJS+WebSocket. Décider Railway/Fly/Render. Doc + script deploy.
2. **Vercel project setup** — connecter le repo, configurer Root Directory `apps/frontend`, ajouter env vars manquantes dans Vercel dashboard.
3. **Email Supabase templates** — branding personnalisé sur welcome/reset/confirmation. À configurer dans Supabase dashboard > Auth > Email Templates.
4. **OAuth Google/Apple** — pages prêtes mais providers non câblés. Setup côté Supabase + ajouter boutons UI.
5. **PostHog / Google Analytics** — pas câblé. À choisir lequel + scaffold init.
6. **Tests E2E Playwright** — aucun test pour l'instant.
7. **Idempotency render** — schema DB prête (migration 003), reste à câbler `client_request_id` dans le route `/api/render/start` (frontend doit générer un UUID + envoyer + backend doit insérer + skip increment si `credits_counted_at` non-null).
8. **Page projects/[project-id] i18n complète** — éditeur entier (timeline, inspector, canvas) encore en FR hardcodé pour la plupart.
9. **OmniVoice provider abstraction** — voix off Modal endpoint pas branché côté server.
10. **TwelveLabs** — analyse vidéo encore mockée.

---

## 🔑 Vérifs rapides au réveil

```bash
# 1. Pull dernières modifs
cd C:/Users/Samsung/OneDrive/Desktop/Saas/coding/TryEdit/framedeck
git pull origin main

# 2. Install si lockfile changé
pnpm install

# 3. Lance dev (sans portless sur Windows)
cd apps/frontend
PORTLESS=0 pnpm exec next dev
# OU
pnpm exec next dev
```

Ouvre `http://localhost:3000` :
- Landing FR + switch EN dans le nav
- `/pricing` (avec bannière dev jaune car BILLING_DISABLED=true)
- `/auth/register` → crée compte test → confirme email Supabase → redirige `/dashboard`
- Dashboard : indicateur "● Live" en haut à droite, projets vides → CTA new project
- `/settings/billing` : affiche plan Free + quota 0/2 + lien upgrade

---

## 📊 État Supabase

Projet : Edith (`ffhgfgdrudkqspgtbcdj`) — eu-west-1, ACTIVE_HEALTHY

Tables / colonnes / triggers ajoutés cette nuit :
- `public.profiles` (RLS owner)
- `public.plan_key` enum
- `user_credits.monthly_exports_used` + `monthly_exports_reset_at`
- `render_jobs.client_request_id` (unique partiel) + `credits_counted_at`
- Trigger `on_auth_user_created` auto-init profile + user_credits
- Trigger `profiles_set_updated_at`
- RPC `increment_user_exports(uuid, integer)` atomique

---

## 🌳 Branche Git

`main` — push depuis cette nuit :
- `9c6e679` Stripe + i18n + Auth + quota (gros bloc)
- `9209b7c` Migrate to Vercel + add i18n, real Stripe, quota, auth gaps
- `cd93296` Rename middleware.ts to proxy.ts for Next.js 16 convention
- (commits wave 5 + 6 + 7 à venir)
