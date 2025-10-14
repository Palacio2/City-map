import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import styles from './ForgotPassword.module.css';
import { supabase } from '../../supabaseClient';

export default function ForgotPassword() {
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
      newErrors.email = 'Email обов\'язковий';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Невірний формат email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      console.log('Password reset requested for:', email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setErrors({ submit: 'Помилка відправки. Спробуйте ще раз.' });
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
            <h1 className={styles.title}>Лист відправлено!</h1>
            <p className={styles.subtitle}>
              Ми відправили інструкції для відновлення пароля на вашу електронну пошту
            </p>
            <p className={styles.emailNote}>{email}</p>
            
            <div className={styles.successActions}>
              <button onClick={handleBack} className={styles.backButton}>
                <FaArrowLeft /> Повернутись до входу
              </button>
              <p className={styles.helpText}>
                Не отримали лист? Перевірте папку "Спам" або{' '}
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className={styles.resendLink}
                >
                  відправте ще раз
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
          <h1 className={styles.title}>Відновлення пароля</h1>
          <p className={styles.subtitle}>
            Введіть вашу електронну пошту, ми надішлемо інструкції для відновлення пароля
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              <FaEnvelope className={styles.icon} />
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="Ваш email"
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
                Відправка...
              </>
            ) : (
              'Надіслати інструкції'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Пам'ятаєте пароль?{' '}
            <Link to="/login" className={styles.link}>
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}