import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';
import useAuthRedirect from '@hooks/useAuthRedirect';
import { AuthInput } from './components/AuthInput';
import { useLoginForm } from './hooks/useLoginForm';

export default function Login() {
  const { t } = useTranslation('db');
  const isAutoLoginAttempted = useAuthRedirect();
  const { form, onSubmit, globalError, isLoading, socialLogin } = useLoginForm();

  if (!isAutoLoginAttempted) return null;

  return (
    <div className="flex justify-center items-center min-h-[100dvh] bg-body p-0 sm:p-5">
      <div className="bg-surface rounded-t-[24px] sm:rounded-2xl p-8 px-6 sm:p-10 w-full max-w-[450px] shadow-card border-t sm:border border-borderClient mt-auto sm:mt-0">
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
            <label className="flex items-center gap-2.5 text-textSecondary cursor-pointer py-2 group">
              <input 
                type="checkbox" 
                className="w-[18px] h-[18px] border border-borderClient rounded checked:bg-accent checked:border-accent" 
                {...form.register('rememberMe')} 
              />
              <span className="group-hover:text-textMain">{t('auth.login.remember_me')}</span>
            </label>
            <Link to="/forgot-password" className="text-accent font-semibold py-2 hover:underline">
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
            className="w-full p-4 bg-textMain text-surface rounded-md font-semibold tracking-widest uppercase hover:bg-accent disabled:opacity-70 flex justify-center"
          >
            {isLoading 
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" /> 
              : t('auth.login.submit')
            }
          </button>
        </form>
        
        <div className="flex items-center my-6 text-textSecondary text-[0.85rem] before:flex-1 before:h-px before:bg-borderClient after:flex-1 after:h-px after:bg-borderClient">
          <span className="px-4">{t('auth.common.or')}</span>
        </div>
        
        <button 
          type="button"
          onClick={() => socialLogin('google')} 
          disabled={isLoading} 
          className="w-full py-[0.85rem] border border-borderClient rounded-md font-semibold flex items-center justify-center gap-3 hover:border-accent"
        >
          <FaGoogle className="text-accent text-[1.1rem]" /> 
          {t('auth.login.social', { provider: 'Google' })}
        </button>
        
        <div className="text-center text-textSecondary text-[0.9rem] mt-4 pt-4">
          {t('auth.login.no_account')} 
          <Link to="/register" className="text-accent font-semibold hover:underline ml-1">
            {t('auth.login.register_link')}
          </Link>
        </div>
      </div>
    </div>
  );
}