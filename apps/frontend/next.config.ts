import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(frontendRoot, '../..');

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

export default nextConfig;
