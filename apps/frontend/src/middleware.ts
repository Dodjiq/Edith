import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { routing, type Locale } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// Paths that require an authenticated user. Match with or without locale prefix.
const PROTECTED_PREFIXES = ['/dashboard', '/projects', '/settings'];

const stripLocalePrefix = (pathname: string): string => {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(`/${locale}`.length);
  }
  return pathname;
};

const isProtectedPath = (pathname: string): boolean => {
  const normalized = stripLocalePrefix(pathname);
  return PROTECTED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
};

const getLocaleFromPath = (pathname: string): Locale => {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return routing.defaultLocale;
};

const buildLoginRedirect = (request: NextRequest, locale: Locale): NextResponse => {
  const url = request.nextUrl.clone();
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  url.pathname = `${prefix}/auth/login`;
  url.search = '';
  url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
};

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  // 1) Let next-intl resolve the locale and produce its response (rewrites / cookies).
  const response = intlMiddleware(request);

  // 2) Refresh the Supabase session on every navigation by piggy-backing on `response.cookies`.
  //    Skip auth work entirely if Supabase env vars are missing so the app boots without them.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3) Protect dashboard/projects/settings behind auth.
  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const locale = getLocaleFromPath(request.nextUrl.pathname);
    return buildLoginRedirect(request, locale);
  }

  return response;
}

export const config = {
  // Run on every navigation except API routes, Next internals, and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
