export const validateEmail = (email) => {
  if (!email) return 'Email обов\'язковий';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Невірний формат email';
  return '';
};

export const validatePassword = (password, isLogin = false) => {
  if (!password) return 'Пароль обов\'язковий';
  if (!isLogin && password.length < 6) return 'Пароль має містити принаймні 6 символів';
  return '';
};

export const validateName = (name) => {
  if (!name) return "Ім'я обов'язкове";
  if (name.length < 2) return "Ім'я має містити принаймні 2 символи";
  if (name.length > 50) return "Ім'я занадто довге";
  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Підтвердження пароля обов\'язкове';
  if (password !== confirmPassword) return 'Паролі не співпадають';
  return '';
};

export const validateLoginForm = (formData) => {
  const errors = {};
  const emailError = validateEmail(formData.email);
  const passwordError = validatePassword(formData.password, true);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
};

export const validateRegisterForm = (formData) => {
  const errors = {};
  const validations = [
    { field: 'name', validator: validateName },
    { field: 'email', validator: validateEmail },
    { field: 'password', validator: (val) => validatePassword(val, false) },
    { field: 'confirmPassword', validator: (val) => validateConfirmPassword(formData.password, val) }
  ];

  validations.forEach(({ field, validator }) => {
    const error = validator(formData[field]);
    if (error) errors[field] = error;
  });

  return errors;
};