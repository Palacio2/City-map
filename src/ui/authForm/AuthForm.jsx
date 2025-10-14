import React from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaGithub } from 'react-icons/fa';
import styles from './AuthForm.module.css';

const FORM_CONFIG = {
  login: {
    title: 'Вхід в аккаунт',
    subtitle: 'Ласкаво просимо назад!',
    submitText: 'Увійти',
    loadingText: 'Вхід...'
  },
  register: {
    title: 'Створення аккаунту',
    subtitle: 'Приєднуйтесь до нашої спільноти',
    submitText: 'Створити аккаунт',
    loadingText: 'Створення...'
  }
};

const SOCIAL_PROVIDERS = [
  { key: 'google', icon: FaGoogle, label: 'Google' },
  { key: 'github', icon: FaGithub, label: 'GitHub' }
];

export default function AuthForm({
  mode = 'login',
  formData,
  errors,
  isLoading,
  passwordVisibility = {},
  onChange,
  onSubmit,
  onTogglePassword,
  onSwitchMode,
  onSocialLogin
}) {
  const isLogin = mode === 'login';
  const config = FORM_CONFIG[mode];

  const renderField = (field) => {
    const { type = 'text', name, icon: Icon, placeholder, isPassword } = field;
    const showPassword = passwordVisibility[name];
    
    return (
      <div className={styles.formGroup} key={name}>
        <label htmlFor={name} className={styles.label}>
          <Icon className={styles.icon} />
          {field.label}
        </label>
        
        {isPassword ? (
          <div className={styles.passwordInput}>
            <input
              type={showPassword ? 'text' : 'password'}
              id={name}
              name={name}
              value={formData[name] || ''}
              onChange={onChange}
              className={`${styles.input} ${errors[name] ? styles.inputError : ''}`}
              placeholder={placeholder}
              disabled={isLoading}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => onTogglePassword(name)}
              disabled={isLoading}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={formData[name] || ''}
            onChange={onChange}
            className={`${styles.input} ${errors[name] ? styles.inputError : ''}`}
            placeholder={placeholder}
            disabled={isLoading}
          />
        )}
        
        {errors[name] && <span className={styles.error}>{errors[name]}</span>}
      </div>
    );
  };

  const fields = [
    !isLogin && {
      name: 'name',
      icon: FaUser,
      label: "Ім'я",
      placeholder: "Ваше ім'я"
    },
    {
      name: 'email',
      type: 'email',
      icon: FaEnvelope,
      label: 'Email',
      placeholder: 'Ваш email'
    },
    {
      name: 'password',
      icon: FaLock,
      label: 'Пароль',
      placeholder: isLogin ? 'Ваш пароль' : 'Створіть пароль',
      isPassword: true
    },
    !isLogin && {
      name: 'confirmPassword',
      icon: FaLock,
      label: 'Підтвердження пароля',
      placeholder: 'Підтвердіть пароль',
      isPassword: true
    }
  ].filter(Boolean);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{config.title}</h1>
          <p className={styles.subtitle}>{config.subtitle}</p>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          {fields.map(renderField)}

          {isLogin && (
            <div className={styles.rememberForgot}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  name="rememberMe"
                  checked={formData.rememberMe || false}
                  onChange={onChange}
                  disabled={isLoading}
                />
                <span>Запам'ятати мене</span>
              </label>
              <Link to="/forgot-password" className={styles.forgotLink}>
                Забули пароль?
              </Link>
            </div>
          )}

          {!isLogin && (
            <div className={styles.terms}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  name="termsAccepted"
                  checked={formData.termsAccepted || false}
                  onChange={onChange}
                  required 
                  disabled={isLoading}
                />
                <span>Я погоджуюсь з <Link to="/terms" className={styles.termsLink}>умовами використання</Link></span>
              </label>
            </div>
          )}

          {errors.submit && <span className={styles.errorSubmit}>{errors.submit}</span>}

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                {config.loadingText}
              </>
            ) : (
              config.submitText
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span>або</span>
        </div>

        <div className={styles.socialButtons}>
          {SOCIAL_PROVIDERS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              className={styles[`${key}Button`]}
              onClick={() => onSocialLogin(key)}
              disabled={isLoading}
            >
              <Icon className={styles.socialIcon} />
              {isLogin ? `Увійти з ${label}` : `Зареєструватися з ${label}`}
            </button>
          ))}
        </div>

        <div className={styles.footer}>
          <p>
            {isLogin ? 'Ще не маєте аккаунту?' : 'Вже маєте аккаунт?'}{' '}
            <button type="button" onClick={onSwitchMode} className={styles.link}>
              {isLogin ? 'Зареєструватися' : 'Увійти'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}