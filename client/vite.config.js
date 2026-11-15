import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

/**
 * `vite build --mode preview-page` makes a self-contained, server-free build (no service worker,
 * in-memory routing, relative paths) that can be hosted as a single shareable web page.
 */
export default defineConfig(({ mode }) => {
  const staticPage = mode === 'preview-page';
  return {
  base: staticPage ? './' : '/',
  define: { 'import.meta.env.VITE_STATIC': JSON.stringify(staticPage ? '1' : '') },
  resolve: { alias: { '@content': r('../content'), '@engine': r('../engine'), ...(staticPage ? { 'virtual:pwa-register': r('./src/lib/pwa-stub.js') } : {}) } },
  server: { port: 5180, proxy: { '/api': 'http://localhost:4100' }, fs: { allow: ['..'] } },
  preview: { port: 5180, proxy: { '/api': 'http://localhost:4100' } },
  plugins: [
    react(),
    !staticPage && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'MoneyQuest',
        short_name: 'MoneyQuest',
        description: 'Build a town and learn how money works. No ads, no tracking, no real money.',
        theme_color: '#0072B2',
        background_color: '#FFF8EC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 900, outDir: staticPage ? 'dist-page' : 'dist' },
  };
});
