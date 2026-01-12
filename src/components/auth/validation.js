export const validateEmail = (email, t) => {
  if (!email) return t('errors.required');
  if (!/\S+@\S+\.\S+/.test(email)) return t('errors.email_invalid');
  return '';
};

export const validatePassword = (password, t, isLogin = false) => {
  if (!password) return t('errors.required');
  if (!isLogin && password.length < 6) return t('errors.password_short');
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