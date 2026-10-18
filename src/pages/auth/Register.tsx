import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import useAuthRedirect from '@hooks/useAuthRedirect';
import { AuthInput } from './components/AuthInput';
import { AuthDivider } from './components/AuthDivider';
import { SocialLoginButton } from './components/SocialLoginButton';
import { useRegisterForm } from './hooks/useRegisterForm';
import { calculatePasswordStrength } from './utils';

export default function Register() {
  const { t } = useTranslation('db');
  const isAutoLoginAttempted = useAuthRedirect();
  const { form, onSubmit, globalError, isLoading, socialLogin } = useRegisterForm();

  const pass = form.watch('password', '');
  const strength = calculatePasswordStrength(pass);

  if (!isAutoLoginAttempted) return null;

  return (
    <div className="flex justify-center items-center min-h-[100dvh] bg-body p-4 sm:p-5">
      <div className="bg-surface rounded-3xl p-8 px-6 sm:p-12 w-full max-w-[480px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-borderClient animate-slideUp">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-textMain mb-2 font-heading">
            {t('auth.register.title')}
          </h1>
          <p className="text-textSecondary m-0">
            {t('auth.register.subtitle')}
          </p>
        </div>
        
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <AuthInput 
            label={t('auth.fields.name')} 
            icon={FaUser} 
            type="text" 
            blockType="name" 
            placeholder={t('auth.fields.name_placeholder')} 
            disabled={isLoading} 
            error={form.formState.errors.name?.message} 
            {...form.register('name')} 
          />
          <AuthInput 
            label={t('auth.fields.email')} 
            icon={FaEnvelope} 
            type="email" 
            blockType="auth" 
            placeholder={t('auth.fields.email_placeholder')} 
            disabled={isLoading} 
            error={form.formState.errors.email?.message} 
            {...form.register('email')} 
          />
          <div>
            <AuthInput 
              label={t('auth.fields.password')} 
              icon={FaLock} 
              type="password" 
              blockType="auth" 
              placeholder={t('auth.fields.password_min')} 
              disabled={isLoading} 
              error={form.formState.errors.password?.message} 
              {...form.register('password')} 
            />
            {pass && (
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4].map(l => (
                  <div 
                    key={l} 
                    className={`h-1.5 flex-1 rounded-full ${strength < l ? 'bg-borderClient' : strength < 2 ? 'bg-danger' : strength < 4 ? 'bg-warning' : 'bg-success'}`} 
                  />
                ))}
              </div>
            )}
          </div>
          <AuthInput 
            label={t('auth.fields.confirm_password')} 
            icon={FaLock} 
            type="password" 
            blockType="auth" 
            placeholder={t('auth.fields.confirm_placeholder')} 
            disabled={isLoading} 
            error={form.formState.errors.confirmPassword?.message} 
            {...form.register('confirmPassword')} 
          />
          
          {globalError && (
            <div className="text-danger text-center font-medium text-[0.9rem]">
              {globalError}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full mt-3 py-4 text-surface font-bold font-heading text-[14px] uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group bg-textMain hover:bg-accent hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:bg-textSecondary disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:transform-none"
          >
            {isLoading 
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" /> 
              : t('auth.register.submit')
            }
          </button>
        </form>
        
        <AuthDivider />
        
        <SocialLoginButton 
          provider="google"
          onClick={socialLogin}
          disabled={isLoading}
          text={t('auth.register.social', { provider: 'Google' })}
        />
        
        <div className="text-center text-textSecondary text-[0.95rem] mt-6 pt-4 border-t border-borderClient/50">
          {t('auth.register.has_account')} 
          <Link to="/login" className="text-accent font-bold hover:opacity-80 ml-2 transition-opacity">
            {t('auth.register.login_link')}
          </Link>
        </div>
      </div>
    </div>
  );
}