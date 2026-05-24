import type { NextRequest } from 'next/server';
import { NextResponse, after } from 'next/server';

const LOG_PREFIX = '[RequestLogger]';
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const shouldSkip = (pathname: string) => {
  return pathname.startsWith('/_next') || pathname.startsWith('/favicon');
};

const canReadBody = (method: string, contentType: string) => {
  if (!BODY_METHODS.has(method)) {
    return false;
  }

  return contentType.includes('application/json') || contentType.startsWith('text/');
};

const readBody = async (request: NextRequest, contentType: string) => {
  if (!canReadBody(request.method, contentType)) {
    return undefined;
  }

  try {
    const text = await request.clone().text();

    if (!text) {
      return undefined;
    }

    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    return text.length > 1024 ? `${text.slice(0, 1024)}...` : text;
  } catch {
    return undefined;
  }
};

export async function proxy(request: NextRequest) {
  const url = new URL(request.url);

  if (shouldSkip(url.pathname)) {
    return NextResponse.next();
  }

  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  const body = await readBody(request, contentType);
  const searchEntries = Array.from(url.searchParams.entries());
  const headers = Object.fromEntries(request.headers.entries());

  console.info(LOG_PREFIX, 'start', {
    requestId,
    method: request.method,
    pathname: url.pathname,
    searchParams: searchEntries.length ? Object.fromEntries(searchEntries) : undefined,
    headers,
    body,
  });

  const response = NextResponse.next();

  after(() => {
    console.info(LOG_PREFIX, 'end', {
      requestId,
      method: request.method,
      pathname: url.pathname,
      status: response.status,
      ok: response.ok,
      durationMs: Date.now() - startedAt,
    });
  });

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};



