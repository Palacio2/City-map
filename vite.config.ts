import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  return {
    plugins: [
      react(),
      tsconfigPaths()
    ],
    resolve: {
      alias: {
        '@supabaseClient': fileURLToPath(new URL('./src/supabaseClient.ts', import.meta.url)),
        '@api': fileURLToPath(new URL('./src/shared/api', import.meta.url)),
        '@shared': fileURLToPath(new URL('./src/shared', import.meta.url))
      }
    },
    server: {
      proxy: {
        '/geo': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/geo/, '/api/geo')
        }
      }
    },
    build: {
      sourcemap: isDev,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
            'pdf-vendor': ['jspdf', 'html2canvas'],
            'ui-vendor': ['react-icons'],
            'map-vendor': ['leaflet', 'react-leaflet', 'react-leaflet-cluster', '@turf/turf'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'sentry-vendor': ['@sentry/react']
          }
        }
      }
    }
  };
});