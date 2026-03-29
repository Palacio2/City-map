import React, { useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';
import { blockCyrillicInput } from '@auth/validation';

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
  const { t } = useTranslation('db'); // Змінено на 'db'
  const isLogin = mode === 'login';

  const config = useMemo(() => ({
    title: isLogin ? t('auth.login.title') : t('auth.register.title'),
    subtitle: isLogin ? t('auth.login.subtitle') : t('auth.register.subtitle'),
    submitText: isLogin ? t('auth.login.submit') : t('auth.register.submit'),
    loadingText: isLogin ? t('auth.login.loading') : t('auth.register.loading')
  }), [isLogin, t]);

  const fields = useMemo(() => [
    !isLogin && { 
      name: 'name', 
      label: t('auth.fields.name'), 
      type: 'text', 
      icon: FaUser, 
      placeholder: t('auth.fields.name_placeholder') 
    },
    { 
      name: 'email', 
      label: t('auth.fields.email'), 
      type: 'text',
      inputMode: 'email',
      icon: FaEnvelope, 
      placeholder: t('auth.fields.email_placeholder') 
    },
    { 
      name: 'password', 
      label: t('auth.fields.password'), 
      type: 'password', 
      icon: FaLock, 
      placeholder: isLogin ? t('auth.fields.password_placeholder') : t('auth.fields.password_min') 
    },
    !isLogin && { 
      name: 'confirmPassword', 
      label: t('auth.fields.confirm_password'), 
      type: 'password', 
      icon: FaLock, 
      placeholder: t('auth.fields.confirm_placeholder') 
    }
  ].filter(Boolean), [isLogin, t]);

  return (
    <div className="flex justify-center items-center min-h-[100dvh] bg-body p-0 sm:p-5">
      <div className="bg-surface rounded-t-[24px] sm:rounded-2xl p-8 px-6 sm:p-10 w-full max-w-full sm:max-w-[450px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:shadow-card border-t sm:border border-borderClient transition-transform duration-300 flex flex-col mt-auto sm:mt-0">
        
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-[1.75rem] sm:text-3xl font-bold text-textMain mb-2 font-heading">{config.title}</h1>
          <p className="text-base text-textSecondary m-0">{config.subtitle}</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {fields.map((field) => {
            const { name, label, type, inputMode, placeholder, icon: Icon } = field;
            const isPasswordType = name.includes('password');
            const showPassword = passwordVisibility[name];
            
            return (
              <div className="flex flex-col" key={name}>
                <label htmlFor={name} className="flex items-center gap-2 font-semibold text-textMain mb-2 text-[0.9rem]">
                  <Icon className="text-accent text-base" /> {label}
                </label>
                
                <div className="relative w-full">
                  <input
                    type={isPasswordType && showPassword ? 'text' : type}
                    inputMode={inputMode}
                    id={name}
                    name={name}
                    value={formData[name] || ''}
                    onChange={onChange}
                    onKeyDown={(e) => { if (name === 'email') blockCyrillicInput(e); }}
                    className={`w-full py-[0.85rem] px-4 border border-borderClient rounded-md text-[16px] sm:text-base bg-body text-textMain transition-all font-body focus:border-accent focus:shadow-[0_0_0_3px_rgba(197,164,126,0.15)] focus:outline-none ${errors[name] ? '!border-danger !shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : ''}`}
                    placeholder={placeholder}
                    disabled={isLoading}
                    autoComplete={isPasswordType ? (isLogin ? "current-password" : "new-password") : "email"}
                  />
                  
                  {isPasswordType && (
                    <button
                      type="button"
                      className="absolute right-0 top-0 h-full w-10 bg-transparent border-none text-textSecondary cursor-pointer p-0 flex items-center justify-center transition-colors hover:text-textMain"
                      onClick={() => onTogglePassword(name)}
                      tabIndex="-1"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  )}
                </div>
                {errors[name] && <span className="text-danger text-[0.85rem] mt-1.5">{errors[name]}</span>}
              </div>
            );
          })}

          {isLogin && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[0.9rem] -mt-1 gap-4 sm:gap-0">
              <label className="flex items-center gap-2.5 text-textSecondary cursor-pointer select-none py-2 group">
                <input 
                  type="checkbox" 
                  name="rememberMe" 
                  checked={formData.rememberMe || false}
                  onChange={onChange}
                  className="w-[18px] h-[18px] border border-borderClient rounded bg-body appearance-none cursor-pointer relative transition-colors checked:bg-accent checked:border-accent checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[12px] checked:after:font-bold checked:after:left-1/2 checked:after:top-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2"
                />
                <span className="group-hover:text-textMain transition-colors">{t('auth.login.remember_me')}</span>
              </label>
              <Link to="/forgot-password" className="text-accent font-semibold transition-colors py-2 hover:text-accent-hover">{t('auth.login.forgot_pass')}</Link>
            </div>
          )}

          {errors.submit && <div className="text-danger text-center font-medium my-[-0.25rem] text-[0.9rem]">{errors.submit}</div>}

          <button type="submit" className="w-full p-4 bg-textMain text-surface border border-textMain rounded-md text-base font-semibold cursor-pointer transition-all flex items-center justify-center uppercase tracking-widest font-heading min-h-[50px] shadow-sm hover:not(:disabled):bg-accent hover:not(:disabled):border-accent hover:not(:disabled):text-white hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-md disabled:opacity-70 disabled:cursor-not-allowed" disabled={isLoading}>
            {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : config.submitText}
          </button>
        </form>

        <div className="flex items-center my-6 text-textSecondary text-[0.85rem] before:content-[''] before:flex-1 before:h-px before:bg-borderClient after:content-[''] after:flex-1 after:h-px after:bg-borderClient">
          <span className="px-4">{t('auth.login.or')}</span>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {SOCIAL_PROVIDERS.map((provider) => {
            const { key, icon: Icon, label } = provider;
            return (
              <button
                key={key}
                type="button"
                className="w-full py-[0.85rem] border border-borderClient rounded-md bg-surface text-textMain font-semibold cursor-pointer transition-all flex items-center justify-center gap-3 font-body min-h-[50px] shadow-sm hover:not(:disabled):border-accent hover:not(:disabled):bg-hover"
                onClick={() => onSocialLogin(key)}
                disabled={isLoading}
              >
                <Icon className="text-accent text-[1.1rem]" />
                {isLogin ? t('auth.login.social', { provider: label }) : t('auth.register.social', { provider: label })}
              </button>
            );
          })}
        </div>

        <div className="text-center text-textSecondary text-[0.9rem] mt-auto sm:mt-0 pt-4 sm:pt-0">
          <p className="m-0">
            {isLogin ? t('auth.login.no_account') : t('auth.register.has_account')}{' '}
            <button onClick={onSwitchMode} className="text-accent bg-transparent border-none font-semibold cursor-pointer p-2 ml-0.5 transition-colors hover:text-accent-hover hover:underline" type="button">
              {isLogin ? t('auth.login.register_link') : t('auth.register.login_link')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
});

export default AuthForm;