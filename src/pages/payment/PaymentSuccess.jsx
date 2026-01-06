import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { useTranslation } from 'react-i18next'; // Імпорт перекладу
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import styles from './PaymentSuccess.module.css';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { updateSubscription } = useSubscription();
  const { t } = useTranslation(); // Хук

  const [displayData, setDisplayData] = useState({
    // Якщо план не передано, беремо дефолтне значення, але краще обробити переклад
    plan: location.state?.plan || 'Premium', 
    amount: location.state?.amount,
    txId: searchParams.get('payment_intent') || `TX-${Date.now().toString().substr(-8)}`
  });

  useEffect(() => {
    updateSubscription(); 
  }, [updateSubscription]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/profile')} className={styles.backButton}>
            <FaArrowLeft /> {t('payment.success.back_to_profile')}
        </button>
        <h1>{t('payment.success.title')}</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <FaCheckCircle size={40} color="#48bb78" style={{ marginBottom: 15 }} />
          <h2>{t('payment.success.access_granted')}</h2>
          <p>{t('payment.success.subscription_active')}</p>
        </div>

        <div className={styles.section}>
          <div className={styles.orderDetails}>
            <div className={styles.detailRow}>
                <span>{t('payment.success.status_label')}</span>
                <span style={{color: '#48bb78'}}>{t('payment.success.status_success')}</span>
            </div>
            
            {displayData.amount !== undefined && (
                <div className={styles.detailRow}>
                    <span>{t('payment.success.amount_label')}</span>
                    <span>{displayData.amount} грн</span>
                </div>
            )}
            
            <div className={styles.detailRow}>
                <span>{t('payment.success.tx_label')}</span>
                <span>{displayData.txId}</span>
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/')} className={styles.profileButton}>
            {t('payment.success.to_map')}
        </button>
      </div>
    </div>
  );
}