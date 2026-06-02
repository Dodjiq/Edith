# Edith MVP - Installation et etat actuel

## Objectif

Edith transforme des rushs produit en variantes publicitaires pretes a tester: TikTok Ads, Reels Ads, Facebook Ads et Shorts.

Le MVP garde l'ancien editeur Framedeck isole et recentre le premier parcours sur: compte, projet, upload video, preset, generation, statut, exports.

## Commandes locales

Depuis la racine:

```bash
pnpm install
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend build
pnpm --filter frontend dev
```

Pour Cloudflare Pages:

```bash
pnpm pages:build
```

Note Windows: `@cloudflare/next-on-pages` peut echouer localement avec `spawn bash ENOENT`. Le build Next frontend passe; lance le build Cloudflare sur Cloudflare/Linux ou via WSL.

## Configuration Cloudflare

Dans les champs Build:

```txt
Commande de build: pnpm pages:build
Repertoire de sortie de version: apps/frontend/.vercel/output/static
Chemin d'acces / repertoire racine: /
```

Si tu es dans l'interface Workers avec une commande de deploiement:

```txt
Deploy command: npx wrangler pages deploy apps/frontend/.vercel/output/static --project-name=edith
Branch deploy command: npx wrangler pages deploy apps/frontend/.vercel/output/static --project-name=edith --branch=$CF_PAGES_BRANCH
```

## Variables Cloudflare minimales

```env
NEXT_PUBLIC_APP_URL=https://ton-domaine
NEXT_PUBLIC_SUPABASE_URL=https://ffhgfgdrudkqspgtbcdj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=videos
BILLING_DISABLED=true
ENABLE_MOCK_RENDER=true
ENABLE_REAL_MODAL=false
```

Pour Modal reel:

```env
ENABLE_REAL_MODAL=true
MODAL_RENDER_ENDPOINT_URL=
MODAL_WEBHOOK_SECRET=
ENABLE_REAL_TRANSCRIPTION=false
WHISPER_MODEL_SIZE=base
```

Pour Stripe reel:

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_STARTER_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_SCALE_PRICE_ID=
BILLING_DISABLED=false
```

## Supabase

Schema applique sur le projet `ffhgfgdrudkqspgtbcdj`.

Tables principales:

- `projects`
- `project_assets`
- `transcriptions`
- `video_variants`
- `render_jobs`
- `user_credits`
- `credit_transactions`
- `stripe_customers`
- `stripe_subscriptions`

Storage:

- Bucket prive: `videos`
- Chemin attendu: `{user_id}/...`
- Les exports Modal sont ecrits dans `{user_id}/{project_id}/exports/{variant_id}.mp4`

## Modal reel

Fichiers:

- `modal/render_worker.py`
- `modal/requirements.txt`
- `modal/README.md`

Deploiement:

```bash
modal secret create edith-render-secrets SUPABASE_URL=https://ffhgfgdrudkqspgtbcdj.supabase.co SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_STORAGE_BUCKET=videos MODAL_WEBHOOK_SECRET=...
modal deploy modal/render_worker.py
```

Apres deploy, copie l'URL HTTP de `submit_render_project` dans `MODAL_RENDER_ENDPOINT_URL`.

Le worker telecharge la video depuis Supabase Storage, extrait l'audio avec FFmpeg, peut transcrire avec faster-whisper, genere les variantes MP4 avec overlay hook, upload les exports, puis met a jour Supabase.

## Pages MVP

- `/`: landing Edith e-commerce.
- `/auth/login`: connexion Supabase Auth.
- `/auth/register`: inscription Supabase Auth.
- `/dashboard`: vue projets, credits, pipeline.
- `/projects/new`: creation projet, upload direct Supabase Storage, options de rendu.
- `/projects/[id]`: statut, jobs, variantes, telechargement.
- `/pricing`: plans et credits.
- `/settings`: parametres SaaS et etat integrations.
- `/settings/billing`: portail billing placeholder.

## API MVP

- `POST /api/render/start`: verifie la session, cree projet/assets/jobs/variants, reserve les credits si billing actif, declenche Modal ou le mock DB.
- `GET /api/render/status?projectId=...`: retourne projet, jobs et variants de l'utilisateur connecte.
- `GET /api/render/download?path=...`: cree une URL signee Storage pour un export appartenant a l'utilisateur.
- `POST /api/stripe/checkout`: placeholder non bloquant.
- `POST /api/stripe/webhook`: placeholder non bloquant.
- `POST /api/stripe/portal`: placeholder non bloquant.

## Ce qui fonctionne

- Landing page Edith.
- Auth Supabase email/password.
- Dashboard connecte a Supabase.
- Creation projet en base.
- Upload direct vers Supabase Storage.
- Creation des assets, render jobs et variants.
- Polling statut projet.
- Worker Modal reel deployable.
- Mode mock DB pour tester sans Modal.

## Ce qui reste mocke ou a brancher

- Paiement Stripe complet.
- Attribution automatique de credits mensuels.
- Consommation/remboursement final des credits apres completion/echec.
- Plan de montage LLM reel.
- Sous-titres ASS/SRT complets dans FFmpeg.
- Transcription faster-whisper active seulement si `ENABLE_REAL_TRANSCRIPTION=true`.

## Risques restants

- Pas de `LICENSE` detecte: clarifier avant usage commercial.
- Ancien editeur Framedeck encore present et a isoler/supprimer progressivement.
- `SUPABASE_SERVICE_ROLE_KEY` doit rester uniquement dans Cloudflare env server-side, jamais en `NEXT_PUBLIC`.
- Cloudflare ne doit jamais executer FFmpeg; le rendu reste dans Modal.
