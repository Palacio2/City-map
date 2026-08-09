import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheck, FaTimes, FaLock } from 'react-icons/fa';
import { subscriptionPlans } from '../config/subscriptionPlans';

interface PlanDetailsCardProps {
  readonly selectedPlan: string;
  readonly isThisPlanActive: boolean;
  readonly hasActivePaidSubscription: boolean;
  readonly onPlanSelection: () => void;
}

export const PlanDetailsCard = memo(({
  selectedPlan,
  isThisPlanActive,
  hasActivePaidSubscription,
  onPlanSelection
}: PlanDetailsCardProps) => {
  const { t } = useTranslation('db');
  
  const currentPlanConfig = subscriptionPlans[selectedPlan] || subscriptionPlans['premium'];
  const IconComponent = currentPlanConfig.icon;

  return (
    <div className="w-full max-w-[600px] bg-surface border border-borderClient rounded-lg p-8 sm:px-10 sm:py-12 shadow-card transition-all hover:border-accent hover:shadow-hover animate-fadeIn mx-auto">
      <div className="text-center mb-10 pb-8 border-b border-borderClient">
        <div className="w-[72px] h-[72px] bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 text-accent text-[32px]">
          <IconComponent />
        </div>
        <h2 className="font-heading text-3xl text-textMain mb-2 font-bold">
          {t(`subscription.plans.${selectedPlan}.name`)}
        </h2>
        <div className="font-body text-2xl font-bold text-accent">
          {isThisPlanActive ? t('subscription.actions.active') : t(`subscription.plans.${selectedPlan}.price`)}
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="font-heading text-textMain mb-4 text-[1.1rem] text-center font-semibold uppercase tracking-wide">
          {t('subscription.labels.included')}
        </h3>
        <div className="flex flex-col gap-3">
          {currentPlanConfig.features.map((featureKey) => (
            <div key={featureKey} className="flex items-start gap-3 text-textMain text-[0.95rem] leading-relaxed">
              <FaCheck className="text-success min-w-[16px] mt-1" />
              <span>{t(`subscription.features.${featureKey}`)}</span>
            </div>
          ))}
        </div>
      </div>
      
      {(currentPlanConfig.disabledFeatures?.length ?? 0) > 0 && (
        <div className="opacity-60 pt-6 border-t border-dashed border-borderClient mb-8">
          <h3 className="font-heading text-textMain mb-4 text-[1.1rem] text-center font-semibold uppercase tracking-wide">
            {t('subscription.labels.disabled')}
          </h3>
          <div className="flex flex-col gap-3">
            {currentPlanConfig.disabledFeatures.map((featureKey) => (
              <div key={featureKey} className="flex items-start gap-3 text-textSecondary text-[0.9rem]">
                <FaTimes className="text-danger min-w-[16px] mt-1" />
                <span>{t(`subscription.features.${featureKey}`)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button
        type="button"
        className="w-full p-5 bg-accent text-white border border-transparent rounded-md font-heading text-base font-semibold tracking-wide uppercase cursor-pointer transition-all mt-4 shadow-sm hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-hover hover:not(:disabled):brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        onClick={onPlanSelection}
        disabled={hasActivePaidSubscription || (selectedPlan === 'free' && !isThisPlanActive)}
      >
        {isThisPlanActive
          ? t('subscription.actions.active')
          : hasActivePaidSubscription
            ? t('subscription.actions.has_active_sub')
            : selectedPlan === 'free'
              ? t('subscription.actions.stay_free')
              : t('subscription.actions.choose', { plan: t(`subscription.plans.${selectedPlan}.name`) })}
      </button>
      
      {hasActivePaidSubscription && !isThisPlanActive && (
        <p className="mt-6 text-warning text-[0.9rem] flex items-center justify-center gap-2 p-3 bg-warning/10 rounded-md">
          <FaLock /> {t('subscription.status.wait_expire')}
        </p>
      )}
    </div>
  );
});

PlanDetailsCard.displayName = 'PlanDetailsCard';