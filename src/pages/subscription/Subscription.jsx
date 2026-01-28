import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaTimes, FaLock } from 'react-icons/fa';
import { useSubscription } from './SubscriptionContext'; 
import { subscriptionPlans } from './subscriptionPlans';
import styles from './Subscription.module.css';

export default function Subscription() {
  const { subscription } = useSubscription(); 
  const navigate = useNavigate();
  const { t } = useTranslation('subscription');
  
  const [selectedPlan, setSelectedPlan] = useState(() => {
    if (subscription && subscription.plan !== 'free' && !subscription.isExpired) {
       return subscription.plan;
    }
    return 'premium';
  });

  useEffect(() => {
    if (subscription && subscription.plan !== 'free' && !subscription.isExpired) {
        setSelectedPlan(subscription.plan);
    }
  }, [subscription]);

  const hasActivePaidSubscription = subscription && 
                                    subscription.plan !== 'free' && 
                                    !subscription.isExpired;

  const currentPlanConfig = subscriptionPlans[selectedPlan] || subscriptionPlans['premium'];
  const IconComponent = currentPlanConfig.icon;
  const isThisPlanActive = subscription?.plan === selectedPlan && !subscription.isExpired;

  const handlePlanSelection = () => {
    if (hasActivePaidSubscription || selectedPlan === 'free') return;
    navigate('/payment', { state: { planKey: selectedPlan } });
  };

  const getPlanDetails = (key) => ({
    // ВИПРАВЛЕННЯ 1: Перекладаємо назву плану через t()
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
            
            return (
              <button
                key={key}
                className={`${styles.toggleButton} ${selectedPlan === key ? styles.active : ''}`}
                onClick={() => setSelectedPlan(key)}
              >
                <div className={styles.buttonContent}>
                    <PlanIcon className={styles.planIcon} />
                    {/* ВИПРАВЛЕННЯ 2: Назва плану в кнопках перемикання */}
                    <span className={styles.planName}>{t(`subscription.plans.${key}.name`)}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <div className={styles.bigIconWrapper}>
                <IconComponent />
            </div>
            <h2>{selectedPlanDetails.name}</h2>
            <div className={styles.price}>
                {isThisPlanActive ? t('subscription.active_plan_label') : selectedPlanDetails.price}
            </div>
          </div>
          
          <div className={styles.features}>
            <h3>{t('subscription.included_title')}</h3>
            {/* ВИПРАВЛЕННЯ 3: featureKey - це ключ, ми передаємо його в t() */}
            {currentPlanConfig.features.map((featureKey, i) => (
              <div key={i} className={styles.featureItem}>
                <FaCheck className={styles.checkIcon} /> {t(`subscription.features.${featureKey}`)}
              </div>
            ))}
          </div>

          {currentPlanConfig.disabledFeatures?.length > 0 && (
            <div className={styles.disabledFeatures}>
              <h3>{t('subscription.disabled_title')}</h3>
              {/* ВИПРАВЛЕННЯ 4: те саме для disabledFeatures */}
              {currentPlanConfig.disabledFeatures.map((featureKey, i) => (
                <div key={i} className={styles.disabledFeature}>
                    <FaTimes className={styles.timesIcon} /> {t(`subscription.features.${featureKey}`)}
                </div>
              ))}
            </div>
          )}

          <button 
            className={`${styles.subscribeButton} ${styles[selectedPlan]}`}
            onClick={handlePlanSelection}
            disabled={hasActivePaidSubscription || (selectedPlan === 'free' && !isThisPlanActive)}
          >
            {isThisPlanActive 
                ? t('subscription.buttons.active')
                : hasActivePaidSubscription 
                    ? t('subscription.buttons.has_active_sub') 
                    : selectedPlan === 'free' 
                        ? t('subscription.buttons.stay_free') 
                        : t('subscription.buttons.choose', { plan: selectedPlanDetails.name })}
          </button>
          
          {hasActivePaidSubscription && !isThisPlanActive && (
              <p className={styles.lockMessage}>
                 <FaLock /> {t('subscription.wait_expire')}
              </p>
          )}
        </div>
      </div>
    </div>
  );
}