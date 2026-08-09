import type { KeyboardEvent } from 'react';

const ALLOWED_KEYS = ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Control', 'Meta', 'Alt', 'Shift', 'CapsLock', 'Escape'];

export const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, allowSpace: boolean = false): void => {
  if (ALLOWED_KEYS.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
  const isValid = allowSpace ? /^[a-zA-Z\- ]$/.test(e.key) : /^[\x21-\x7E]$/.test(e.key);
  if (e.key.length === 1 && !isValid) e.preventDefault();
};

export const sanitizeInput = (value: string, allowSpace: boolean = false): string => {
  return allowSpace ? value.replace(/[^a-zA-Z \-]/g, '').replace(/ {2,}/g, ' ').replace(/^ /, '') : value.replace(/[^\x21-\x7E]/g, '');
};

export const calculatePasswordStrength = (pass: string): number => {
  if (!pass) return 0;
  return (pass.length > 7 ? 1 : 0) + (/[A-Z]/.test(pass) ? 1 : 0) + (/\d/.test(pass) ? 1 : 0) + (/[^A-Za-z0-9]/.test(pass) ? 1 : 0);
};