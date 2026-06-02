# Edith — Architecture cible

## Diagramme texte

```txt
Next.js App Router on Cloudflare Pages / OpenNext
  ↓
Routes API légères Next.js
  ↓
Supabase Auth + Postgres + Storage
  ↓
/api/render/start
  ↓
Modal.com render worker
  ↓
Python + faster-whisper + FFmpeg
  ↓
Supabase Storage exports + Postgres status updates
  ↓
Dashboard Edith avec polling ou Supabase Realtime
```

## Responsabilités

### Cloudflare Pages / Workers

- Héberger l'application Next.js.
- Gérer les pages publiques et dashboard.
- Exécuter uniquement des API légères: création projet, vérification session, statut rendu, Stripe webhooks, déclenchement Modal.
- Ne jamais lancer FFmpeg, transcription ou rendu vidéo lourd.

### Supabase Auth

- Authentifier les utilisateurs.
- Fournir `auth.uid()` pour les policies RLS.
- Protéger les projets, assets, variants, jobs et crédits par utilisateur.

### Supabase Postgres

- Source de vérité pour projets, assets, transcriptions, variants, render jobs, crédits et abonnements.
- RLS obligatoire sur toutes les tables utilisateur.
- Statuts contrôlés pour éviter les états incohérents.

### Supabase Storage

- Stocker vidéos sources, fichiers temporaires utiles, assets et exports.
- Les uploads utilisateur doivent être directs depuis le navigateur quand possible.
- Les exports Modal doivent être uploadés avec la service role.

### Modal.com

- Exécuter les jobs longs et coûteux.
- Télécharger la source depuis Supabase Storage.
- Extraire l'audio, transcrire, générer le plan de montage, rendre les variantes et uploader les exports.
- Mettre à jour Postgres avec la service role.

### Stripe

- Gérer checkout, abonnements, portail client et webhooks.
- Alimenter `user_credits` et `credit_transactions`.
- Ne pas bloquer le MVP si `BILLING_DISABLED=true`.

## Flux d'upload

1. L'utilisateur crée un projet.
2. Le client vérifie type et taille vidéo.
3. Le client upload directement vers Supabase Storage dans `users/{user_id}/projects/{project_id}/sources/`.
4. Une ligne `project_assets` est créée avec `storage_path`, `mime_type`, `size_bytes` et statut `uploaded`.
5. Le projet passe à `uploaded`.

Pour les gros fichiers, privilégier l'upload résumable Supabase/TUS si disponible dans l'environnement. Sinon limiter la taille MVP et documenter la limite.

## Flux de rendu

1. L'utilisateur choisit preset, format, nombre de variantes, langue et instructions.
2. `/api/render/start` vérifie la session, la propriété du projet et les crédits.
3. L'API crée `render_jobs` et `video_variants`.
4. Les crédits sont réservés via `credit_transactions`.
5. L'API déclenche Modal.
6. Modal met à jour les statuts: `queued`, `transcribing`, `planning`, `rendering`, `completed` ou `failed`.
7. Le dashboard poll `/api/render/status` ou écoute Supabase Realtime.
8. Les exports sont affichés avec liens de téléchargement signés.

## Flux de paiement

1. L'utilisateur choisit un plan sur `/pricing`.
2. `/api/stripe/checkout` crée une session Stripe.
3. Stripe redirige après paiement.
4. `/api/stripe/webhook` enregistre customer, subscription et crédits mensuels.
5. `/settings/billing` ouvre le portail client via `/api/stripe/portal`.

## Flux de crédits

- 1 variante courte coûte 5 crédits.
- Les crédits sont réservés au lancement du job.
- Si le job réussit, la réservation devient dépense confirmée.
- Si le job échoue techniquement, une transaction de remboursement est créée.
- Si `BILLING_DISABLED=true`, l'API peut accorder des crédits de développement.

## Limites Cloudflare à respecter

- Pas de FFmpeg.
- Pas de transcription.
- Pas de téléchargement massif ou traitement vidéo.
- Pas de job long bloquant.
- Pas de secret service role exposé au client.
- Les routes doivent rester courtes et idempotentes quand possible.

## Stratégie de sécurité

- RLS Supabase sur toutes les tables utilisateur.
- `SUPABASE_SERVICE_ROLE_KEY` seulement côté serveur/Modal.
- Secrets Modal et Stripe uniquement côté serveur.
- Validation Zod sur toutes les entrées API.
- Vérification ownership `project.user_id = auth.uid()`.
- Limitation MIME à `video/*` au MVP.
- Limitation taille/durée à définir dans l'API.
- Logs sans secrets, URLs signées courtes.

## Stratégie d'erreur

- Chaque job garde `error_message` et `render_metadata`.
- Les erreurs Modal mettent `render_jobs.status = failed` et `projects.status = failed`.
- Les variants non terminés passent à `failed`.
- Les crédits réservés sont remboursés si l'échec est technique.
- Le dashboard affiche un message clair et une action de retry.

## Stratégie de retry

- Un retry crée un nouveau `render_jobs`.
- Les anciennes variantes peuvent être conservées avec statut `failed`.
- Le retry ne doit pas doubler les crédits si le remboursement précédent a été fait.
- Modal doit nettoyer les fichiers temporaires avant de quitter.

## Stratégie de statut projet

Statuts recommandés:

- `draft`: projet créé sans vidéo.
- `uploaded`: source vidéo disponible.
- `queued`: job créé.
- `transcribing`: Modal transcrit.
- `planning`: plan de montage généré.
- `rendering`: FFmpeg exporte les variantes.
- `completed`: toutes les variantes attendues sont prêtes.
- `failed`: erreur technique ou validation.
- `cancelled`: job annulé.
