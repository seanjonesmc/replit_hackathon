import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import { deckBrandPlugin } from './deck-brand-plugin';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

import { sdmVitePlugin } from './src/.sdm/sdmVitePlugin';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

const workspaceRoot = path.resolve(import.meta.dirname, '..', '..');

export default defineConfig({
  base: basePath,
  // Brand assets (logo, favicon) live once in the workspace-root public/brand.
  publicDir: path.resolve(workspaceRoot, 'public'),
  plugins: [
    deckBrandPlugin(basePath),
    react(),
    runtimeErrorOverlay(),
    tailwindcss(),
    sdmVitePlugin(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@brand': path.resolve(workspaceRoot, 'src', 'brand'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
      allow: [workspaceRoot],
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
