/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      includeAssets: ['apple-touch-icon.png', 'icons/icon.svg'],
      manifest: {
        name: 'הרשימה שלנו',
        short_name: 'קניות',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        start_url: '/',
        theme_color: '#fdf1f3',
        background_color: '#fdf1f3',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Firebase Auth handler lives under /__/auth/ (proxied by Vercel); never serve the SPA shell for it.
        navigateFallbackDenylist: [/^\/__\//],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['tests/emulator/**', 'node_modules/**'],
  },
});
