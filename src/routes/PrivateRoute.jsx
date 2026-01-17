import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { userConsentApi } from '../components/api/userConsentApi';
import { FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from '@ui/authForm/AuthForm.module.css';

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [hasConsent, setHasConsent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  
  const { t } = useTranslation('notFound'); 

  useEffect(() => {
    let mounted = true;
    const checkAuthAndConsent = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session) {
            setIsAuthenticated(true);
            const consent = await userConsentApi.checkConsentStatus(session.user.id);
            setHasConsent(consent);
          } else {
            setIsAuthenticated(false);
            setHasConsent(false);
          }
        }
      } catch (error) {
        if (mounted) {
          setIsAuthenticated(false);
          setHasConsent(false);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    checkAuthAndConsent();
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
              <p className={styles.statusText}>{t('loader.checking_access')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasConsent) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;