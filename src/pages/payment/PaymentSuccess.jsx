import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import styles from './PaymentSuccess.module.css';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { updateSubscription } = useSubscription();
  
  const { t } = useTranslation('payment');

  // Визначаємо ID транзакції: це може бути payment_intent (оплата) або setup_intent (прив'язка)
  const paymentIntent = searchParams.get('payment_intent');
  const setupIntent = searchParams.get('setup_intent');
  const realTxId = paymentIntent || setupIntent;

  // Визначаємо суму: якщо це прив'язка (setup_intent), то сума 0
  const initialAmount = location.state?.amount ?? (setupIntent ? 0 : undefined);

  const [displayData] = useState({
    plan: location.state?.plan || 'Premium', 
    amount: initialAmount,
    // Якщо ID є від Stripe - показуємо його, інакше (раптом) генеруємо
    txId: realTxId || `TX-${Date.now().toString().substr(-8)}`
  });

  useEffect(() => {
    updateSubscription(); 
  }, [updateSubscription]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/profile')} className={styles.backButton}>
            <FaArrowLeft /> {t('success.back_to_profile')}
        </button>
        <h1>{t('success.title')}</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.successHeader}>
             <div className={styles.successIcon}>
               <FaCheckCircle />
             </div>
             <div className={styles.successText}>
               <h2>{t('success.access_granted')}</h2>
               <p>{t('success.subscription_active')}</p>
             </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
             <h2>{t('success.details_title')}</h2>
          </div>
          <div className={styles.orderDetails}>
            <div className={styles.detailRow}>
                <span>{t('success.status_label')}</span>
                <span style={{color: '#48bb78'}}>{t('success.status_success')}</span>
            </div>
            
            {/* Показуємо суму, якщо вона визначена (включаючи 0) */}
            {displayData.amount !== undefined && (
                <div className={styles.detailRow}>
                    <span>{t('success.amount_label')}</span>
                    <span>{displayData.amount} грн</span>
                </div>
            )}
            
            <div className={styles.detailRow}>
                <span>{t('success.tx_label')}</span>
                {/* Використовуємо monospace шрифт для гарного вигляду ID */}
                <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                    {displayData.txId}
                </span>
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