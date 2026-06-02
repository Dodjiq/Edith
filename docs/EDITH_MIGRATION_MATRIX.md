# Edith — Migration Matrix

| Zone | Chemin | Rôle actuel | Décision | Raison | Action recommandée |
|---|---|---|---|---|---|
| Monorepo | `package.json`, `pnpm-workspace.yaml`, `turbo.json` | Organisation PNPM/Turbo | KEEP | Stable et utile pendant la migration | Garder, mais limiter Cloudflare à `pages:build` |
| Frontend app | `apps/frontend` | Next.js App Router + editor | ADAPT | La base Next/Tailwind est utile | Créer un parcours MVP e-commerce séparé |
| UI primitives | `apps/frontend/src/components` | Boutons, inputs, cards, tooltips, shadcn/Radix | KEEP | Réutilisable pour dashboard et formulaires | Réutiliser sans importer le poids editor |
| Landing | `apps/frontend/src/app/page.tsx` | Page d'accueil générique | ADAPT | Doit porter le positionnement Edith | Remplacer copy par e-commerce ads |
| Auth UI | `apps/frontend/src/app/login` | UI login sans auth vérifiée | REPLACE_NOW | Supabase Auth est cible obligatoire | Créer `/auth/login` et `/auth/register` en mode prêt Supabase |
| Projects list | `apps/frontend/src/app/projects/page.tsx` | Liste projets editor | ADAPT | Utile conceptuellement | Rediriger vers dashboard MVP |
| Editor project | `apps/frontend/src/app/projects/[project-id]` | Éditeur timeline complet | ISOLATE | Trop complexe pour MVP | Garder temporairement, ne pas en faire le parcours principal |
| Chatbot | `apps/frontend/src/app/projects/[project-id]/_chatbot` | Agent d'édition généraliste | REMOVE_LATER | Hors scope génération ads MVP | Isoler, puis remplacer par instructions projet |
| Timeline | `apps/frontend/src/app/projects/[project-id]/_editor-container/editor` | Timeline visuelle riche | ISOLATE | MVP ne doit pas être un éditeur manuel | Ne pas supprimer avant stabilisation, mais éviter dépendance MVP |
| Remotion frontend | `apps/frontend/src/app/projects/[project-id]/_editor-container/remotion` | Preview/compositions | REMOVE_LATER | Modal/FFmpeg cible rendu | Garder seulement si utile pour preview |
| Shared contracts | `packages/api-types` | ts-rest + realtime editor | ISOLATE | Très couplé Nest/editor | Garder pour legacy, créer types MVP dédiés |
| Server Nest | `apps/server` | API, tools, S3, transcription, render | REPLACE_NOW | Cloudflare API légère cible | Ne plus dépendre du serveur pour MVP |
| AWS S3 | `apps/server/src/aws` | Stockage et presigned URLs | REPLACE_NOW | Supabase Storage cible obligatoire | Remplacer par Supabase Storage direct upload |
| Upload service | `apps/server/src/upload` | Multipart S3 + background jobs | REPLACE_NOW | Trop lié AWS/Nest/ElevenLabs/TwelveLabs | Réécrire flow Supabase + Modal |
| ElevenLabs | `apps/server/src/elevenlabs` | Transcription Scribe v2 | REPLACE_NOW | Non MVP demandé | Remplacer par faster-whisper sur Modal |
| TwelveLabs | `apps/server/src/video-analysis` | Analyse vidéo externe | REPLACE_NOW | Non MVP demandé | Supprimer du MVP |
| Deepgram | `apps/server/src/deepgram` | Provider speech optionnel | REPLACE_NOW | Non MVP demandé | Retirer du parcours MVP |
| Media processor Rust | `apps/media-processor` | Extraction audio FFmpeg | REPLACE_NOW | Modal doit gérer FFmpeg | Réimplémenter dans `modal/render_worker.py` |
| Realtime Socket.IO | `apps/server/src/realtime`, `WebSocketProvider.tsx` | Événements editor | REPLACE_NOW | Supabase Realtime/polling cible | MVP polling simple via API status |
| Render Remotion Lambda | `apps/server/src/render` | Export vidéo Remotion | REPLACE_NOW | Rendu lourd sur Modal FFmpeg | Remplacer par job Modal |
| Motion design registry | `packages/api-types/src/motion-design-registry` | Templates nombreux | REMOVE_LATER | Trop large pour 3 presets MVP | Garder hors parcours, supprimer après |
| Cloudflare config | `wrangler.toml`, `pages:build` | Build Pages frontend | KEEP | Nécessaire pour déploiement | Conserver, vérifier output Pages |
| Supabase schema | `supabase/schema.sql` | À créer | REPLACE_NOW | Base cible obligatoire | Ajouter tables, RLS, statuts |
| Modal worker | `modal/` | À créer | REPLACE_NOW | Jobs lourds cible obligatoire | Ajouter worker mock/FFmpeg-ready |
| Stripe | Routes à créer | Absent | REPLACE_NOW | Crédits/paiements cible | Préparer endpoints non bloquants |
| Licence | `LICENSE` | Absent | REPLACE_NOW | Risque commercial | Clarifier avant exploitation |
