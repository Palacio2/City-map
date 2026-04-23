import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaEnvelope, FaRedo } from 'react-icons/fa';
import { supabase } from '@supabaseClient';
import { useMutation } from '@tanstack/react-query';

interface LocationState { email?: string; }

export default function RegisterSuccess() {
  const { t } = useTranslation('db');
  const location = useLocation();
  const state = location.state as LocationState;
  const email = state?.email; 
  const [resendStatus, setResendStatus] = useState<'success' | 'error' | ''>(''); 

  const resendMutation = useMutation({
    mutationFn: async (targetEmail: string) => {
      const { error } = await supabase.auth.resend({ type: 'signup', email: targetEmail, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
    },
    onSuccess: () => setResendStatus('success'),
    onError: () => setResendStatus('error')
  });

  const handleResendEmail = () => {
    if (!email) return;
    setResendStatus('');
    resendMutation.mutate(email);
  };

  return (
    <>
      <style>{`
        @keyframes scaleIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
      <div className="flex justify-center items-center min-h-[100dvh] bg-body p-4 sm:p-5">
        <div className="bg-surface rounded-2xl p-6 sm:p-12 w-full max-w-[500px] shadow-card border border-borderClient text-center animate-fadeInUp flex flex-col">
          <div className="flex flex-col items-center gap-5">
            <FaCheckCircle className="w-[72px] h-[72px] text-success animate-scaleIn" />
            <h1 className="text-[1.6rem] sm:text-2xl font-bold text-textMain m-0 font-heading leading-tight">{t('auth.register_success.title')}</h1>
            <p className="text-[1.1rem] text-textSecondary leading-relaxed m-0">{t('auth.register_success.text')}</p>
            {email && (
              <div className="flex items-center justify-center gap-3 bg-body p-3 sm:py-4 sm:px-6 rounded-md font-semibold text-textMain my-2 border border-borderClient w-full break-all text-[0.9rem] sm:text-base">
                <FaEnvelope className="text-accent shrink-0 text-lg" /> 
                <span>{email}</span>
              </div>
            )}
            <p className="text-base text-textSecondary m-0">{t('auth.register_success.check_email')}</p>
            {resendStatus === 'success' && <p className="text-success font-semibold m-0">{t('auth.forgot_password.success_title')}</p>}
            {resendStatus === 'error' && <p className="text-danger font-semibold m-0">{t('auth.errors.generic')}</p>}
            <div className="flex flex-col items-center gap-4 mt-4 w-full">
              <Link to="/login" className="inline-flex items-center justify-center py-[0.85rem] px-8 bg-textMain text-surface rounded-md font-semibold text-base transition-all border border-textMain cursor-pointer w-full sm:min-w-[200px] font-heading uppercase tracking-widest no-underline shadow-sm hover:bg-accent hover:border-accent hover:text-white hover:-translate-y-0.5 hover:shadow-md">
                {t('auth.register_success.goto_login')}
              </Link>
              {email && (
                <button onClick={handleResendEmail} disabled={resendMutation.isPending} className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-transparent text-textSecondary border border-borderClient rounded-md font-semibold text-[0.9rem] cursor-pointer transition-all no-underline w-full sm:min-w-[180px] hover:not(:disabled):border-textMain hover:not(:disabled):text-textMain disabled:opacity-60 disabled:cursor-not-allowed">
                  {resendMutation.isPending ? (<><span className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin"></span> {t('auth.forgot_password.sending')}</>) : (<><FaRedo /> {t('auth.register_success.resend_btn')}</>)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}