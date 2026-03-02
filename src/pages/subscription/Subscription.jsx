import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaTimes, FaLock } from 'react-icons/fa';
import { useSubscription } from './SubscriptionContext'; 
import { subscriptionPlans } from './subscriptionPlans';
import Loader from '@components/loader/Loader';
import styles from './Subscription.module.css';

export default function Subscription() {
  const { subscription, isLoading } = useSubscription(); 
  const navigate = useNavigate();
  const { t } = useTranslation(['subscription']);
  
  const hasActivePaidSubscription = subscription && 
                                    subscription.plan !== 'free' && 
                                    !subscription.isExpired;

  const [selectedPlan, setSelectedPlan] = useState(() => {
    if (hasActivePaidSubscription) return subscription.plan;
    return 'premium';
  });

  if (isLoading) return <Loader fullScreen />;

  const currentPlanConfig = subscriptionPlans[selectedPlan] || subscriptionPlans['premium'];
  const IconComponent = currentPlanConfig.icon;
  const isThisPlanActive = subscription?.plan === selectedPlan && !subscription.isExpired;

  const handlePlanSelection = () => {
    if (hasActivePaidSubscription || selectedPlan === 'free') return;
    navigate('/payment', { state: { planKey: selectedPlan } });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('subscription.title')}</h1>
        <p className={styles.subtitle}>{t('subscription.subtitle')}</p>
      </div>

      <div className={styles.plansContainer}>
        <div className={styles.planToggle}>
          {Object.keys(subscriptionPlans).map((key) => {
            const PlanIcon = subscriptionPlans[key].icon;
            return (
              <button
                key={key}
                className={`${styles.toggleButton} ${selectedPlan === key ? styles.active : ''}`}
                onClick={() => setSelectedPlan(key)}
              >
                <div className={styles.buttonContent}>
                    <PlanIcon className={styles.planIcon} />
                    <span className={styles.planName}>{t(`subscription.plans.${key}.name`)}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <div className={styles.bigIconWrapper}><IconComponent /></div>
            <h2 className={styles.cardTitle}>{t(`subscription.plans.${selectedPlan}.name`)}</h2>
            <div className={styles.price}>
                {isThisPlanActive ? t('subscription.buttons.active') : t(`subscription.plans.${selectedPlan}.price`)}
            </div>
          </div>
          
          <div className={styles.features}>
            <h3 className={styles.featuresTitle}>{t('subscription.included_title')}</h3>
            <div className={styles.featuresList}>
                {currentPlanConfig.features.map((featureKey) => (
                <div key={featureKey} className={styles.featureItem}>
                    <FaCheck className={styles.checkIcon} /> 
                    <span>{t(`subscription.features.${featureKey}`)}</span>
                </div>
                ))}
            </div>
          </div>

          {currentPlanConfig.disabledFeatures?.length > 0 && (
            <div className={styles.disabledFeatures}>
              <h3 className={styles.featuresTitle}>{t('subscription.disabled_title')}</h3>
              <div className={styles.featuresList}>
                  {currentPlanConfig.disabledFeatures.map((featureKey) => (
                    <div key={featureKey} className={styles.disabledFeature}>
                        <FaTimes className={styles.timesIcon} /> 
                        <span>{t(`subscription.features.${featureKey}`)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <button 
            className={styles.subscribeButton}
            onClick={handlePlanSelection}
            disabled={hasActivePaidSubscription || (selectedPlan === 'free' && !isThisPlanActive)}
          >
            {isThisPlanActive 
                ? t('subscription.buttons.active')
                : hasActivePaidSubscription 
                    ? t('subscription.buttons.has_active_sub') 
                    : selectedPlan === 'free' 
                        ? t('subscription.buttons.stay_free') 
                        : t('subscription.buttons.choose', { plan: t(`subscription.plans.${selectedPlan}.name`) })}
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