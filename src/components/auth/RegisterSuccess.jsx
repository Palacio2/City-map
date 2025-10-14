import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaEnvelope, FaRedo } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import styles from './RegisterSuccess.module.css';

export default function RegisterSuccess() {
  const location = useLocation();
  const email = location.state?.email || 'вашу електронну пошту';
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const handleResendEmail = async () => {
    if (!email || email === 'вашу електронну пошту') return;
    
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
      console.error('Помилка повторної відправки:', error);
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
          <h1>Реєстрація успішна!</h1>
          <p>Ми відправили лист для підтвердження на вашу електронну пошту</p>
          
          <div className={styles.emailNote}>
            <FaEnvelope /> 
            <span>{email}</span>
          </div>
          
          <p>Будь ласка, перевірте вашу пошту та підтвердіть email адресу.</p>

          {resendStatus === 'success' && (
            <p className={styles.successText}>Лист успішно відправлено повторно!</p>
          )}
          
          {resendStatus === 'error' && (
            <p className={styles.errorText}>Помилка відправки. Спробуйте пізніше.</p>
          )}

          <div className={styles.actions}>
            <Link to="/login" className={styles.button}>
              Перейти до входу
            </Link>
            
            {email && email !== 'вашу електронну пошту' && (
              <button 
                onClick={handleResendEmail}
                disabled={isResending}
                className={styles.resendButton}
              >
                {isResending ? (
                  <>
                    <div className={styles.spinner}></div>
                    Відправка...
                  </>
                ) : (
                  <>
                    <FaRedo />
                    Надіслати лист ще раз
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