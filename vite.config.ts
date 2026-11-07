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
      input: { main: 'index.html', sort: 'sort.html' }, // sort = the classic sorting game
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: {
        name: 'MIA Toy Box',
        short_name: 'MIA',
        description: 'Little games and collectible friend cards for children. Works offline. Nothing leaves your device.',
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
        // every page is precached, so each loads its own entry offline: index.html (MIA), sort.html (classic sorting game)
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/sort\.html/], // otherwise the installed app would serve the main page instead of these
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
});
