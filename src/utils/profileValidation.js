import { validatePhoneNumber } from './phoneUtils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Дозволяємо тільки латинські літери (a-z, A-Z), пробіли та дефіси
const LATIN_NAME_REGEX = /^[a-zA-Z\s-]+$/;

export const validateProfileForm = (state, t) => {
  const { name, email, phone, countryCode } = state;

  // 1. Валідація імені
  if (!name.trim()) {
    return { type: 'error', text: t('edit_page.errors.name_required') };
  }
  if (name.trim().length > 30) {
    return { type: 'error', text: t('edit_page.errors.name_long') };
  }
  // Ця перевірка тепер блокує кирилицю, цифри та спецсимволи (наприклад @)
  if (!LATIN_NAME_REGEX.test(name.trim())) {
    return { type: 'error', text: t('edit_page.errors.name_latin_only') };
  }

  // 2. Валідація Email
  if (!email.trim()) {
    return { type: 'error', text: t('edit_page.errors.email_required') };
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return { type: 'error', text: t('edit_page.errors.email_invalid') };
  }

  // 3. Валідація телефону
  if (phone.trim()) {
    const phoneError = validatePhoneNumber(countryCode, phone, t);
    if (phoneError) {
      return { type: 'error', text: phoneError };
    }
  }

  return null;
};