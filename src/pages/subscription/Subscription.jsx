import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useSubscription } from '../../pages/subscription/SubscriptionContext'; 
import { subscriptionPlans } from './subscriptionPlans';
import styles from './Subscription.module.css';

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState('premium'); 
  const navigate = useNavigate();
  // ВАЖЛИВО: Вказуємо файл перекладу 'subscription'
  const { t } = useTranslation('subscription');
  const { subscription } = useSubscription(); 

  const currentPlanConfig = subscriptionPlans[selectedPlan];
  const IconComponent = currentPlanConfig.icon;
  const isCurrentPlan = subscription?.plan === selectedPlan && !subscription.isExpired;

  const handlePlanSelection = () => {
    if (selectedPlan === 'free') return;
    navigate('/payment', { state: { planKey: selectedPlan } });
  };

  const getPlanDetails = (key) => ({
    name: t(`subscription.plans.${key}.name`),
    price: t(`subscription.plans.${key}.price`)
  });

  const selectedPlanDetails = getPlanDetails(selectedPlan);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t('subscription.title')}</h1>
        <p>{t('subscription.subtitle')}</p>
      </div>

      <div className={styles.plansContainer}>
        <div className={styles.planToggle}>
          {Object.keys(subscriptionPlans).map((key) => {
            const planConfig = subscriptionPlans[key];
            const PlanIcon = planConfig.icon;
            const isActive = subscription?.plan === key && !subscription.isExpired;
            const { name } = getPlanDetails(key);
            
            return (
              <button
                key={key}
                className={`${styles.toggleButton} ${selectedPlan === key ? styles.active : ''}`}
                onClick={() => setSelectedPlan(key)}
              >
                <PlanIcon /> {name} {isActive && <span className={styles.currentPlanLabel}>{t('subscription.current_label')}</span>}
              </button>
            );
          })}
        </div>

        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <IconComponent size={40} />
            <h2>{selectedPlanDetails.name}</h2>
            <div className={styles.price}>
                {isCurrentPlan ? t('subscription.active_plan_label') : selectedPlanDetails.price}
            </div>
          </div>
          
          <div className={styles.features}>
            <h3>{t('subscription.included_title')}</h3>
            {currentPlanConfig.features.map((f, i) => (
              <div key={i} className={styles.featureItem}>
                <FaCheck /> {t(`subscription.features.${f}`)}
              </div>
            ))}
          </div>

          {selectedPlan === 'free' && currentPlanConfig.disabledFeatures && (
            <div className={styles.disabledFeatures}>
              <h3>{t('subscription.disabled_title')}</h3>
              {currentPlanConfig.disabledFeatures.map((f, i) => (
                <div key={i} className={styles.disabledFeature}>
                    <FaTimes /> {t(`subscription.features.${f}`)}
                </div>
              ))}
            </div>
          )}

          <button 
            className={`${styles.subscribeButton} ${styles[selectedPlan]}`}
            onClick={handlePlanSelection}
            disabled={isCurrentPlan} 
          >
            {isCurrentPlan 
                ? t('subscription.buttons.active') 
                : selectedPlan === 'free' 
                    ? t('subscription.buttons.stay_free') 
                    : t('subscription.buttons.choose', { plan: selectedPlanDetails.name })}
          </button>
        </div>
      </div>
    </div>
  );
}