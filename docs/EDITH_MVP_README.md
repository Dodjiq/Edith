# Edith MVP — Installation et état actuel

## Objectif

Edith transforme des rushs produit en variantes publicitaires prêtes à tester: TikTok Ads, Reels Ads, Facebook Ads et Shorts.

Ce MVP prépare le parcours produit sans réutiliser la timeline complète comme coeur du produit.

## Commandes

Depuis la racine:

```bash
pnpm install
pnpm typecheck
pnpm --filter frontend dev
```

Pour Cloudflare Pages:

```bash
pnpm pages:build
```

Configuration Cloudflare recommandée:

```txt
Build command: pnpm pages:build
Build output directory: apps/frontend/.vercel/output/static
Root directory: /
```

## Variables à configurer

Voir `.env.example`.

Minimum pour le mode mock:

```env
ENABLE_MOCK_RENDER=true
ENABLE_REAL_MODAL=false
BILLING_DISABLED=true
```

À brancher pour le mode réel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=videos
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=
MODAL_APP_NAME=edith-render-worker
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Pages MVP

- `/`: landing Edith e-commerce.
- `/auth/login`: connexion mock prête Supabase Auth.
- `/auth/register`: inscription mock prête Supabase Auth.
- `/dashboard`: dashboard MVP.
- `/projects/new`: formulaire génération variantes.
- `/projects/[id]`: statut et variantes mockées.
- `/pricing`: plans et crédits.
- `/settings/billing`: portail billing placeholder.

## API MVP

- `POST /api/render/start`: valide les inputs, crée un projet mock, génère un edit plan mock et des variants.
- `GET /api/render/status?projectId=...`: retourne statut et variants mockés.
- `POST /api/stripe/checkout`: placeholder non bloquant.
- `POST /api/stripe/webhook`: placeholder non bloquant.
- `POST /api/stripe/portal`: placeholder non bloquant.

## Ce qui est mocké

- Auth utilisateur.
- Création projet persistante.
- Upload vidéo Supabase Storage.
- Vérification crédits.
- Déclenchement Modal réel.
- Rendu FFmpeg réel.
- Exports vidéo réels.
- Stripe checkout, webhook et portail client.

## Ce qui est préparé

- Schéma Supabase avec RLS dans `supabase/schema.sql`.
- Version déclarative dans `supabase/schemas/001_edith_mvp.sql`.
- Générateur de plan de montage dans `apps/frontend/src/lib/edit-plan/generate-edit-plan.ts`.
- Client Modal abstrait dans `apps/frontend/src/lib/modal/client.ts`.
- Worker Modal dans `modal/render_worker.py`.

## À brancher réellement

1. Installer/configurer Supabase Auth côté Next.
2. Remplacer le mock store par Supabase Postgres.
3. Ajouter upload direct Supabase Storage.
4. Connecter `/api/render/start` à Modal.
5. Implémenter téléchargement Storage, faster-whisper et FFmpeg dans Modal.
6. Uploader les exports vers Supabase Storage.
7. Brancher Stripe et crédits.
8. Remplacer polling mock par polling Supabase ou Realtime.

## Risques restants

- Pas de `LICENSE` détecté: clarifier avant usage commercial.
- Le mode mock n'est pas persistant.
- Le worker Modal est préparé mais pas encore relié à Supabase.
- Le frontend contient encore l'ancien éditeur isolé.
- Cloudflare ne doit jamais exécuter FFmpeg ou tâches longues.
