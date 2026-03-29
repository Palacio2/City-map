import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaTimes, FaLock } from 'react-icons/fa';
import { useSubscription } from './SubscriptionContext'; 
import { subscriptionPlans } from './subscriptionPlans';
import Loader from '@components/loader/Loader';
import SeoMeta from '@components/seo/SeoMeta';

export default function Subscription() {
  const { subscription, isLoading } = useSubscription(); 
  const navigate = useNavigate();
  const { t } = useTranslation('db');
  
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
    <div className="min-h-[100vh] bg-body text-textMain py-[var(--spacing-xl)] px-[var(--spacing-md)] font-body">
      <SeoMeta 
        title={t('seo.subscription.title')} 
        description={t('seo.subscription.desc')} 
      />

      <div className="text-center mb-[var(--spacing-xl)] max-w-[800px] mx-auto">
        {/* Виправлено: використано text-accent замість проблемного градієнта */}
        <h1 className="font-heading text-[2.5rem] text-accent mb-[var(--spacing-sm)] inline-block font-bold">
          {t('subscription.title')}
        </h1>
        <p className="text-textSecondary text-[1.1rem] leading-[1.6]">
          {t('subscription.subtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-[var(--spacing-lg)] items-center max-w-[1000px] mx-auto w-full">
        
        {/* Перемикач планів */}
        <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-[var(--spacing-md)] w-full p-0 sm:p-[var(--spacing-sm)] bg-transparent sm:bg-surface border-none sm:border sm:border-borderClient rounded-none sm:rounded-[var(--radius-lg)] shadow-none sm:shadow-sm overflow-x-auto sm:overflow-visible pb-2.5 sm:pb-[var(--spacing-sm)] snap-x snap-mandatory sm:snap-none custom-scrollbar">
          {Object.keys(subscriptionPlans).map((key) => {
            const PlanIcon = subscriptionPlans[key].icon;
            const isActive = selectedPlan === key;
            return (
              <button
                key={key}
                className={`relative flex flex-col items-center justify-center py-5 px-4 rounded-[var(--radius-md)] cursor-pointer transition-all min-h-[100px] shrink-0 snap-center min-w-[140px] sm:min-w-0 sm:w-full border ${
                  isActive 
                    ? 'bg-surface sm:bg-body border-accent text-textMain shadow-sm' 
                    : 'bg-surface sm:bg-transparent border-borderClient sm:border-transparent text-textSecondary hover:bg-hover hover:text-textMain shadow-sm sm:shadow-none'
                }`}
                onClick={() => setSelectedPlan(key)}
              >
                <div className="flex flex-col items-center gap-[10px] w-full z-10">
                    <PlanIcon className={`w-6 h-6 transition-all ${isActive ? 'text-accent scale-110' : ''}`} />
                    <span className="font-heading font-semibold text-[0.9rem] text-center tracking-[0.02em]">
                      {t(`subscription.plans.${key}.name`)}
                    </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Картка плану */}
        <div className="w-full max-w-[600px] bg-surface border border-borderClient rounded-[var(--radius-lg)] p-8 sm:px-[2.5rem] sm:py-[3rem] shadow-card transition-all hover:border-accent hover:shadow-hover animate-fadeIn mx-auto">
          
          <div className="text-center mb-[2.5rem] pb-[2rem] border-b border-borderClient">
            <div className="w-[72px] h-[72px] bg-[rgba(197,164,126,0.1)] border border-[rgba(197,164,126,0.2)] rounded-full flex items-center justify-center mx-auto mb-[1.5rem] text-accent text-[32px]">
              <IconComponent />
            </div>
            <h2 className="font-heading text-[2rem] text-textMain mb-[0.5rem] font-bold">
              {t(`subscription.plans.${selectedPlan}.name`)}
            </h2>
            <div className="font-body text-[1.5rem] font-bold text-accent">
                {isThisPlanActive ? t('subscription.buttons.active') : t(`subscription.plans.${selectedPlan}.price`)}
            </div>
          </div>
          
          <div className="mb-[2rem]">
            <h3 className="font-heading text-textMain mb-[1rem] text-[1.1rem] text-center font-semibold uppercase tracking-[0.05em]">
              {t('subscription.included_title')}
            </h3>
            <div className="flex flex-col gap-[0.8rem]">
                {currentPlanConfig.features.map((featureKey) => (
                <div key={featureKey} className="flex items-start gap-[12px] text-textMain text-[0.95rem] leading-[1.5]">
                    <FaCheck className="text-success min-w-[16px] mt-1" /> 
                    <span>{t(`subscription.features.${featureKey}`)}</span>
                </div>
                ))}
            </div>
          </div>

          {currentPlanConfig.disabledFeatures?.length > 0 && (
            <div className="opacity-60 pt-[1.5rem] border-t border-dashed border-borderClient mb-[2rem]">
              <h3 className="font-heading text-textMain mb-[1rem] text-[1.1rem] text-center font-semibold uppercase tracking-[0.05em]">
                {t('subscription.disabled_title')}
              </h3>
              <div className="flex flex-col gap-[0.8rem]">
                  {currentPlanConfig.disabledFeatures.map((featureKey) => (
                    <div key={featureKey} className="flex items-start gap-[12px] text-textSecondary text-[0.9rem]">
                        <FaTimes className="text-danger min-w-[16px] mt-1" /> 
                        <span>{t(`subscription.features.${featureKey}`)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Виправлено: bg-accent замість проблемного bg-[image:...] */}
          <button 
            className="w-full p-[1.2rem] bg-accent text-white border border-transparent rounded-[var(--radius-sm)] font-heading text-[1rem] font-semibold tracking-[0.05em] uppercase cursor-pointer transition-all mt-[1rem] shadow-sm hover:not(:disabled):-translate-y-[2px] hover:not(:disabled):shadow-hover hover:not(:disabled):brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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
              <p className="mt-[1.5rem] text-warning text-[0.9rem] flex items-center justify-center gap-[8px] p-[0.8rem] bg-[rgba(234,179,8,0.1)] rounded-[var(--radius-sm)]">
                 <FaLock /> {t('subscription.wait_expire')}
              </p>
          )}
        </div>
      </div>
    </div>
  );
}