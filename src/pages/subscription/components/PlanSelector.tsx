import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { subscriptionPlans } from '../config/subscriptionPlans';

interface PlanSelectorProps {
  readonly selectedPlan: string;
  readonly onSelectPlan: (plan: string) => void;
}

export const PlanSelector = memo(({ selectedPlan, onSelectPlan }: PlanSelectorProps) => {
  const { t } = useTranslation('db');

  return (
    <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full p-0 sm:p-2 bg-transparent sm:bg-surface border-none sm:border sm:border-borderClient rounded-none sm:rounded-lg shadow-none sm:shadow-sm overflow-x-auto sm:overflow-visible pb-2.5 sm:pb-2 snap-x snap-mandatory sm:snap-none custom-scrollbar">
      {Object.keys(subscriptionPlans).map((key) => {
        const PlanIcon = subscriptionPlans[key].icon;
        const isActive = selectedPlan === key;
        
        return (
          <button
            key={key}
            type="button"
            className={`relative flex flex-col items-center justify-center py-5 px-4 rounded-md cursor-pointer transition-all min-h-[100px] shrink-0 snap-center min-w-[140px] sm:min-w-0 sm:w-full border ${isActive ? 'bg-surface sm:bg-body border-accent text-textMain shadow-sm' : 'bg-surface sm:bg-transparent border-borderClient sm:border-transparent text-textSecondary hover:bg-hover hover:text-textMain shadow-sm sm:shadow-none'}`}
            onClick={() => onSelectPlan(key)}
          >
            <div className="flex flex-col items-center gap-2.5 w-full z-10">
              <PlanIcon className={`w-6 h-6 transition-all ${isActive ? 'text-accent scale-110' : ''}`} />
              <span className="font-heading font-semibold text-[0.9rem] text-center tracking-wide">
                {t(`subscription.plans.${key}.name`)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
});

PlanSelector.displayName = 'PlanSelector';