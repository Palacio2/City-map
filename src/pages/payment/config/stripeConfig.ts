import type { Appearance } from '@stripe/stripe-js';

export const stripeAppearanceConfig: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#c5a47e',
    colorBackground: '#111318',
    colorText: '#ffffff',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '12px',
    colorDanger: '#ef4444',
    spacingUnit: '4px'
  },
  rules: {
    '.Input': {
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'none',
    },
    '.Input:focus': {
      border: '1px solid #c5a47e',
    }
  }
};