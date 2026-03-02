const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[a-zA-Z\d\W_]{8,}$/;
const MIN_PASSWORD_LENGTH = 8;
const CYRILLIC_REGEX = /[\u0400-\u04FF]/;

const getAuthKey = (key) => key;

export const sanitizeEmail = (value) => {
  return value.replace(/[^a-zA-Z0-9@._\-+]/g, '');
};

export const sanitizePassword = (value) => {
  return value.replace(/[\u0400-\u04FF]/g, '');
};

export const sanitizeName = (value) => {
  return value.replace(/[^a-zA-Z\s'-]/g, '');
};

export const blockCyrillicInput = (e) => {
  const allowedKeys = [
    'Backspace', 'Tab', 'Enter', 'Delete', 
    'ArrowLeft', 'ArrowRight', 'Home', 'End',
    'Control', 'Meta', 'Alt', 'Shift', 'CapsLock', 'Escape'
  ];

  if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
    return;
  }

  if (/[а-яА-ЯіІїЇєЄґҐ]/.test(e.key)) {
    e.preventDefault();
  }
};

export const validateEmail = (email, t) => {
  if (!email) return t(getAuthKey('errors.required'));
  if (CYRILLIC_REGEX.test(email)) return t(getAuthKey('errors.password_latin_only'));
  if (!/\S+@\S+\.\S+/.test(email)) return t(getAuthKey('errors.email_invalid'));
  return '';
};

export const validatePassword = (password, t, isLogin = false) => {
  if (!password) return t(getAuthKey('errors.required'));
  
  if (!isLogin) {
    if (CYRILLIC_REGEX.test(password)) {
      return t(getAuthKey('errors.password_latin_only'));
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return t(getAuthKey('errors.password_short')); 
    }
    if (!PASSWORD_REGEX.test(password)) {
      return t(getAuthKey('errors.password_weak')); 
    }
  }
  return '';
};

export const validatePasswordChange = (oldPassword, newPassword, t) => {
  if (oldPassword && newPassword && oldPassword === newPassword) {
    return t(getAuthKey('errors.password_same_as_old'));
  }
  return '';
};

export const validateName = (name, t) => {
  if (!name) return t(getAuthKey('errors.required'));
  
  const trimmed = name.trim();
  if (trimmed.length < 2) return t(getAuthKey('errors.name_short'));
  if (trimmed.length > 50) return t(getAuthKey('errors.name_long'));
  
  return '';
};

export const validateConfirmPassword = (password, confirmPassword, t) => {
  if (!confirmPassword) return t(getAuthKey('errors.required'));
  if (password !== confirmPassword) return t(getAuthKey('errors.password_mismatch'));
  return '';
};

export const validateChangePasswordForm = (formData, t) => {
  const errors = {};
  
  const newPassError = validatePassword(formData.newPassword, t, false);
  if (newPassError) errors.newPassword = newPassError;

  const confirmError = validateConfirmPassword(formData.newPassword, formData.confirmPassword, t);
  if (confirmError) errors.confirmPassword = confirmError;

  if (formData.currentPassword) {
    const sameError = validatePasswordChange(formData.currentPassword, formData.newPassword, t);
    if (sameError) errors.newPassword = sameError;
  }

  if (Object.keys(errors).length > 0) return Object.values(errors)[0]; 
  
  return '';
};

export const validateLoginForm = (formData, t) => {
  const errors = {};
  const emailError = validateEmail(formData.email, t);
  const passwordError = validatePassword(formData.password, t, true);
  
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  
  return errors;
};

export const validateRegisterForm = (formData, t) => {
  const errors = {};
  
  const emailError = validateEmail(formData.email, t);
  if (emailError) errors.email = emailError;

  const nameError = validateName(formData.name, t);
  if (nameError) errors.name = nameError;

  const passError = validatePassword(formData.password, t, false);
  if (passError) errors.password = passError;

  const confirmError = validateConfirmPassword(formData.password, formData.confirmPassword, t);
  if (confirmError) errors.confirmPassword = confirmError;

  return errors;
};