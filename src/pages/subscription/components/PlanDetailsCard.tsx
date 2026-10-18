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
    <div className="ui-glass-panel w-full max-w-2xl p-6 sm:p-10 md:p-14 relative overflow-hidden group transition-all duration-500 hover:shadow-hover hover:border-accent/50">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="text-center mb-8 sm:mb-12 pb-8 border-b border-borderClient relative z-10">
        <div className="w-[72px] h-[72px] sm:w-[90px] sm:h-[90px] bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 text-accent text-3xl sm:text-4xl shadow-xs">
          <IconComponent />
        </div>
        <h2 className="ui-heading-1 !text-3xl sm:!text-4xl !mb-3">
          {t(`subscription.plans.${selectedPlan}.name`)}
        </h2>
        <div className="font-body text-2xl sm:text-3xl font-black text-accent">
          {isThisPlanActive ? t('subscription.actions.active') : t(`subscription.plans.${selectedPlan}.price`)}
        </div>
      </div>
      
      <div className="mb-8 relative z-10">
        <h3 className="ui-heading-2 !text-lg text-center uppercase tracking-widest text-textSecondary opacity-80 !mb-6">
          {t('subscription.labels.included')}
        </h3>
        <div className="flex flex-col gap-4 sm:gap-5">
          {currentPlanConfig.features.map((featureKey) => (
            <div key={featureKey} className="flex items-start gap-4">
              <div className="mt-1 shrink-0 w-6 h-6 rounded-full bg-success/15 flex items-center justify-center">
                <FaCheck className="text-success text-[12px]" />
              </div>
              <span className="ui-text-body !mb-0">{t(`subscription.features.${featureKey}`)}</span>
            </div>
          ))}
        </div>
      </div>
      
      {(currentPlanConfig.disabledFeatures?.length ?? 0) > 0 && (
        <div className="pt-8 border-t border-dashed border-borderClient mb-10 relative z-10 opacity-70">
          <h3 className="ui-heading-2 !text-lg text-center uppercase tracking-widest text-textSecondary !mb-6">
            {t('subscription.labels.disabled')}
          </h3>
          <div className="flex flex-col gap-4 sm:gap-5">
            {currentPlanConfig.disabledFeatures.map((featureKey) => (
              <div key={featureKey} className="flex items-start gap-4">
                <div className="mt-1 shrink-0 w-6 h-6 rounded-full bg-danger/10 flex items-center justify-center">
                  <FaTimes className="text-danger text-[12px]" />
                </div>
                <span className="ui-text-body !mb-0 line-through opacity-80">{t(`subscription.features.${featureKey}`)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button
        type="button"
        className="ui-button-primary w-full shadow-md hover:shadow-lg relative z-10 !py-4 sm:!py-5"
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
        <p className="mt-6 text-warning text-sm sm:text-base flex items-center justify-center gap-2 p-4 bg-warning/10 border border-warning/20 rounded-xl relative z-10">
          <FaLock /> {t('subscription.status.wait_expire')}
        </p>
      )}
    </div>
  );
});

PlanDetailsCard.displayName = 'PlanDetailsCard';