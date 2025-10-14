import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes, FaQuestionCircle } from 'react-icons/fa';
import { subscriptionPlans, featureTranslations } from './subscriptionPlans';
import styles from './Subscription.module.css';

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const navigate = useNavigate();

  const currentPlan = subscriptionPlans[selectedPlan];
  const IconComponent = currentPlan.icon;

  const handlePlanSelection = () => {
    if (selectedPlan === 'free') {
      console.log('Обрано безкоштовний тариф');
    } else {
      navigate('/payment', { 
        state: { 
          plan: currentPlan.name,
          price: currentPlan.price,
          features: currentPlan.features.map(key => featureTranslations[key])
        }
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Обрати підписку</h1>
        <p>Розкрийте повний потенціал аналізу районів з нашими тарифами</p>
      </div>

      <div className={styles.plansContainer}>
        <div className={styles.planToggle}>
          {Object.entries(subscriptionPlans).map(([key, plan]) => (
            <button
              key={key}
              className={`${styles.toggleButton} ${selectedPlan === key ? styles.active : ''}`}
              onClick={() => setSelectedPlan(key)}
            >
              <plan.icon />
              {plan.name}
            </button>
          ))}
        </div>

        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <IconComponent />
            <h2>{currentPlan.name}</h2>
            <div className={styles.price}>{currentPlan.price}</div>
            {selectedPlan !== 'free' && <div className={styles.trialLabel}>7 днів безкоштовно</div>}
          </div>
          
          <div className={styles.features}>
            <h3>Що включено:</h3>
            {currentPlan.features.map((featureKey, index) => (
              <div key={index} className={styles.featureItem}>
                <FaCheck />
                <span>{featureTranslations[featureKey]}</span>
              </div>
            ))}
          </div>

          {selectedPlan === 'free' && (
            <div className={styles.disabledFeatures}>
              <h3>Недоступно без підписки:</h3>
              {currentPlan.disabledFeatures.map((featureKey, index) => (
                <div key={index} className={styles.disabledFeature}>
                  <FaTimes />
                  <span>{featureTranslations[featureKey]}</span>
                </div>
              ))}
            </div>
          )}

          <button 
            className={`${styles.subscribeButton} ${styles[selectedPlan]}`}
            onClick={handlePlanSelection}
          >
            {selectedPlan === 'free' ? 'Почати безкоштовно' : 'Обрати тариф'}
          </button>

          <div className={styles.faqLink}>
            <FaQuestionCircle />
            <span>Залишилися питання? </span>
            <a href="/faq">Перейти до частых питань</a>
          </div>
        </div>
      </div>
    </div>
  );
}