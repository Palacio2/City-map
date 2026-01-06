import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaEnvelope, FaRedo } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import styles from './RegisterSuccess.module.css';

export default function RegisterSuccess() {
  const { t } = useTranslation('auth');
  const location = useLocation();
  const email = location.state?.email || 'email';
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const handleResendEmail = async () => {
    if (!email || email === 'email') return;
    
    setIsResending(true);
    setResendStatus('');
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      setResendStatus('success');
    } catch (error) {
      setResendStatus('error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.successMessage}>
          <FaCheckCircle className={styles.successIcon} />
          <h1>{t('success_reg.title')}</h1>
          <p>{t('success_reg.text')}</p>
          
          <div className={styles.emailNote}>
            <FaEnvelope /> 
            <span>{email}</span>
          </div>
          
          <p>{t('success_reg.check_email')}</p>

          {resendStatus === 'success' && (
            <p className={styles.successText}>{t('forgot_pass.success_title')}</p>
          )}
          
          {resendStatus === 'error' && (
            <p className={styles.errorText}>{t('errors.generic')}</p>
          )}

          <div className={styles.actions}>
            <Link to="/login" className={styles.button}>
              {t('success_reg.goto_login')}
            </Link>
            
            {email && email !== 'email' && (
              <button 
                onClick={handleResendEmail}
                disabled={isResending}
                className={styles.resendButton}
              >
                {isResending ? (
                  <>
                    <div className={styles.spinner}></div>
                    {t('forgot_pass.sending')}
                  </>
                ) : (
                  <>
                    <FaRedo />
                    {t('success_reg.resend_btn')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}