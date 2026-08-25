export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary, #c5a47e)',
          hover: 'var(--primary-hover, #d4b895)',
          subtle: 'var(--primary-subtle, rgba(197, 164, 126, 0.1))',
        },
        main: 'var(--bg-main)',
        surface: 'var(--bg-surface)',
        hover: 'var(--bg-hover)',
        border: 'var(--border)',
        textMain: 'var(--text-main)',
        textMuted: 'var(--text-muted)',
        danger: {
          DEFAULT: '#ef4444',
          subtle: 'rgba(239, 68, 68, 0.08)',
        },
        success: {
          DEFAULT: '#10b981',
          subtle: 'rgba(16, 185, 129, 0.08)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          subtle: 'rgba(245, 158, 11, 0.08)',
        },
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}