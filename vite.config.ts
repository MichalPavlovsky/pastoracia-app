/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Na GitHub Pages beží aplikácia v podpriečinku /pastoracia-app/
const base = process.env.GITHUB_PAGES ? '/pastoracia-app/' : '/'

export default defineConfig({
  base,
  // port musí sedieť s redirect URI v Azure (http://localhost:5174/); 5173 používa aplikácia Prípravy
  server: { port: 5174, strictPort: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Pastorácia',
        short_name: 'Pastorácia',
        lang: 'sk',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#7a1f2b',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Android: zdieľanie odkazu do aplikácie. iPhone: rovnakú adresu otvorí Skratka.
        share_target: {
          action: `${base}#/farsky-list/temy/pridat`,
          method: 'GET',
          params: { title: 'title', text: 'text', url: 'url' },
        },
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
