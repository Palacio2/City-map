import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import styles from './ForgotPassword.module.css';
import { supabase } from '../../supabaseClient';

export default function ForgotPassword() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = t('errors.required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('errors.email_invalid');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/profile/password`; 
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setIsSubmitted(true);
    } catch (error) {
      setErrors({ submit: t('errors.generic') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isSubmitted) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.successMessage}>
            <FaCheckCircle className={styles.successIcon} />
            <h1 className={styles.title}>{t('forgot_pass.success_title')}</h1>
            <p className={styles.subtitle}>
              {t('forgot_pass.success_text')}
            </p>
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
          <h1 className={styles.title}>{t('forgot_pass.title')}</h1>
          <p className={styles.subtitle}>
            {t('forgot_pass.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              <FaEnvelope className={styles.icon} />
              {t('fields.email')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder={t('fields.email_placeholder')}
              disabled={isLoading}
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          {errors.submit && <span className={styles.errorSubmit}>{errors.submit}</span>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                {t('forgot_pass.sending')}
              </>
            ) : (
              t('forgot_pass.submit')
            )}
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