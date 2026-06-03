# Edith — Audit du repo Framedeck

## Résumé exécutif

Le dépôt actuel est un monorepo PNPM/Turborepo déjà renommé en Edith dans plusieurs textes, mais son architecture reste celle de Framedeck: un éditeur vidéo IA généraliste avec timeline Remotion, backend NestJS, upload S3 multipart, transcription ElevenLabs Scribe v2, analyse TwelveLabs et rendu Remotion Lambda.

Cette base est utile pour comprendre les patterns d'upload, de realtime et d'orchestration IA, mais elle est trop large pour le MVP Edith. Edith doit devenir une machine à produire des variantes publicitaires e-commerce, pas un éditeur vidéo manuel. La migration recommandée est progressive: garder temporairement le frontend existant isolé, créer un parcours MVP dédié, déplacer le stockage vers Supabase, préparer Modal/FFmpeg pour les rendus lourds, et supprimer plus tard les dépendances non MVP.

Point légal important: aucun fichier `LICENSE` n'a été détecté à la racine. Sans licence commerciale claire, il faut éviter de copier aveuglément le code Framedeck dans un produit commercial et privilégier une réécriture ou une inspiration architecturale.

## Structure du repo

- `apps/frontend`: application Next.js App Router, React 19, Tailwind CSS v4, Remotion Player, editor UI, chatbot, upload UI, timeline, state local.
- `apps/server`: backend NestJS 11, ts-rest, Socket.IO, AWS S3, AI SDK, ElevenLabs, TwelveLabs, Deepgram, Remotion Lambda.
- `apps/media-processor`: service Rust/Axum interne pour extraire l'audio avec FFmpeg avant transcription.
- `packages/api-types`: contrat partagé ts-rest, schémas Zod, constantes realtime, types de tools, types motion design.
- `docs`: guides Supabase et documents de specs/reports.
- `scripts`: helpers portless pour le dev local.

## Stack actuelle détectée

- Monorepo: PNPM `10.22.0`, Turborepo.
- Frontend: Next.js 16, React 19, Tailwind CSS v4, shadcn/Radix, Zustand, TanStack Query, Socket.IO client, Remotion.
- Backend: NestJS 11, ts-rest, AI SDK 6, Socket.IO, AWS SDK S3, Remotion Lambda, ElevenLabs, TwelveLabs, Deepgram.
- Media processor: Rust, Axum, FFmpeg.
- Contrat partagé: `@ts-rest/core`, Zod, TypeScript 6.
- Déploiement: Vercel pour le frontend Next.js (`wrangler.toml` et `pages:build` restent en legacy).

## Fonctionnalités actuelles détectées

- Upload direct S3 multipart via backend: init, sign parts, complete, abort.
- Transcription ElevenLabs Scribe v2 après upload, avec extraction audio Rust pour les vidéos.
- Analyse vidéo TwelveLabs déclenchée en arrière-plan.
- Rendu Remotion Lambda depuis le backend Nest.
- Realtime Socket.IO pour chat, progression upload, transcription et analyse vidéo.
- Agent IA avec tools pour manipuler timeline, items, captions, silences, motion designs et assets.
- Timeline visuelle complexe avec Remotion Player, tracks, items, drag/drop, trimming, cuts et state local.
- Pages existantes: landing minimale, login, pricing, settings, projects, editor project.
- Auth existante: UI d'auth présente, mais pas d'intégration Supabase Auth vérifiée. Les boutons/formulaires semblent surtout être une façade.
- Paiement/crédits: pas d'intégration Stripe fonctionnelle détectée.

## Parties réutilisables

- Next.js App Router et structure frontend.
- Tailwind CSS v4 et plusieurs composants UI.
- Patterns de validation Zod.
- Patterns de jobs asynchrones et statuts.
- Certaines idées de progress UI et cards.
- Patterns d'upload direct, à réécrire pour Supabase Storage.
- Helpers de captions/timing à évaluer, mais sans dépendre d'ElevenLabs.

## Parties à adapter

- Landing, pricing, dashboard et pages projet vers le vocabulaire e-commerce.
- Upload vidéo vers Supabase Storage au lieu de S3.
- Realtime: remplacer Socket.IO backend par Supabase Realtime ou polling simple.
- Contrat API: remplacer ts-rest/Nest pour le MVP Vercel par routes Next légères.
- Rendu: remplacer Remotion Lambda par Modal + Python + FFmpeg.
- Transcription: remplacer ElevenLabs/Deepgram par faster-whisper sur Modal.
- Statuts projet/assets/variants vers un modèle Supabase simple.

## Parties à remplacer

- `apps/server` pour le MVP: NestJS ne correspond pas à l'objectif Vercel/API légère.
- AWS S3/Remotion Lambda pour stockage/rendu.
- ElevenLabs, TwelveLabs et Deepgram pour le MVP.
- Media processor Rust pour extraction audio: Modal + FFmpeg Python doit prendre ce rôle.
- Timeline complexe comme expérience centrale.

## Parties à supprimer plus tard

- Editor timeline complet sous `apps/frontend/src/app/projects/[project-id]/_editor-container`.
- Chatbot généraliste orienté édition manuelle.
- Motion design registry volumineux si non utilisé par les presets MVP.
- Service Nest et media processor après migration API/Modal.
- Routes upload/rendu/captions existantes basées sur S3/Remotion.

## Risques techniques

- Vercel ne peut pas exécuter FFmpeg ni jobs longs: tout rendu doit partir vers Modal.
- Monorepo actuel build aussi Rust/Nest si mauvais script: viser `pnpm --filter frontend build` pour Vercel.
- Next.js 16 sur Vercel peut demander des adaptations runtime mineures.
- Supabase Storage direct upload pour grosses vidéos doit être cadré: limites, resumable upload et validation MIME/durée.
- Migration d'un éditeur riche vers un MVP simple peut laisser beaucoup de code mort temporaire.
- Les variables env actuelles sont orientées AWS/ElevenLabs/TwelveLabs; il faut les remplacer progressivement.
- RLS Supabase doit être stricte avant usage réel.
- Le mode mock doit être clair pour ne pas donner l'impression que le rendu réel est déjà branché.

## Risques liés à la licence

Aucun fichier `LICENSE` n'a été détecté. Cela signifie qu'il n'y a pas de permission explicite d'usage commercial dans le repo local. Pour Edith, il faut:

- considérer le code Framedeck comme non réutilisable commercialement tant que la licence n'est pas clarifiée;
- utiliser ce dépôt pour audit, apprentissage et migration interne prudente;
- réécrire les zones produit critiques d'Edith quand le doute légal existe;
- éviter de copier aveuglément les prompts, composants propriétaires ou gros modules d'édition.

## Écart entre Framedeck et Edith

Framedeck est un éditeur vidéo IA généraliste: timeline, outils manuels, Remotion, agent de montage interactif. Edith doit être un générateur de variantes publicitaires e-commerce: projet, upload, preset, instruction, job, exports.

L'écart principal est donc produit et opérationnel:

- moins d'éditeur manuel;
- plus de workflow guidé;
- moins de rendu côté app;
- plus de batch jobs Modal;
- moins d'APIs vidéo externes;
- plus de stockage et statut Supabase;
- moins de motion design généraliste;
- plus de presets publicitaires simples.

## Plan de migration recommandé

1. Garder temporairement l'éditeur existant isolé.
2. Créer le parcours MVP dédié: landing, auth, dashboard, projet, upload, statut, résultats.
3. Introduire Supabase schema, env et clients serveur/client.
4. Ajouter un mode mock local pour créer projets, variants et statuts sans dépendances externes.
5. Ajouter Modal worker mock puis FFmpeg réel.
6. Remplacer upload S3 par Supabase Storage direct upload.
7. Remplacer transcription ElevenLabs par faster-whisper sur Modal.
8. Ajouter Stripe en mode non bloquant avec `BILLING_DISABLED=true`.
9. Débrancher progressivement NestJS, Rust et Remotion Lambda du MVP.
10. Clarifier la licence avant toute commercialisation basée sur du code existant.
