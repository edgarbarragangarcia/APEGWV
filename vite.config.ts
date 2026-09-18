import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon-32.png'],
      manifest: {
        id: '/',
        name: 'APEG Golf',
        short_name: 'APEG',
        description: 'Asociación Panameña de Empresarias del Golf',
        lang: 'es',
        theme_color: '#0e2f1f',
        background_color: '#0e2f1f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Solo cachea el shell de la app (JS/CSS/imágenes propias); las llamadas
        // a Supabase (auth, datos, pagos) nunca pasan por el service worker.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        navigateFallbackDenylist: [/^\/supabase-proxy/],
      },
    }),
  ],
  server: {
    port: 5180,
    strictPort: true,
    host: true, // Permite acceso desde el móvil
    proxy: {
      '/supabase-proxy': {
        target: 'https://drqyvhwgnuvrcmwthwwn.supabase.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/supabase-proxy/, ''),
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
        },
      }
    }
  },
})
