import { z } from 'zod';
import type { AuthContextType } from '../types';

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

export const AuthContextSchema = z.custom<AuthContextType>(
  (val) => val !== null && typeof val === 'object',
  "useAuth must be used within an AuthProvider"
);

export type LoginFormValues = z.infer<ReturnType<typeof getLoginSchema>>;
export type RegisterFormValues = z.infer<ReturnType<typeof getRegisterSchema>>;
export type ForgotPasswordFormValues = z.infer<ReturnType<typeof getForgotPasswordSchema>>;