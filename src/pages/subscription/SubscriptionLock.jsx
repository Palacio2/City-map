import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from './SubscriptionContext';
import styles from './SubscriptionLock.module.css';

const SubscriptionLock = ({ feature, children, message = null }) => {
  const { hasFeature } = useSubscription();
  const navigate = useNavigate();

  if (hasFeature(feature)) return children;

  const defaultMessage = message || `Ця функція доступна тільки з підпискою Pro або Premium.`;

  return (
    <div className={styles.lockContainer}>
      <div className={styles.lockContent}>
        <div className={styles.lockIcon}>🔒</div>
        <h3>Потрібна підписка</h3>
        <p>{defaultMessage}</p>
        <button onClick={() => navigate('/subscription')} className={styles.upgradeButton}>
          Оновити підписку
        </button>
      </div>
      <div className={styles.blurredContent}>
        {children}
      </div>
    </div>
  );
};

export default SubscriptionLock;