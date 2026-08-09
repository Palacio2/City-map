import { z } from 'zod';

const LATIN_NAME_REGEX = /^[a-zA-Z\s-]+$/;

export const getProfileEditSchema = (t: (key: string) => string) => z.object({
  name: z.string()
    .min(1, t('profile.errors.name_required'))
    .max(30, t('profile.errors.name_long'))
    .regex(LATIN_NAME_REGEX, t('profile.errors.name_latin_only')),
  email: z.string()
    .min(1, t('profile.errors.email_required'))
    .email(t('profile.errors.email_invalid')),
  phone: z.string().optional()
});

export const getChangePasswordSchema = (t: (key: string) => string) => z.object({
  newPassword: z.string()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, t('auth.errors.password_weak')),
  confirmPassword: z.string().min(1, t('auth.errors.required'))
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: t('auth.errors.password_mismatch'),
  path: ["confirmPassword"]
});

export type ProfileEditFormValues = z.infer<ReturnType<typeof getProfileEditSchema>>;
export type ChangePasswordFormValues = z.infer<ReturnType<typeof getChangePasswordSchema>>;