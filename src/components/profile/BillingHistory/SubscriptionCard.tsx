import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaArrowUp, FaTimes } from 'react-icons/fa';

interface SubscriptionCardProps {
  subscription: any; 
  onManage: () => void;
  isCancelling: boolean;
  error?: string | null;
  dateFormatter: Intl.DateTimeFormat;
}

export default function SubscriptionCard({ subscription, onManage, isCancelling, error, dateFormatter }: SubscriptionCardProps) {
  const { t } = useTranslation('db');

  if (!subscription) return null;

  const actualPlanKey = (subscription?.isExpired || !subscription?.plan) ? 'free' : subscription.plan;
  const isActive = subscription?.status === 'active' && actualPlanKey !== 'free';
  
  const planName = t(`billing.plans.${actualPlanKey}.name`);
  const amount = t(`billing.plans.${actualPlanKey}.price`);
  
  const expiresAt = (isActive && subscription?.expiresAt) 
    ? dateFormatter.format(new Date(subscription.expiresAt))
    : null;

  return (
    <section className="bg-surface border border-borderClient rounded-2xl p-6 md:p-8 shadow-card flex flex-col gap-6 lg:sticky lg:top-[calc(var(--header-height)+20px)]">
      
      <div className="flex justify-between items-center border-b border-borderClient pb-4">
          <h3 className="font-heading text-xl m-0 text-textMain font-bold">{t('billing.current_sub')}</h3>
          <span className={`text-[0.7rem] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${isActive ? 'bg-success/10 text-success border border-success/20' : 'bg-hover text-textSecondary border border-borderClient'}`}>
              {isActive 
                ? t('billing.status_map.active') 
                : t('billing.plans.free.name')}
          </span>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-baseline border-b border-dashed border-borderClient/30 pb-2">
            <span className="text-textSecondary text-[0.9rem] font-medium">{t('billing.plan_label')}</span>
            <span className="text-textMain font-semibold font-heading text-[1.1rem]">{planName}</span>
        </div>
        
        <div className="flex justify-between items-baseline border-b border-dashed border-borderClient/30 pb-2">
            <span className="text-textSecondary text-[0.9rem] font-medium">{t('billing.price_label')}</span>
            <span className="text-accent font-bold font-heading text-[1.1rem]">{amount}</span>
        </div>
        
        {isActive && expiresAt && (
            <div className="flex justify-between items-baseline border-b border-dashed border-borderClient/30 pb-2">
                <span className="text-textSecondary text-[0.9rem] font-medium">{t('billing.next_payment')}</span>
                <span className="text-textMain font-semibold font-heading text-[1.1rem]">{expiresAt}</span>
            </div>
        )}
      </div>

      {error && (
          <div className="text-[0.85rem] text-danger bg-danger/10 p-3 rounded-lg flex items-center gap-2 border border-danger/20">
              <FaExclamationTriangle className="shrink-0" /> 
              <span>{error}</span>
          </div>
      )}

      <button 
        className={`w-full p-4 rounded-xl font-heading font-bold uppercase tracking-widest cursor-pointer transition-all duration-300 mt-2 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed ${
          isActive 
            ? 'bg-danger/5 border border-danger/40 text-danger shadow-sm hover:bg-danger hover:text-white hover:border-danger hover:-translate-y-1 hover:shadow-md disabled:hover:bg-danger/5 disabled:hover:text-danger disabled:hover:border-danger/40 disabled:hover:-translate-y-0 disabled:hover:shadow-sm' 
            : 'bg-gradient-to-br from-accent to-accent-hover text-white shadow-md border border-transparent hover:-translate-y-1 hover:shadow-lg hover:brightness-110 disabled:hover:-translate-y-0 disabled:hover:shadow-md disabled:hover:brightness-100 custom-pulse-shadow'
        }`} 
        onClick={onManage}
        disabled={isCancelling}
      >
        {isCancelling ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        ) : (
          isActive ? (
            <><FaTimes className="text-lg" /> {t('billing.cancel_sub')}</>
          ) : (
            <><FaArrowUp className="text-lg" /> {t('billing.update_plan')}</>
          )
        )}
      </button>

      <style>{`
        @keyframes pulse-shadow-anim {
          0% { box-shadow: 0 0 0 0 rgba(197, 164, 126, 0.6); }
          70% { box-shadow: 0 0 0 12px rgba(197, 164, 126, 0); }
          100% { box-shadow: 0 0 0 0 rgba(197, 164, 126, 0); }
        }
        .custom-pulse-shadow:not(:disabled) {
          animation: pulse-shadow-anim 2s infinite;
        }
        .custom-pulse-shadow:hover {
          animation: none;
        }
      `}</style>
    </section>
  );
}