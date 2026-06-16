import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages project site is served from /film-maker-web/
const BASE = '/film-maker-web/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'images/app_logo.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Fonts and stickers are large — cache them at runtime on demand
        globIgnores: ['**/fonts/**', '**/stickers/**'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/fonts\/.*\.ttf$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fm-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
          {
            urlPattern: /\/stickers\/.*\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fm-stickers',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
        ],
      },
      manifest: {
        name: 'Film Maker — Memory Films',
        short_name: 'Film Maker',
        description: 'Turn your photos into beautiful cinematic memory films.',
        theme_color: '#C07842',
        background_color: '#0D0D0D',
        display: 'standalone',
        orientation: 'any',
        scope: BASE,
        start_url: BASE,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
