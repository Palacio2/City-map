import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaEnvelope, FaRedo } from 'react-icons/fa';
import { useMutation } from '@tanstack/react-query';
import { resendConfirmation } from './api/authApi';
import type { LocationState } from './types';

export default function RegisterSuccess() {
  const { t } = useTranslation('db');
  const location = useLocation();
  const state = location.state as LocationState;
  const email = state?.email;
  const [resendStatus, setResendStatus] = useState<'success' | 'error' | ''>('');

  const mutation = useMutation({
    mutationFn: async (targetEmail: string) => {
      await resendConfirmation(targetEmail);
    },
    onSuccess: () => setResendStatus('success'),
    onError: () => setResendStatus('error')
  });

  const handleResendEmail = () => {
    if (!email) return;
    setResendStatus('');
    mutation.mutate(email);
  };

  return (
    <>
      <style>{`
        @keyframes scaleIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      <div className="flex justify-center items-center min-h-[100dvh] bg-body p-4 sm:p-5">
        <div className="bg-surface rounded-3xl p-8 px-6 sm:p-12 w-full max-w-[500px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-borderClient text-center animate-slideUp flex flex-col">
          <div className="flex flex-col items-center gap-5">
            <FaCheckCircle className="w-[80px] h-[80px] text-[var(--success-color,#10b981)] animate-scaleIn mb-2" />
            <h1 className="text-[1.75rem] sm:text-[2rem] font-bold text-textMain m-0 font-heading leading-tight">
              {t('auth.register_success.title')}
            </h1>
            <p className="text-[1.05rem] text-textSecondary leading-relaxed m-0 px-2">
              {t('auth.register_success.text')}
            </p>
            {email && (
              <div className="flex items-center justify-center gap-3 bg-body p-4 sm:py-5 sm:px-6 rounded-2xl font-bold text-textMain my-4 border border-borderClient w-full break-all text-[0.95rem] sm:text-base">
                <FaEnvelope className="text-accent shrink-0 text-xl" />
                {email}
              </div>
            )}
            
            {resendStatus === 'success' && <p className="text-[var(--success-color,#10b981)] font-bold m-0">{t('auth.forgot_password.success_title')}</p>}
            {resendStatus === 'error' && <p className="text-[var(--danger-color,#ef4444)] font-bold m-0">{t('auth.errors.generic')}</p>}
            
            <div className="flex flex-col items-center gap-4 mt-6 w-full">
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center py-4 px-8 bg-textMain text-surface rounded-2xl font-bold text-[14px] transition-all cursor-pointer w-full font-heading uppercase tracking-widest no-underline shadow-md hover:bg-accent hover:text-white hover:-translate-y-0.5 hover:shadow-lg"
              >
                {t('auth.register_success.goto_login')}
              </Link>
              {email && (
                <button 
                  type="button"
                  onClick={handleResendEmail} 
                  disabled={mutation.isPending} 
                  className="inline-flex items-center justify-center gap-2 py-4 px-6 bg-transparent text-textSecondary border-2 border-borderClient rounded-2xl font-bold text-[14px] cursor-pointer transition-all no-underline w-full hover:not-disabled:border-textMain hover:not-disabled:text-textMain hover:not-disabled:bg-body disabled:opacity-60 disabled:cursor-not-allowed uppercase font-heading tracking-wider"
                >
                  {mutation.isPending 
                    ? <><span className="w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin" /> {t('auth.forgot_password.sending')}</> 
                    : <><FaRedo /> {t('auth.register_success.resend_btn')}</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}