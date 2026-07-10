import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/anchor/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Anchor',
        short_name: 'Anchor',
        description:
          'A private, offline-first planning app for organizing goals, routines, money, health, and life progress.',
        theme_color: '#faf8f2',
        background_color: '#faf8f2',
        display: 'standalone',
        start_url: '/anchor/',
        scope: '/anchor/',
        icons: [
          {
            src: '/anchor/pwa-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/anchor/pwa-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
