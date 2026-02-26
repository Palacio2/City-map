import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle } from 'react-icons/fa';
import styles from './SubscriptionCard.module.css';

const SubscriptionCard = ({ subscription, onManage, isCancelling, error, dateFormatter }) => {
  const { t } = useTranslation('billing');

  if (!subscription) return null;

  const actualPlanKey = (subscription?.isExpired || !subscription?.plan) ? 'free' : subscription.plan;
  const isActive = subscription?.status === 'active' && actualPlanKey !== 'free';
  
  const planName = t(`plans.${actualPlanKey}.name`, { defaultValue: 'Free' });
  const amount = t(`plans.${actualPlanKey}.price`, { defaultValue: '€0' });
  
  const expiresAt = (isActive && subscription?.expiresAt) 
    ? dateFormatter.format(new Date(subscription.expiresAt))
    : null;

  return (
    <section className={styles.subscriptionCard}>
      <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{t('current_sub')}</h3>
          <span className={`${styles.badge} ${isActive ? styles.badgeActive : styles.badgeFree}`}>
              {isActive 
                ? t('status_map.active') 
                : t('plans.free.name', { defaultValue: 'Free' })}
          </span>
      </div>
      
      <div className={styles.cardBody}>
        <div className={styles.infoRow}>
            <span className={styles.label}>{t('plan_label')}</span>
            <span className={styles.value}>{planName}</span>
        </div>
        
        <div className={styles.infoRow}>
            <span className={styles.label}>{t('price_label')}</span>
            <span className={styles.value}>{amount}</span>
        </div>
        
        {isActive && expiresAt && (
            <div className={styles.infoRow}>
                <span className={styles.label}>{t('next_payment')}</span>
                <span className={styles.value}>{expiresAt}</span>
            </div>
        )}
      </div>

      {error && (
          <div className={styles.errorBox}>
              <FaExclamationTriangle /> {error}
          </div>
      )}

      <button 
        className={`${styles.actionButton} ${isActive ? styles.btnCancel : styles.btnUpgrade}`} 
        onClick={onManage}
        disabled={isCancelling}
      >
        {isCancelling ? t('processing') : (
          isActive ? t('cancel_sub') : t('update_plan')
        )}
      </button>
    </section>
  );
};

export default SubscriptionCard;