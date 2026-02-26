import React, { useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';
import { blockCyrillicInput } from '@auth/validation';
import styles from './AuthForm.module.css';

const SOCIAL_PROVIDERS = [
  { key: 'google', icon: FaGoogle, label: 'Google' }
];

const AuthForm = memo(({
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
}) => {
  const { t } = useTranslation('auth');
  const isLogin = mode === 'login';

  const config = useMemo(() => ({
    title: isLogin ? t('login.title') : t('register.title'),
    subtitle: isLogin ? t('login.subtitle') : t('register.subtitle'),
    submitText: isLogin ? t('login.submit') : t('register.submit'),
    loadingText: isLogin ? t('login.loading') : t('register.loading')
  }), [isLogin, t]);

  const fields = useMemo(() => [
    !isLogin && { 
      name: 'name', 
      label: t('fields.name'), 
      type: 'text', 
      icon: FaUser, 
      placeholder: t('fields.name_placeholder') 
    },
    { 
      name: 'email', 
      label: t('fields.email'), 
      type: 'text',
      inputMode: 'email',
      icon: FaEnvelope, 
      placeholder: t('fields.email_placeholder') 
    },
    { 
      name: 'password', 
      label: t('fields.password'), 
      type: 'password', 
      icon: FaLock, 
      placeholder: isLogin ? t('fields.password_placeholder') : t('fields.password_min') 
    },
    !isLogin && { 
      name: 'confirmPassword', 
      label: t('fields.confirm_password'), 
      type: 'password', 
      icon: FaLock, 
      placeholder: t('fields.confirm_placeholder') 
    }
  ].filter(Boolean), [isLogin, t]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{config.title}</h1>
          <p className={styles.subtitle}>{config.subtitle}</p>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          {fields.map((field) => {
            const { name, label, type, inputMode, placeholder, icon: Icon } = field;
            const isPasswordType = name.includes('password');
            const showPassword = passwordVisibility[name];
            
            return (
              <div className={styles.formGroup} key={name}>
                <label htmlFor={name} className={styles.label}>
                  <Icon className={styles.icon} /> {label}
                </label>
                
                <div className={styles.passwordInput}>
                  <input
                    type={isPasswordType && showPassword ? 'text' : type}
                    inputMode={inputMode}
                    id={name}
                    name={name}
                    value={formData[name] || ''}
                    onChange={onChange}
                    onKeyDown={(e) => {
                      if (name === 'email') blockCyrillicInput(e);
                    }}
                    className={`${styles.input} ${errors[name] ? styles.inputError : ''}`}
                    placeholder={placeholder}
                    disabled={isLoading}
                    autoComplete={isPasswordType ? "current-password" : "email"}
                  />
                  
                  {isPasswordType && (
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => onTogglePassword(name)}
                      tabIndex="-1"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  )}
                </div>
                {errors[name] && <span className={styles.error}>{errors[name]}</span>}
              </div>
            );
          })}

          {isLogin && (
            <div className={styles.rememberForgot}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  name="rememberMe" 
                  checked={formData.rememberMe || false}
                  onChange={onChange}
                />
                <span>{t('login.remember_me')}</span>
              </label>
              <Link to="/forgot-password" className={styles.forgotLink}>{t('login.forgot_pass')}</Link>
            </div>
          )}

          {errors.submit && <div className={styles.errorSubmit}>{errors.submit}</div>}

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? <span className={styles.spinner}></span> : config.submitText}
          </button>
        </form>

        <div className={styles.divider}><span>{t('login.or')}</span></div>

        <div className={styles.socialButtons}>
          {SOCIAL_PROVIDERS.map((provider) => {
            const { key, icon: Icon, label } = provider;
            return (
              <button
                key={key}
                type="button"
                className={styles[`${key}Button`]}
                onClick={() => onSocialLogin(key)}
                disabled={isLoading}
              >
                <Icon className={styles.socialIcon} />
                {isLogin 
                  ? t('login.social', { provider: label }) 
                  : t('register.social', { provider: label })}
              </button>
            );
          })}
        </div>

        <div className={styles.footer}>
          <p>
            {isLogin ? t('login.no_account') : t('register.has_account')}{' '}
            <button onClick={onSwitchMode} className={styles.link} type="button">
              {isLogin ? t('login.register_link') : t('register.login_link')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
});

export default AuthForm;