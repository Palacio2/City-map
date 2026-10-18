/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  return {
    plugins: [
      tailwindcss(),
      react(),
      tsconfigPaths()
    ],
    resolve: {
      alias: {
        // jsPDF's optional HTML renderer must share the modern capture implementation.
        'html2canvas': 'html2canvas-pro',
        '@supabaseClient': fileURLToPath(new URL('./src/supabaseClient.ts', import.meta.url)),
        '@api': fileURLToPath(new URL('./src/shared/api', import.meta.url)),
        '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
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
            'pdf-vendor': ['jspdf', 'html2canvas-pro'],
            'ui-vendor': ['react-icons'],
            'map-vendor': ['leaflet', 'react-leaflet', 'react-leaflet-cluster', '@turf/turf'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'sentry-vendor': ['@sentry/react']
          }
        }
      }
    },
    test: {
      // Use jsdom Storage, not Node's experimental file-backed global.
      execArgv: process.allowedNodeEnvironmentFlags.has('--no-experimental-webstorage')
        ? ['--no-experimental-webstorage'] : [],
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.js',
      include: ['src/**/*.test.{ts,tsx}']
    }
  };
});
