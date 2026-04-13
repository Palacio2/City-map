import { z } from 'zod';
import { KeyboardEvent } from 'react';

const ALLOWED_KEYS = ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Control', 'Meta', 'Alt', 'Shift', 'CapsLock', 'Escape'];

export const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, allowSpace: boolean = false): void => {
  if (ALLOWED_KEYS.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
  const isValid = allowSpace ? /^[a-zA-Z\- ]$/.test(e.key) : /^[\x21-\x7E]$/.test(e.key);
  if (e.key.length === 1 && !isValid) e.preventDefault();
};

export const sanitizeInput = (value: string, allowSpace: boolean = false): string => {
  return allowSpace ? value.replace(/[^a-zA-Z \-]/g, '').replace(/ {2,}/g, ' ').replace(/^ /, '') : value.replace(/[^\x21-\x7E]/g, '');
};

const baseAuthSchema = (t: (k: string) => string) => ({
  email: z.string().min(1, t('auth.errors.required')).email(t('auth.errors.email_invalid')),
  password: z.string().min(1, t('auth.errors.required'))
});

export const getLoginSchema = (t: (k: string) => string) => z.object({
  ...baseAuthSchema(t),
  rememberMe: z.boolean().optional(),
});

export const getRegisterSchema = (t: (k: string) => string) => z.object({
  name: z.string()
    .min(2, t('auth.errors.name_short'))
    .max(50, t('auth.errors.name_long'))
    .regex(/^[a-zA-Z \-]+$/, t('auth.errors.name_invalid_chars')),
  ...baseAuthSchema(t),
  password: z.string()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, t('auth.errors.password_weak')),
  confirmPassword: z.string().min(1, t('auth.errors.required'))
}).refine((d) => d.password === d.confirmPassword, { 
  message: t('auth.errors.password_mismatch'), 
  path: ["confirmPassword"] 
});

export const getForgotPasswordSchema = (t: (k: string) => string) => z.object({ 
  email: baseAuthSchema(t).email 
});

// ДОДАНО: Схема для зміни пароля в профілі
export const getChangePasswordSchema = (t: (k: string) => string) => z.object({
  newPassword: z.string()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, t('auth.errors.password_weak')),
  confirmPassword: z.string().min(1, t('auth.errors.required'))
}).refine((d) => d.newPassword === d.confirmPassword, { 
  message: t('auth.errors.password_mismatch'), 
  path: ["confirmPassword"] 
});

// ДОДАНО: Функція валідації для сторінки зміни пароля
export const validateChangePasswordForm = (data: { newPassword?: string; confirmPassword?: string }, t: (k: string) => string): string | null => {
  const schema = getChangePasswordSchema(t);
  const result = schema.safeParse(data);
  
  if (!result.success) {
    // Замінили .errors на .issues
    return result.error.issues[0].message;
  }
  return null;
};

export type LoginFormValues = z.infer<ReturnType<typeof getLoginSchema>>;
export type RegisterFormValues = z.infer<ReturnType<typeof getRegisterSchema>>;
export type ForgotPasswordFormValues = z.infer<ReturnType<typeof getForgotPasswordSchema>>;
export type ChangePasswordFormValues = z.infer<ReturnType<typeof getChangePasswordSchema>>;