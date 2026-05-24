const portlessFrontendHost = 'ai-video-editor.localhost';
const portlessBackendHost = 'api-ai-video-editor.localhost';
const defaultBackendUrl = 'http://localhost:4000';
const defaultPortlessPort = '1355';

const trimTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

const parseUrl = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

const isLocalhost = (hostname: string): boolean =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';

const resolvePortlessBackendUrl = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const configuredBackendUrl = process.env.NEXT_PUBLIC_BASE_URL_BACKEND ?? '';
  const isPortlessFrontend = window.location.hostname === portlessFrontendHost;
  const configuredPortlessBackendUrl = configuredBackendUrl.includes(portlessBackendHost);
  const isLocalFrontend = isLocalhost(window.location.hostname);

  if (!isPortlessFrontend && !(isLocalFrontend && configuredPortlessBackendUrl)) {
    return null;
  }

  const configuredUrl = parseUrl(configuredBackendUrl);
  const protocol = window.location.protocol.replace(':', '') || configuredUrl?.protocol.replace(':', '') || 'http';
  const port =
    configuredUrl?.port || (isPortlessFrontend && window.location.port ? window.location.port : defaultPortlessPort);
  const portSegment = port ? `:${port}` : '';

  return `${protocol}://${portlessBackendHost}${portSegment}`;
};

export const getBackendUrl = (): string => {
  const portlessBackendUrl = resolvePortlessBackendUrl();

  if (portlessBackendUrl) {
    return portlessBackendUrl;
  }

  return trimTrailingSlash(process.env.NEXT_PUBLIC_BASE_URL_BACKEND || defaultBackendUrl);
};

export const getWebSocketUrl = (): string => {
  const portlessBackendUrl = resolvePortlessBackendUrl();

  if (portlessBackendUrl) {
    return portlessBackendUrl;
  }

  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_BASE_URL_WEBSOCKET ?? process.env.NEXT_PUBLIC_BASE_URL_BACKEND ?? defaultBackendUrl,
  );
};
