import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { supabase } from '@supabaseClient';
import { validateEmail, blockCyrillicInput } from './validation';

export default function ForgotPassword() {
  const { t } = useTranslation('db'); // Змінено на 'db'
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const cleanEmail = email.trim();
    const emailError = validateEmail(cleanEmail, t);
    if (emailError) {
      setError(emailError);
      return;
    }
    
    setIsLoading(true);
    const redirectUrl = `${window.location.origin}/profile/password`; 
    
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (authError) throw authError;
      setIsSubmitted(true);
    } catch {
      setError(t('auth.errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => navigate(-1);

  if (isSubmitted) {
    return (
      <div className="flex justify-center items-center min-h-[100dvh] bg-body p-4 sm:p-5">
        <div className="bg-surface rounded-2xl p-6 sm:p-10 w-full max-w-[450px] shadow-card border border-borderClient transition-all duration-300 flex flex-col items-center">
          <div className="text-center py-4 flex flex-col items-center">
            <FaCheckCircle className="w-16 h-16 text-success mb-6" />
            <h1 className="text-[1.75rem] font-bold text-textMain m-0 font-heading leading-tight mb-2">{t('auth.forgot_pass.success_title')}</h1>
            <p className="text-[0.95rem] text-textSecondary m-0 leading-relaxed">{t('auth.forgot_pass.success_text')}</p>
            <div className="bg-body p-3 sm:p-4 rounded-md my-6 w-full font-semibold text-textMain border border-borderClient break-all text-[0.9rem] sm:text-base">
              {email}
            </div>
            
            <div className="mt-4 w-full">
              <button onClick={handleBack} className="inline-flex items-center justify-center w-full sm:w-auto gap-2 py-3 px-8 bg-textMain text-surface border-none rounded-md font-semibold cursor-pointer transition-all mb-6 font-heading tracking-widest uppercase hover:bg-accent hover:-translate-y-0.5 hover:shadow-md">
                <FaArrowLeft /> {t('auth.forgot_pass.back')}
              </button>
              <p className="text-textSecondary text-[0.9rem] m-0">
                {t('auth.forgot_pass.spam_note')} {t('auth.login.or')}{' '}
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="text-accent bg-transparent border-none font-semibold cursor-pointer p-0 transition-colors hover:text-accent-hover hover:underline"
                >
                  {t('auth.forgot_pass.resend')}
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
      <div className="bg-surface rounded-[24px] sm:rounded-2xl p-6 sm:p-10 w-full max-w-[450px] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:shadow-card border border-borderClient transition-all duration-300 h-auto flex flex-col">
        <div className="grid grid-cols-[36px_1fr_36px] sm:grid-cols-[40px_1fr_40px] items-center mb-8 gap-2">
          <button onClick={handleBack} className="bg-transparent border border-borderClient text-textSecondary cursor-pointer w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-full flex items-center justify-center transition-all hover:text-textMain hover:bg-hover hover:border-accent">
            <FaArrowLeft />
          </button>
          
          <div className="col-start-2 text-center">
            <h1 className="text-[1.5rem] sm:text-[1.75rem] font-bold text-textMain m-0 mb-1 font-heading leading-tight">{t('auth.forgot_pass.title')}</h1>
            <p className="text-[0.9rem] sm:text-[0.95rem] text-textSecondary m-0 leading-relaxed">{t('auth.forgot_pass.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label htmlFor="email" className="flex items-center gap-2 font-semibold text-textMain mb-2 text-[0.9rem]">
              <FaEnvelope className="text-accent text-[1.1rem]" />
              {t('auth.fields.email')}
            </label>
            <input
              type="text"
              inputMode="email"
              id="email"
              value={email}
              onChange={handleChange}
              onKeyDown={blockCyrillicInput}
              className={`w-full py-[0.85rem] px-4 border border-borderClient rounded-md text-[16px] sm:text-base bg-body text-textMain transition-all font-body focus:border-accent focus:shadow-[0_0_0_3px_rgba(197,164,126,0.15)] focus:outline-none ${error ? '!border-danger !shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : ''}`}
              placeholder={t('auth.fields.email_placeholder')}
              disabled={isLoading}
            />
            {error && <span className="text-danger text-[0.85rem] mt-2">{error}</span>}
          </div>

          <button
            type="submit"
            className="w-full p-4 bg-textMain text-surface border border-textMain rounded-md text-base font-semibold cursor-pointer transition-all flex items-center justify-center uppercase tracking-widest font-heading shadow-sm hover:not(:disabled):bg-accent hover:not(:disabled):border-accent hover:not(:disabled):text-white hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : t('auth.forgot_pass.submit')}
          </button>
        </form>

        <div className="text-center text-textSecondary text-[0.9rem] mt-8 pt-0">
          <p className="m-0">
            {t('auth.login.subtitle')}?{' '}
            <Link to="/login" className="text-accent no-underline font-semibold transition-colors hover:text-accent-hover hover:underline ml-1">
              {t('auth.login.submit')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}