const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const MIN_PASSWORD_LENGTH = 8;

export const validateEmail = (email, t) => {
  if (!email) return t('errors.required');
  if (!/\S+@\S+\.\S+/.test(email)) return t('errors.email_invalid');
  return '';
};

export const validatePassword = (password, t, isLogin = false) => {
  if (!password) return t('errors.required');
  
  if (!isLogin) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return t('errors.password_short', { count: MIN_PASSWORD_LENGTH }); 
    }
    if (!PASSWORD_REGEX.test(password)) {
      return t('password_page.errors.regex') || t('errors.password_weak'); 
    }
  }
  return '';
};

export const validateName = (name, t) => {
  if (!name) return t('errors.required');
  if (name.length < 2) return t('errors.name_short');
  if (name.length > 50) return t('errors.name_long');
  return '';
};

export const validateConfirmPassword = (password, confirmPassword, t) => {
  if (!confirmPassword) return t('errors.required');
  if (password !== confirmPassword) return t('errors.password_mismatch');
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