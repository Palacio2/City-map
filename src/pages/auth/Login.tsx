import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import useAuthRedirect from '@hooks/useAuthRedirect';
import { AuthInput } from './components/AuthInput';
import { AuthDivider } from './components/AuthDivider';
import { SocialLoginButton } from './components/SocialLoginButton';
import { useLoginForm } from './hooks/useLoginForm';

export default function Login() {
  const { t } = useTranslation('db');
  const isAutoLoginAttempted = useAuthRedirect();
  const { form, onSubmit, globalError, isLoading, socialLogin } = useLoginForm();

  if (!isAutoLoginAttempted) return null;

  return (
    <div className="flex justify-center items-center min-h-[100dvh] bg-body p-4 sm:p-5">
      <div className="bg-surface rounded-3xl p-8 px-6 sm:p-12 w-full max-w-[480px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-borderClient animate-slideUp">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl font-bold text-textMain mb-2 font-heading">
            {t('auth.login.title')}
          </h1>
          <p className="text-textSecondary m-0">
            {t('auth.login.subtitle')}
          </p>
        </div>
        
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
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
          <AuthInput 
            label={t('auth.fields.password')} 
            icon={FaLock} 
            type="password" 
            blockType="auth" 
            placeholder={t('auth.fields.password_placeholder')} 
            disabled={isLoading} 
            error={form.formState.errors.password?.message} 
            {...form.register('password')} 
          />
          
          <div className="flex justify-between items-center text-[0.9rem] -mt-1">
            <label className="flex items-center gap-2.5 text-textSecondary cursor-pointer py-2 group transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 border-2 border-borderClient rounded-md checked:bg-accent checked:border-accent transition-colors cursor-pointer accent-accent" 
                {...form.register('rememberMe')} 
              />
              <span className="group-hover:text-textMain font-medium transition-colors">{t('auth.login.remember_me')}</span>
            </label>
            <Link to="/forgot-password" className="text-accent font-bold py-2 hover:opacity-80 transition-opacity">
              {t('auth.login.forgot_password')}
            </Link>
          </div>
          
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
              : t('auth.login.submit')
            }
          </button>
        </form>
        
        <AuthDivider />
        
        <SocialLoginButton 
          provider="google"
          onClick={socialLogin}
          disabled={isLoading}
          text={t('auth.login.social', { provider: 'Google' })}
        />
        
        <div className="text-center text-textSecondary text-[0.95rem] mt-6 pt-4 border-t border-borderClient/50">
          {t('auth.login.no_account')} 
          <Link to="/register" className="text-accent font-bold hover:opacity-80 ml-2 transition-opacity">
            {t('auth.login.register_link')}
          </Link>
        </div>
      </div>
    </div>
  );
}