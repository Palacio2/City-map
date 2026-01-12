import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from './SubscriptionContext';
import styles from './SubscriptionLock.module.css';

const SubscriptionLock = ({ feature, children, message }) => {
  const { hasFeature } = useSubscription();
  const { t } = useTranslation('subscription');
  const navigate = useNavigate();

  if (hasFeature(feature)) return children;

  return (
    <div className={styles.lockContainer}>
      <div className={styles.lockContent}>
        <div className={styles.lockIcon}>🔒</div>
        <h3>{t('subscription.lock.title')}</h3>
        <p>{message || t('subscription.lock.default_msg')}</p>
        <button onClick={() => navigate('/subscription')} className={styles.upgradeButton}>
          {t('subscription.buttons.upgrade')}
        </button>
      </div>
      <div className={styles.blurredContent}>{children}</div>
    </div>
  );
};

export default SubscriptionLock;