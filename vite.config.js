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
  // --- ДОДАНО НАЛАШТУВАННЯ BUILD ---
  build: {
    // Збільшуємо ліміт попередження (щоб не сварився на 500кб, якщо трохи вилізе), 
    // але головна магія в rollupOptions
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        // Ця функція розкладає бібліотеки по окремих файлах
        manualChunks(id) {
          // 1. Окремий чанк для React та Router (вони потрібні завжди)
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          
          // 2. Окремий чанк для Supabase (він досить великий)
          if (id.includes('@supabase')) {
            return 'supabase-vendor';
          }

          // 3. Окремий чанк для іконок (React Icons часто займають багато місця)
          if (id.includes('react-icons')) {
            return 'icons-vendor';
          }

          // 4. Окремий чанк для перекладів
          if (id.includes('i18next')) {
            return 'i18n-vendor';
          }

          // 5. Все інше з node_modules йде в загальний vendor файл
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