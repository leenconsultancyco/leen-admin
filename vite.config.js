import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: '/leen-admin/',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Ping must never be served from cache — a cached pong while offline
            // would make the app think it's online when it isn't.
            urlPattern: ({ url }) => url.searchParams.get('action') === 'ping',
            handler: 'NetworkOnly',
          },
          {
            // All other Apps Script requests: try network first, fall back to cache.
            // Short maxAgeSeconds (300s) keeps financial data fresh.
            urlPattern: ({ url }) => url.hostname === 'script.google.com',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300,
              },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: 'dist',
  },
});
