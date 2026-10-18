export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          subtle: 'var(--primary-subtle)',
        },
        accent: {
          DEFAULT: 'var(--accent-color)',
          hover: 'var(--accent-hover)',
        },
        body: 'var(--bg-body)',
        main: 'var(--bg-main)',
        surface: 'var(--bg-surface)',
        hover: 'var(--bg-hover)',
        bgFooter: 'var(--bg-footer)',
        border: 'var(--border)',
        borderClient: 'var(--border-color)',
        borderAccent: 'var(--border-accent)',
        textMain: 'var(--text-main)',
        textMuted: 'var(--text-muted)',
        textSecondary: 'var(--text-secondary)',
        textInverse: 'var(--text-inverse)',
        danger: {
          DEFAULT: 'var(--danger)',
          subtle: 'rgba(239, 68, 68, 0.08)',
        },
        success: {
          DEFAULT: 'var(--success)',
          subtle: 'rgba(16, 185, 129, 0.08)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
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
