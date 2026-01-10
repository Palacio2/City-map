import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../pages/subscription/SubscriptionContext';
import { FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from '@ui/authForm/AuthForm.module.css';

const ProtectedRoute = ({ children, requiredPlan = 'premium' }) => {
  const { isLoading, isPremium, isPro } = useSubscription();
  
  const { t } = useTranslation('notFound'); 
  
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.authCallbackContent}>
            <div className={styles.spinnerContainer}>
              <FaSpinner className={styles.spinnerLarge} />
            </div>
            <p className={styles.statusText}>{t('loader.checking_subscription')}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (requiredPlan === 'premium' && !isPremium) {
    return <Navigate to="/subscription" replace />;
  }
  
  if (requiredPlan === 'pro' && !isPro && !isPremium) {
    return <Navigate to="/subscription" replace />;
  }
  
  return children;
};

export default ProtectedRoute;