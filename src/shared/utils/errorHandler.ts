import type { TFunction } from 'i18next';

export const mapSupabaseError = (error: unknown, t: TFunction): string => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('jwt')) return t('profile.errors.auth_error');
    if (msg.includes('fetch') || msg.includes('network')) return t('profile.errors.network_error');
    if (msg.includes('already registered')) return t('profile.errors.email_taken');
    if (msg.includes('rate limit') || msg.includes('429')) return t('profile.errors.too_many_requests');
    if (msg.includes('invalid') && msg.includes('email')) return t('profile.errors.email_invalid_format');
    if (msg.includes('different from the old password') || msg.includes('same as the old password')) {
      return t('profile.errors.password_same_as_old');
    }
    
    return error.message;
  }
  
  return t('profile.errors.unknown_error');
};