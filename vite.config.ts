import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base so the same build works at any GitHub Pages path (hash routing, no server routes).
export default defineConfig({
  base: './',
  build: {
    target: 'es2017',
    assetsInlineLimit: 0,
    sourcemap: false,
    rollupOptions: {
      input: { main: 'index.html' },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'MIA: Animal Express',
        short_name: 'MIA',
        description: 'Tiny animal games for children. Works offline. Nothing leaves your device.',
        start_url: './',
        scope: './',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#1d2b53',
        theme_color: '#1d2b53',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,json,webm,svg,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
});
