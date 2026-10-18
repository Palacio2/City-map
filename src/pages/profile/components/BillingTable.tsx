import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { formatBillingAmount } from '../utils/billingAmount';
import type { BillingTableProps } from '../types';

export const BillingTable = ({ history }: BillingTableProps) => {
  const { t, i18n } = useTranslation('db');

  if (!history || history.length === 0) {
    return <div className="p-16 text-center text-textSecondary text-base font-medium">{t('billing.no_history')}</div>;
  }

  return (
    <div className="flex flex-col sm:gap-0 gap-3 p-2 sm:p-0">
      {history.map((item) => {
        const planKey = item.plan_name === 'pro' ? 'premium' : item.plan_name;
        const planName = planKey ? t(`billing.plans.${planKey}.name`) : (item.invoice_number || item.id);
        const isScheduledForCancel = item.cancel_at && new Date(item.cancel_at) > new Date();
        const dateStr = new Date(item.created_at).toLocaleDateString();
        const amountStr = formatBillingAmount(item.amount_minor, item.currency, i18n.resolvedLanguage);
        const safeStatus = item.status || 'unknown';
        const statusLower = safeStatus.toLowerCase();
        
        let statusClass = 'text-textSecondary bg-hover border border-borderClient';
        let StatusIcon = FaCheckCircle;
        
        if (['paid', 'active'].includes(statusLower)) {
          statusClass = 'text-success bg-success/10 border border-success/20';
        } else if (['cancelled', 'canceled', 'incomplete_expired', 'incomplete', 'unpaid', 'past_due'].includes(statusLower)) {
          statusClass = 'text-danger bg-danger/10 border border-danger/20';
          StatusIcon = FaTimesCircle;
        }
        
        const statusText = statusLower === 'paid' ? t('payment.success.status_ok') : isScheduledForCancel
          ? t('billing.ending_soon')
          : t(`billing.status_map.${statusLower}`);
          

        return (
          <div
            key={item.id}
            className="flex flex-col sm:grid sm:grid-cols-[1fr_1fr_1fr_1fr] p-3 sm:px-5 sm:py-3 sm:items-center sm:border-b sm:border-borderClient sm:bg-transparent sm:hover:bg-black/[0.02] sm:dark:hover:bg-white/[0.02] sm:rounded-none sm:border-x-0 sm:border-t-0 sm:shadow-none sm:last:border-b-0 rounded-2xl border border-black/5 dark:border-white/10 bg-surface shadow-subtle relative transition-all duration-300"
          >
            {/* MOBILE LAYOUT (hidden on sm) */}
            <div className="flex flex-col gap-2 sm:hidden">
              <div className="flex justify-between items-center pb-2 border-b border-black/5 dark:border-white/5">
                <span className="text-[0.85rem] font-bold text-textMain">{planName}</span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[0.6rem] font-bold uppercase tracking-widest ${statusClass}`}>
                  <StatusIcon size={10} />
                  {statusText}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-1">
                <div className="flex flex-col">
                  <span className="text-[0.6rem] text-textSecondary font-bold uppercase tracking-widest mb-0.5">{t('billing.table.date')}</span>
                  <span className="text-[0.8rem] font-medium text-textMain">{dateStr}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[0.6rem] text-textSecondary font-bold uppercase tracking-widest mb-0.5">{t('billing.table.amount')}</span>
                  <span className="text-[0.9rem] font-bold text-textMain">{amountStr}</span>
                </div>
              </div>
            </div>

            {/* DESKTOP LAYOUT (hidden below sm) */}
            <div className="hidden sm:contents">
              <div className="text-[0.8rem] font-medium text-textSecondary font-sans">
                {dateStr}
              </div>
              <div className="text-[0.85rem] font-bold text-textMain font-sans flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${['paid', 'active'].includes(statusLower) ? 'bg-success' : 'bg-danger'}`} />
                {planName}
              </div>
              <div className="font-bold text-textMain font-sans text-[0.85rem]">
                {amountStr}
              </div>
              <div className="font-sans flex justify-end">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[0.65rem] font-bold uppercase tracking-widest ${statusClass}`}>
                  {statusText}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
