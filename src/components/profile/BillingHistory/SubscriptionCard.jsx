import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import styles from './SubscriptionCard.module.css';

const SubscriptionCard = ({ subscription, isLoading, onManage, isCancelling, error, dateFormatter, t }) => {
  if (isLoading || !subscription) return null;

  const actualPlanKey = (subscription?.isExpired || !subscription?.plan) ? 'free' : subscription.plan;
  const isActive = subscription?.status === 'active' && actualPlanKey !== 'free';
  
  const planName = t(`subscription:subscription.plans.${actualPlanKey}.name`);
  const amount = t(`subscription:subscription.plans.${actualPlanKey}.price`);
  const expiresAt = (actualPlanKey !== 'free' && subscription?.expiresAt) 
    ? dateFormatter.format(new Date(subscription.expiresAt))
    : t('subscription:subscription.status.free');

  return (
    <section className={styles.subscriptionCard}>
      <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{t('billing:current_sub')}</h3>
          <span className={`${styles.badge} ${isActive ? styles.badgeActive : styles.badgeFree}`}>
              {isActive ? t('billing:status_map.active') : 'Free'}
          </span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.infoRow}>
            <span className={styles.label}>{t('billing:plan_label')}</span>
            <span className={styles.value}>{planName}</span>
        </div>
        <div className={styles.infoRow}>
            <span className={styles.label}>{t('billing:price_label')}</span>
            <span className={styles.value}>{amount}</span>
        </div>
        {isActive && (
            <div className={styles.infoRow}>
                <span className={styles.label}>{t('billing:next_payment')}</span>
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
        {isCancelling ? t('billing:processing') : (
          isActive ? t('billing:cancel_sub') : t('billing:update_plan')
        )}
      </button>
    </section>
  );
};

export default SubscriptionCard;