# Supabase Auth Wiring Audit — Edith

Read-only audit of the current Supabase wiring inside `apps/frontend` (Next.js 16 App Router) and `apps/server` (NestJS).

Generated: 2026-06-03

---

## 1. Inventaire des clients Supabase

### Packages installés
- `apps/frontend/package.json`
  - `@supabase/ssr` `^0.10.3`
  - `@supabase/supabase-js` `^2.106.2`
- `apps/server/package.json` — **aucune** dépendance Supabase. Le backend NestJS n'a aucune intégration directe avec Supabase (auth, postgres, storage).

### Clients déclarés dans le frontend
Tous les helpers Supabase vivent sous `apps/frontend/src/utils/supabase/` :

| Fichier | Rôle | API | Clé utilisée |
|---|---|---|---|
| `utils/supabase/client.ts` | Singleton **navigateur** | `createBrowserClient` (`@supabase/ssr`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `utils/supabase/server.ts` | Helper **server (RSC, route handler)** avec cookies Next.js | `createServerClient` (`@supabase/ssr`) + `next/headers` cookies | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `utils/supabase/proxy.ts` | Helper **middleware** pour rafraîchir la session | `createServerClient` + `request.cookies` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `utils/supabase/admin.ts` | Client **service-role** pour les routes API privilégiées | `createClient` (`@supabase/supabase-js`) avec `autoRefreshToken: false`, `persistSession: false` | `SUPABASE_SERVICE_ROLE_KEY` |

Le wrapper côté queries `apps/frontend/src/lib/supabase/project-queries.ts` expose `getCurrentUser()` et `listProjectsForCurrentUser()` en s'appuyant sur le helper server (RLS-aware).

### Tableau récapitulatif des appels Supabase frontend

| Fichier | Client utilisé | Usage |
|---|---|---|
| `app/[locale]/auth/login/page.tsx` | `utils/supabase/client` | `supabase.auth.signInWithPassword` (`'use client'`, action serveur fake) |
| `app/[locale]/auth/register/page.tsx` | `utils/supabase/client` | `supabase.auth.signUp` avec `options.data = { shop_name }` |
| `app/[locale]/projects/new/page.tsx` | `utils/supabase/client` | `auth.getUser()` + `storage.from('videos').upload()` |
| `app/api/render/start/route.ts` | `utils/supabase/server` + `utils/supabase/admin` | `auth.getUser()` puis writes service-role |
| `app/api/render/download/route.ts` | `utils/supabase/server` | `auth.getUser()` + `storage.createSignedUrl` |
| `app/api/render/status/route.ts` (indirect via project-queries) | `utils/supabase/server` | lectures RLS |
| `app/[locale]/dashboard/page.tsx` | `lib/supabase/project-queries` -> server | lectures RLS |
| `app/[locale]/settings/page.tsx` | `lib/supabase/project-queries` -> server | lectures RLS |
| `utils/supabase/proxy.ts` | `createServerClient` (middleware) | `auth.getUser()` pour rafraîchir cookies |

### Backend NestJS (`apps/server`)
Aucun fichier ne référence `supabase`, `SUPABASE_`, `@supabase/...`. Pas de `SupabaseModule`, pas de garde NestJS, pas de validation JWT côté Nest. Le serveur est isolé : toutes les opérations Supabase passent par le frontend Next.js (RSC, route handlers).

---

## 2. Inventaire des flux auth

### Pages d'authentification présentes
- `app/[locale]/auth/login/page.tsx` — **active**, formulaire email/password (client component), appelle `supabase.auth.signInWithPassword`, redirige vers `/dashboard`, puis `router.refresh()`.
- `app/[locale]/auth/register/page.tsx` — **active**, formulaire email/password/shopName, appelle `supabase.auth.signUp` avec metadata `shop_name`. Affiche message indiquant "Verifie tes emails si la confirmation est activee" mais **aucun handling** d'un éventuel email de confirmation/lien magique.
- `app/[locale]/login/page.tsx` + `app/[locale]/login/login-component/auth-page.tsx` — **mockup statique** (boutons Google/Apple/GitHub décoratifs, input email sans handler). Aucun appel Supabase. **Doublon** avec `auth/login` ; il y a un conflit potentiel : `Link href="/auth/login"` dans register pointe vers la page fonctionnelle mais `settings/page.tsx` y pointe aussi (`<Link href={user ? '/dashboard' : '/auth/login'}>`).

### signIn / signUp
- Les deux flows utilisent **le client browser** (`createBrowserClient`) directement depuis un composant `'use client'`.
- L'`action={signIn}` du `<form>` est en fait une **fonction client** (pas une server action). Cela signifie que le mot de passe transite via fetch côté navigateur — acceptable pour Supabase (HTTPS + JWT cookie), mais inhabituel pour une App Router stack qui privilégierait `'use server'`.
- Aucun `try/catch` global, aucun appel à `revalidatePath`/`revalidateTag`.

### Middleware / route protection
- Fichier `apps/frontend/src/middleware.ts` (le seul actif) :
  ```ts
  import createMiddleware from 'next-intl/middleware';
  import { routing } from './i18n/routing';
  export default createMiddleware(routing);
  export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)' ] };
  ```
  → **uniquement next-intl**, aucune logique Supabase.

- Fichiers `proxy.ts` Supabase existants mais **inutilisés** :
  - `apps/frontend/src/proxy.ts` importe `updateSession` depuis `@/utils/supabase/proxy`.
  - `apps/frontend/proxy.ts` (à la racine de l'app) est un logger de requêtes différent.
  - Ces deux fichiers exportent `export async function proxy(...)` ET `export const config = { matcher: ... }`. Or **Next.js v16 attend `middleware.ts`** (avec `export default` ou `export function middleware`). Ces `proxy.ts` ne sont jamais chargés par Next.js — la convention est obsolète/inventée. Le helper `updateSession` ne s'exécute donc jamais en pratique : **les sessions Supabase ne sont rafraîchies que lorsque les Server Components/route handlers appellent eux-mêmes `auth.getUser()`**.

- Conséquence : **aucune protection automatique** sur `/dashboard`, `/projects`, `/projects/[id]`, `/settings`. Un utilisateur non authentifié peut charger ces pages ; elles dégradent silencieusement (`!user` → vide, ou la page mockup s'affiche). C'est volontaire pour le mode "mock" (cf. `dashboard/page.tsx` qui retourne `{ user: null, projects: [], credits: null }`), mais cela rend la frontière auth floue.

### Callback OAuth
- **Aucune** route `app/auth/callback/route.ts` ni `app/[locale]/auth/callback/route.ts`.
- Le `auth-page.tsx` mockup montre des boutons sociaux (Google/Apple/GitHub) **non fonctionnels** : pas d'appel `supabase.auth.signInWithOAuth`, pas d'URL de redirection définie.

### Session refresh côté SSR
- Le helper `utils/supabase/server.ts` swallow le `cookies.setAll()` quand appelé depuis un Server Component (commentaire : "Session refresh is handled by proxy") — mais le proxy n'est pas branché en pratique (cf. ci-dessus).
- Sur chaque RSC qui appelle `getCurrentUser()`, Supabase essaie de rafraîchir le JWT ; le cookie peut être mis à jour seulement dans un Server Action ou Route Handler. Pour les pages purement RSC (`dashboard`, `settings`), si le refresh token est utilisé, le nouveau JWT est perdu (try/catch silencieux). Les utilisateurs peuvent être déloggés au prochain refresh expiré.

---

## 3. Identification des gaps

### Auth wiring
- **`middleware.ts` ne combine pas next-intl + Supabase auth refresh.** Les fichiers `proxy.ts` ne sont jamais exécutés par Next.js (mauvaise convention).
- **Aucune route protection** sur les pages privées (`/dashboard`, `/settings`, `/projects/*`).
- **Aucun callback OAuth** ; les boutons Google/Apple/GitHub du mockup `auth-page.tsx` ne déclenchent rien.
- **Aucun handler** d'email confirmation ni de lien magique (pas de page `/auth/confirm`, pas de route `verifyOtp`).
- **Aucune page reset password / forgot password** ; pas de `resetPasswordForEmail`, pas de `/auth/update-password`.
- **Aucune fonction signOut** dans le code (chercher "signOut" = 0 occurrence). Pas de bouton "Se déconnecter".

### Auto-provisioning à signup
- **Aucun trigger Postgres** dans `supabase/schema.sql` ni `supabase/schemas/001_edith_mvp.sql` pour créer automatiquement une ligne `user_credits` au signup. Conséquence : tout user fraîchement inscrit n'a pas de balance ; `/api/render/start` lit `(credits?.balance ?? 0)` et passe correctement quand `BILLING_DISABLED=true` mais bloquera dès qu'on activera Stripe.
- **Aucune table `profiles`** dans le schéma. Le `shop_name` envoyé via `options.data = { shop_name }` ne tombe que dans `auth.users.raw_user_meta_data` — non interrogeable via RLS facilement, et perdu si l'utilisateur change d'email.
- **Pas de provisioning Stripe** (`stripe_customers` reste vide jusqu'à un webhook qui n'est pas implémenté — cf. `STRIPE_AUDIT.md`).

### Configuration des clés
- Les helpers utilisent `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (nouveau nom). Le `.env.local` contient à la fois `PUBLISHABLE_KEY` et `ANON_KEY`. Côté Supabase Cloud, ces deux clés sont en transition — vérifier que `PUBLISHABLE_KEY` est bien acceptée par le projet `ffhgfgdrudkqspgtbcdj`. `SUPABASE_SERVICE_ROLE_KEY` est **vide** dans `.env.local`, ce qui fait crasher `createAdminClient()` à la première écriture.
- `.env.example` ne mentionne pas `SUPABASE_SERVICE_ROLE_KEY`.

### Pages dupliquées
- `app/[locale]/login/page.tsx` (mockup décoratif, non fonctionnel) cohabite avec `app/[locale]/auth/login/page.tsx` (formulaire fonctionnel). Risque de confusion pour l'utilisateur si un lien interne pointe vers `/login` plutôt que `/auth/login`.

### Backend NestJS hors-circuit
- Le serveur Nest n'a aucun moyen d'authentifier ses propres routes au nom d'un user Supabase. Si une feature serveur (transcription, render, AI gateway) doit lier un job à un `user_id`, **il faut soit (a) injecter le JWT depuis le frontend et le valider Nest-side avec `@supabase/supabase-js` + `getUser()`**, **soit (b) déplacer ces opérations dans des route handlers Next.js**. Aujourd'hui : ni l'un ni l'autre.

### RLS / Storage
- Les policies RLS dans `schema.sql` sont correctes et bien scoppées (`(select auth.uid()) = user_id`). Le bucket `videos` est privé et le storage path est `${user.id}/...`.
- **Manque** : pas de policy `INSERT` sur `user_credits` ni `credit_transactions` (uniquement `SELECT`). C'est cohérent (writes via service role), mais à documenter.

---

## 4. Recommandations ordonnées

### P0 — bloquant pour shipping
1. **Renommer `apps/frontend/src/proxy.ts` en `apps/frontend/src/middleware.ts`** et fusionner avec le middleware next-intl actuel. Pattern recommandé (séquentiel : Supabase d'abord pour rafraîchir cookies, puis next-intl pour routing) :
   - Fichier à toucher : `apps/frontend/src/middleware.ts` (à réécrire).
   - Renvoyer `supabaseResponse` au lieu de `NextResponse.next()` après avoir passé `request` à `createMiddleware(routing)`.
   - Supprimer (ou renommer) `apps/frontend/proxy.ts` et `apps/frontend/src/proxy.ts` pour éviter la confusion.
2. **Ajouter `SUPABASE_SERVICE_ROLE_KEY`** dans `.env.local` + `.env.example`. Sans cela, `/api/render/start` plante en mode user.
3. **Ajouter un trigger Postgres `on_auth_user_created`** dans `supabase/schema.sql` (ou nouvelle migration) qui insère une ligne `user_credits` avec `balance = monthly_allowance` (allowance plan free). Exemple :
   - Fichier : `supabase/migrations/002_handle_new_user.sql` (nouveau).
   - Fonction `public.handle_new_user()` SECURITY DEFINER + trigger AFTER INSERT sur `auth.users`.
4. **Ajouter une vraie route protection** dans le nouveau middleware combiné. Pages à protéger : `/(fr|en)?/dashboard`, `/projects`, `/projects/*`, `/settings`, `/settings/*`. Si pas de user → redirect vers `/auth/login?next=...`.

### P1 — important pour MVP
5. **Implémenter `signOut`** + bouton dans le header dashboard.
   - Fichier : nouveau composant `components/auth/sign-out-button.tsx` (server action ou client) + intégration `app/[locale]/dashboard/page.tsx` header.
6. **Ajouter callback OAuth** `app/auth/callback/route.ts` (`exchangeCodeForSession`) + brancher les boutons sociaux de `auth-page.tsx` sur `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: ... }})`. Sinon retirer les boutons décoratifs.
7. **Page reset password** :
   - `app/[locale]/auth/forgot-password/page.tsx` → `supabase.auth.resetPasswordForEmail`.
   - `app/[locale]/auth/update-password/page.tsx` → `supabase.auth.updateUser`.
   - Route handler `app/auth/confirm/route.ts` pour le `type=recovery` / `email_change` token.
8. **Décision sur `/[locale]/login/*`** (mockup). Soit le supprimer, soit le faire fonctionner et supprimer `/auth/login`. Aujourd'hui il y a un dead code path.
9. **Créer une table `profiles`** (id = auth.users.id) qui matérialise `shop_name`, `plan`, `locale`, et auto-insertion via le trigger P0#3. RLS `select/update own`.

### P2 — hygiène
10. **Migrer signIn/signUp vers des Server Actions** (`'use server'`) pour éliminer le besoin de `'use client'` sur ces pages et utiliser `revalidatePath('/', 'layout')` au lieu de `router.refresh()`.
11. **Auth pour le backend Nest** si on veut découpler la file de jobs longs (transcription, video-analysis) du frontend : ajouter un `SupabaseAuthGuard` Nest qui valide le `Authorization: Bearer <jwt>` envoyé depuis le client et expose `req.user`. Sinon documenter explicitement que toutes les opérations user-scoped passent par Next.js.
12. **Documenter** dans `docs/supabase/` un guide spécifique à Edith expliquant la combinaison middleware next-intl + Supabase (les guides officiels Supabase ne couvrent pas next-intl).
13. **Ajouter un script** `pnpm db:migrate` qui applique `supabase/schemas/001_edith_mvp.sql` et les futures migrations.

---

## 5. Conflit middleware next-intl ↔ Supabase — flag explicite

Le middleware actuel `apps/frontend/src/middleware.ts` exécute uniquement `createMiddleware(routing)` de `next-intl`. Le helper Supabase `utils/supabase/proxy.ts::updateSession` n'est jamais branché car les fichiers `proxy.ts` ne suivent pas la convention Next.js 16 (`middleware.ts`).

**Combiner les deux** suppose :
1. Importer `updateSession` depuis `@/utils/supabase/proxy` et l'appeler en premier, en lui passant `request`.
2. Récupérer la `supabaseResponse` produite (qui contient déjà les cookies refresh).
3. Passer ensuite à `createMiddleware(routing)` qui peut soit retourner sa propre `NextResponse.redirect` (locale prefix), soit `NextResponse.next` ; dans ce dernier cas, **copier les cookies** depuis `supabaseResponse` vers la response next-intl pour ne pas perdre le refresh JWT.
4. La doc officielle Supabase (`docs/supabase/bootstrap_next_js_v16_app_with_supabase_auth.md`) **insiste** : il ne faut RIEN faire entre `createServerClient` et `auth.getUser()`, et il faut retourner exactement la `supabaseResponse` pour ne pas désynchroniser cookies browser/serveur. Une intégration naïve next-intl casse cette invariant.

Référence de pattern (à valider en lib check) : `https://supabase.com/docs/guides/auth/server-side/nextjs#5-create-a-middleware-file` + traitement séparé du `routing` next-intl.

---

## Annexe — chemins absolus utiles

- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\middleware.ts`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\proxy.ts`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\proxy.ts`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\utils\supabase\client.ts`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\utils\supabase\server.ts`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\utils\supabase\proxy.ts`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\utils\supabase\admin.ts`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\lib\supabase\project-queries.ts`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\app\[locale]\auth\login\page.tsx`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\app\[locale]\auth\register\page.tsx`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\app\[locale]\login\page.tsx`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\app\[locale]\login\login-component\auth-page.tsx`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\app\[locale]\dashboard\page.tsx`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\app\[locale]\settings\page.tsx`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\app\[locale]\projects\new\page.tsx`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\app\api\render\start\route.ts`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\app\api\render\download\route.ts`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\src\app\api\render\status\route.ts`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\.env.example`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\apps\frontend\.env.local`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\supabase\schema.sql`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\supabase\schemas\001_edith_mvp.sql`
- `C:\Users\Samsung\OneDrive\Desktop\Saas\coding\TryEdit\framedeck\docs\supabase\bootstrap_next_js_v16_app_with_supabase_auth.md`
