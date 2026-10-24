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
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Pastorácia',
        short_name: 'Pastorácia',
        lang: 'sk',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#7a1f2b',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
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
