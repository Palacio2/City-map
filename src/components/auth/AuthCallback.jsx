import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../supabaseClient';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import styles from './AuthCallback.module.css';

export default function AuthCallback() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState(t('callback.processing'));

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          setStatus('success');
          setMessage(t('callback.success'));
          setTimeout(() => navigate('/', { replace: true }), 1500);
        }
      }
    );

    const timeout = setTimeout(() => {
      if (status === 'loading') {
        setStatus('error');
        setMessage(t('callback.timeout'));
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, status, t]);

  const config = {
    loading: { icon: FaSpinner, className: styles.spinner, color: 'var(--primary-color)' },
    success: { icon: FaCheckCircle, className: styles.icon, color: 'var(--secondary-color)' },
    error: { icon: FaExclamationTriangle, className: styles.icon, color: 'var(--danger-color)' }
  }[status];

  const Icon = config.icon;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.content}>
          <Icon 
            className={config.className} 
            style={{ color: config.color }} 
          />
          <h2 className={styles.title}>
            {status === 'loading' ? t('callback.loading') : status === 'success' ? 'Ok' : t('callback.error')}
          </h2>
          <p className={styles.text}>{message}</p>
        </div>
      </div>
    </div>
  );
}