const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LATIN_NAME_REGEX = /^[a-zA-Z\s-]+$/;

export const validateProfileForm = (state, t) => {
  const { name, email } = state;

  if (!name.trim()) {
    return { type: 'error', text: t('profile.errors.name_required') };
  }
  if (name.trim().length > 30) {
    return { type: 'error', text: t('profile.errors.name_long') };
  }
  if (!LATIN_NAME_REGEX.test(name.trim())) {
    return { type: 'error', text: t('profile.errors.name_latin_only') };
  }

  if (!email.trim()) {
    return { type: 'error', text: t('profile.errors.email_required') };
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return { type: 'error', text: t('profile.errors.email_invalid') };
  }

  return null;
};