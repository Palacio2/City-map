import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import styles from '../../ui/authForm/AuthForm.module.css'; // Виправлений імпорт

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        switch (event) {
          case 'SIGNED_IN':
            setStatus('success');
            setTimeout(() => navigate('/', { replace: true }), 2000);
            break;
            
          case 'SIGNED_OUT':
            setStatus('error');
            setError('Сесія завершена');
            setTimeout(() => navigate('/login', { replace: true }), 3000);
            break;
            
          default:
            setStatus('error');
            setError('Невідома помилка автентифікації');
            setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
      }
    );

    const timeout = setTimeout(() => {
      if (status === 'loading') {
        setStatus('error');
        setError('Час очікування вийшов');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, status]);

  const getStatusContent = () => {
    const statusConfig = {
      loading: {
        icon: FaSpinner,
        title: 'Обробка автентифікації',
        text: 'Зачекайте, будь ласка...',
        className: styles.spinnerLarge
      },
      success: {
        icon: FaCheckCircle,
        title: 'Успішна автентифікація!',
        text: 'Перенаправляємо на головну...',
        className: styles.successIconLarge
      },
      error: {
        icon: FaExclamationTriangle,
        title: 'Помилка автентифікації',
        text: error,
        className: styles.errorIcon
      }
    };

    const config = statusConfig[status];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <div className={styles.statusContent}>
        <div className={styles.iconContainer}>
          <Icon className={config.className} />
        </div>
        <h2 className={styles.statusTitle}>{config.title}</h2>
        <p className={styles.statusText}>{config.text}</p>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.authCallbackContent}>
          {getStatusContent()}
        </div>
      </div>
    </div>
  );
}