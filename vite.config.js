import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@api': path.resolve(__dirname, './src/components/api'),
      '@layout': path.resolve(__dirname, './src/components/layout'),
      '@maps': path.resolve(__dirname, './src/components/districtMap'),
      '@header': path.resolve(__dirname, './src/components/header'),
      '@footer': path.resolve(__dirname, './src/components/footer'),
      '@auth': path.resolve(__dirname, './src/components/auth'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@supabaseClient': path.resolve(__dirname, './src/supabaseClient'),
      '@subscription': path.resolve(__dirname, './src/pages/subscription'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@cityCountrySelect': path.resolve(__dirname, './src/components/cityCountrySelect'),
      '@filtersPanel': path.resolve(__dirname, './src/components/filtersPanel'),
      '@modals': path.resolve(__dirname, './src/components/modals'),
      '@config': path.resolve(__dirname, './src/config'),


    }
  },
  build: {
    sourcemap: true, 
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
  },
})