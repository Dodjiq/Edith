export const EDITOR_API_BASE = process.env.NEXT_PUBLIC_EDITOR_API_BASE ?? '';

export const getApiUrl = (path: string): string => {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  if (!EDITOR_API_BASE) {
    return suffix;
  }
  return `${EDITOR_API_BASE}${suffix}`;
};
