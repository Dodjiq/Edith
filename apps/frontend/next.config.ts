import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(frontendRoot, '../..');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {
    root: workspaceRoot,
    resolveAlias: {
      tailwindcss: path.join(frontendRoot, 'node_modules/tailwindcss'),
      '@tailwindcss/postcss': path.join(frontendRoot, 'node_modules/@tailwindcss/postcss'),
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV !== 'development',
  },
};

export default withNextIntl(nextConfig);
