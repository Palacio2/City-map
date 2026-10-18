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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 w-full px-2 sm:px-0">
      {Object.keys(subscriptionPlans).map((key) => {
        const PlanIcon = subscriptionPlans[key].icon;
        const isActive = selectedPlan === key;
        
        return (
          <button
            key={key}
            type="button"
            className={`ui-glass-panel relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl cursor-pointer transition-all duration-300 min-h-[110px] sm:min-h-[140px] group overflow-hidden ${
              isActive 
                ? 'border-accent shadow-md scale-100 sm:scale-105 bg-accent/5' 
                : 'hover:border-accent/40 hover:shadow-xs scale-100 hover:scale-[1.02]'
            }`}
            onClick={() => onSelectPlan(key)}
          >
            {isActive && <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent pointer-events-none" />}
            <div className="flex flex-col items-center gap-3 sm:gap-4 w-full relative z-10">
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xs transition-all duration-300 ${isActive ? 'bg-accent text-white' : 'bg-surface border border-borderClient text-textSecondary group-hover:text-accent group-hover:border-accent/30'}`}>
                <PlanIcon className="text-xl sm:text-2xl" />
              </div>
              <span className={`font-heading font-bold text-[0.85rem] sm:text-[1.1rem] text-center tracking-wide transition-colors ${isActive ? 'text-accent' : 'text-textMain'}`}>
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