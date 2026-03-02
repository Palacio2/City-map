import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@subscription/SubscriptionContext';
import styles from './PaymentSuccess.module.css';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { updateSubscription } = useSubscription();
  const { t } = useTranslation('payment');

  const paymentIntent = searchParams.get('payment_intent');
  const setupIntent = searchParams.get('setup_intent');
  const realTxId = paymentIntent || setupIntent;

  const formatEuro = (amount) => {
    if (amount === undefined || amount === null) return '';
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const [displayData] = useState(() => ({
    amount: location.state?.amount ?? (setupIntent ? 0 : undefined),
    txId: realTxId || `TX-${Date.now().toString().slice(-8)}`
  }));

  useEffect(() => {
    updateSubscription(); 
  }, [updateSubscription]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
           <div className={styles.successIcon}><FaCheckCircle /></div>
           <div className={styles.successText}>
             <h2>{t('success.access_granted')}</h2>
             <p>{t('success.subscription_active')}</p>
           </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
              <h2>{t('success.details_title')}</h2>
          </div>
          <div className={styles.orderDetails}>
            <div className={styles.detailRow}>
                <span>{t('success.status_label')}</span>
                <span className={styles.statusSuccess}>{t('success.status_success')}</span>
            </div>
            
            {displayData.amount !== undefined && (
                <div className={styles.detailRow}>
                    <span>{t('success.amount_label')}</span>
                    <span>{formatEuro(displayData.amount)}</span>
                </div>
            )}
            
            <div className={styles.detailRow}>
                <span>{t('success.tx_label')}</span>
                <span className={styles.txId}>{displayData.txId}</span>
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/')} className={styles.profileButton}>
            {t('success.to_map')}
        </button>
      </div>
    </div>
  );
}