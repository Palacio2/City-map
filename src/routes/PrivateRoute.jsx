import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from '@ui/authForm/AuthForm.module.css';

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  
  const { t } = useTranslation('notFound'); 

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Auth check failed:', error);
        if (mounted) setIsAuthenticated(false);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.authCallbackContent}>
            <div className={styles.statusContent}>
              <div className={styles.spinnerContainer}>
                <FaSpinner className={styles.spinnerLarge} />
              </div>
              <h2 className={styles.statusTitle}>{t('loader.checking_access')}</h2>
              <p className={styles.statusText}>{t('loader.wait')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;