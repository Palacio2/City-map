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
    }
  },
  build: {
    // 🔥 ВАЖЛИВО: Вмикаємо карти коду для дебагу на продакшені
    sourcemap: true, 
    
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          if (id.includes('@supabase')) {
            return 'supabase-vendor';
          }
          if (id.includes('react-icons')) {
            return 'icons-vendor';
          }
          if (id.includes('i18next')) {
            return 'i18n-vendor';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
  },
})