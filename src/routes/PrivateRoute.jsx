import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaSpinner } from 'react-icons/fa';
import styles from '@ui/authForm/AuthForm';

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Помилка перевірки аутентифікації:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.authCallbackContent}>
            <div className={styles.statusContent}>
              <div className={styles.spinnerContainer}>
                <FaSpinner className={styles.spinnerLarge} />
              </div>
              <h2 className={styles.statusTitle}>Перевірка доступу</h2>
              <p className={styles.statusText}>Зачекайте, будь ласка...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;