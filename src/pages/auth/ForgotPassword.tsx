import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { AuthInput } from './components/AuthInput';
import { useForgotPasswordForm } from './hooks/useForgotPasswordForm';

export default function ForgotPassword() {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const { form, onSubmit, globalError, isSubmitted, setIsSubmitted, isLoading } = useForgotPasswordForm();

  const handleBack = () => navigate(-1);

  if (isSubmitted) {
    return (
      <div className="flex justify-center items-center min-h-[100dvh] bg-body p-4 sm:p-5">
        <div className="bg-surface rounded-3xl p-8 px-6 sm:p-12 w-full max-w-[480px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-borderClient transition-all duration-300 flex flex-col items-center animate-slideUp">
          <div className="text-center py-4 flex flex-col items-center w-full">
            <FaCheckCircle className="w-20 h-20 text-[var(--success-color,#10b981)] mb-8" />
            <h1 className="text-[1.75rem] font-bold text-textMain m-0 font-heading leading-tight mb-3">
              {t('auth.forgot_password.success_title')}
            </h1>
            <p className="text-[0.95rem] text-textSecondary m-0 leading-relaxed max-w-[300px]">
              {t('auth.forgot_password.success_text')}
            </p>
            <div className="bg-body p-4 rounded-xl my-8 w-full font-bold text-textMain border border-borderClient break-all text-center">
              {form.getValues('email')}
            </div>
            <div className="w-full flex flex-col gap-6">
              <button 
                type="button"
                onClick={handleBack} 
                className="w-full py-4 bg-textMain text-surface rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-accent hover:shadow-lg hover:-translate-y-0.5 transition-all text-[14px] uppercase tracking-widest font-heading"
              >
                <FaArrowLeft /> {t('auth.forgot_password.back')}
              </button>
              <p className="text-textSecondary text-[0.9rem] m-0 border-t border-borderClient/50 pt-6">
                {t('auth.forgot_password.spam_note')} <span className="mx-2 opacity-50">|</span>
                <button 
                  type="button"
                  onClick={() => setIsSubmitted(false)} 
                  className="text-accent bg-transparent border-none font-bold cursor-pointer p-0 transition-colors hover:opacity-80 ml-1"
                >
                  {t('auth.forgot_password.resend')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[100dvh] bg-body p-4 sm:p-5">
      <div className="bg-surface rounded-3xl p-8 px-6 sm:p-12 w-full max-w-[480px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-borderClient transition-all duration-300 flex flex-col animate-slideUp">
        <div className="grid grid-cols-[40px_1fr_40px] items-center mb-10 gap-2">
          <button 
            type="button"
            onClick={handleBack} 
            className="bg-body border border-borderClient text-textSecondary cursor-pointer w-11 h-11 p-0 rounded-full flex items-center justify-center transition-all hover:text-textMain hover:border-accent hover:shadow-md"
          >
            <FaArrowLeft />
          </button>
          <div className="col-start-2 text-center">
            <h1 className="text-[1.75rem] font-bold text-textMain m-0 mb-2 font-heading leading-tight">
              {t('auth.forgot_password.title')}
            </h1>
            <p className="text-[0.95rem] text-textSecondary m-0 leading-relaxed">
              {t('auth.forgot_password.subtitle')}
            </p>
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <AuthInput 
            label={t('auth.fields.email')} 
            icon={FaEnvelope} 
            type="email" 
            inputMode="email" 
            blockType="auth" 
            placeholder={t('auth.fields.email_placeholder')} 
            disabled={isLoading} 
            error={form.formState.errors.email?.message} 
            {...form.register('email')} 
          />
          {globalError && <span className="text-danger text-[0.85rem] mt-[-10px] font-medium">{globalError}</span>}
          
          <button 
            type="submit" 
            className="w-full mt-2 py-4 bg-textMain text-surface rounded-2xl font-bold flex items-center justify-center uppercase tracking-widest font-heading transition-all shadow-md hover:not-disabled:bg-accent hover:not-disabled:shadow-lg hover:not-disabled:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed text-[14px]" 
            disabled={isLoading}
          >
            {isLoading 
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 
              : t('auth.forgot_password.submit')
            }
          </button>
        </form>
        
        <div className="text-center text-textSecondary text-[0.95rem] mt-8 pt-6 border-t border-borderClient/50">
          <p className="m-0">
            {t('auth.login.subtitle')}?{' '}
            <Link to="/login" className="text-accent no-underline font-bold transition-opacity hover:opacity-80 ml-1">
              {t('auth.login.submit')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}