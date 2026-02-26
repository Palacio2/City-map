import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import styles from './ForgotPassword.module.css';
import { supabase } from '@supabaseClient';
import { validateEmail, blockCyrillicInput } from './validation';

export default function ForgotPassword() {
  const { t } = useTranslation('auth');
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
      // Прибрали (err), бо ми його не використовуємо
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => navigate(-1);

  if (isSubmitted) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successMessage}>
            <FaCheckCircle className={styles.successIcon} />
            <h1 className={styles.title}>{t('forgot_pass.success_title')}</h1>
            <p className={styles.subtitle}>{t('forgot_pass.success_text')}</p>
            <p className={styles.emailNote}>{email}</p>
            
            <div className={styles.successActions}>
              <button onClick={handleBack} className={styles.backButton}>
                <FaArrowLeft /> {t('forgot_pass.back')}
              </button>
              <p className={styles.helpText}>
                {t('forgot_pass.spam_note')} {t('login.or')}{' '}
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className={styles.resendLink}
                >
                  {t('forgot_pass.resend')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button onClick={handleBack} className={styles.backButtonSmall}>
            <FaArrowLeft />
          </button>
          
          <div className={styles.headerTextWrapper}>
            <h1 className={styles.title}>{t('forgot_pass.title')}</h1>
            <p className={styles.subtitle}>{t('forgot_pass.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              <FaEnvelope className={styles.icon} />
              {t('fields.email')}
            </label>
            <input
              type="text"
              inputMode="email"
              id="email"
              value={email}
              onChange={handleChange}
              onKeyDown={blockCyrillicInput}
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              placeholder={t('fields.email_placeholder')}
              disabled={isLoading}
            />
            {error && <span className={styles.error}>{error}</span>}
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? <div className={styles.spinner}></div> : t('forgot_pass.submit')}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            {t('login.subtitle')}?{' '}
            <Link to="/login" className={styles.link}>
              {t('login.submit')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}