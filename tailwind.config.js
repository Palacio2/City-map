/** @type {import('tailwindcss').Config} */
export default {
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
        danger: 'var(--danger)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        main: 'var(--bg-main)',
        surface: 'var(--bg-surface)',
        hover: 'var(--bg-hover)',
        textMain: 'var(--text-main)',
        textMuted: 'var(--text-muted)',
        border: 'var(--border)',
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
          '0%': { opacity: '0', transform: 'translateY(30px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        }
      },
      animation: {
        fadeInOverlay: 'fadeInOverlay 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        slideUpModal: 'slideUpModal 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        slideUp: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}