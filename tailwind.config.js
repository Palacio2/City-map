/** @type {import('tailwindcss').Config} */
export default {
  // ЦЕЙ РЯДОК ВИПРАВЛЯЄ СИНХРОНІЗАЦІЮ ТЕМ ДЛЯ СКЛА:
  darkMode: ['class', '[data-theme="dark"]'], 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
        },
        danger: 'var(--danger-color, var(--danger))',
        success: 'var(--success-color, var(--success))',
        warning: 'var(--warning-color, var(--warning))',
        main: 'var(--bg-main)',
        surface: 'var(--bg-surface)',
        hover: 'var(--bg-hover)',
        textMain: 'var(--text-main)',
        textMuted: 'var(--text-muted)',
        border: 'var(--border)',
        
        body: 'var(--bg-body)',
        accent: {
          DEFAULT: 'var(--accent-color)',
          hover: 'var(--accent-hover)',
        },
        textSecondary: 'var(--text-secondary)',
        textInverse: 'var(--text-inverse)',
        glass: 'var(--glass-bg)',
        glassBorder: 'var(--glass-border)',
        borderClient: 'var(--border-color)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        glass: 'var(--shadow-glass)',
        modal: 'var(--shadow-modal)',
        hover: 'var(--shadow-hover)',
      },
      keyframes: {
        fadeInOverlay: {
          '0%': { opacity: '0', backdropFilter: 'blur(0px)' },
          '100%': { opacity: '1', backdropFilter: 'blur(8px)' },
        },
        slideUpModal: {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      animation: {
        fadeInOverlay: 'fadeInOverlay 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        slideUpModal: 'slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        slideUp: 'slideUp 0.5s ease-out forwards',
        popIn: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      }
    },
  },
  plugins: [],
}