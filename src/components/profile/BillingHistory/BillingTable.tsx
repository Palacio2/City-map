import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaTimesCircle, FaChevronDown, FaFileInvoiceDollar } from 'react-icons/fa';

export interface BillingItem {
  id: string;
  plan_name?: string;
  cancel_at?: string;
  created_at: string | Date;
  amount: number | string;
  payment_id?: string;
  status?: string;
}

interface BillingTableProps {
  history: BillingItem[];
  expandedItems: Record<string, boolean>;
  onToggleRow: (id: string) => void;
  dateFormatter: Intl.DateTimeFormat;
}

export default function BillingTable({ history, expandedItems, onToggleRow, dateFormatter }: BillingTableProps) {
  const { t } = useTranslation('db');

  if (!history || history.length === 0) {
    return <div className="p-16 text-center text-textSecondary text-base font-medium">{t('billing.no_history')}</div>;
  }

  return (
    <div className="flex flex-col sm:gap-0 gap-4 p-4 sm:p-0">
      {history.map((item) => {
        const planKey = item.plan_name === 'pro' ? 'premium' : (item.plan_name || 'free');
        const planName = t(`billing.plans.${planKey}.name`, { defaultValue: planKey });
        
        const isScheduledForCancel = item.cancel_at && new Date(item.cancel_at) > new Date();
        const dateStr = dateFormatter.format(new Date(item.created_at));
        const amountStr = `€${item.amount}`;
        const invoiceId = item.payment_id ? item.payment_id.replace(/^(TX_|SUB_)/, '').slice(-8).toUpperCase() : '---';

        const safeStatus = item.status || 'unknown';
        const statusLower = safeStatus.toLowerCase();
        
        let statusClass = 'text-textSecondary bg-hover border border-borderClient';
        let rowBorderClass = 'border-l-4 border-l-textSecondary'; 
        let StatusIcon = FaCheckCircle;

        if (statusLower === 'active') {
          statusClass = 'text-success bg-success/10 border border-success/20';
          rowBorderClass = 'border-l-4 border-l-success';
        } else if (['cancelled', 'canceled', 'incomplete_expired', 'incomplete', 'unpaid', 'past_due'].includes(statusLower)) {
          statusClass = 'text-danger bg-danger/10 border border-danger/20';
          StatusIcon = FaTimesCircle;
          rowBorderClass = 'border-l-4 border-l-danger';
        }

        const statusText = isScheduledForCancel 
          ? t('billing.ending_soon') 
          : t(`billing.status_map.${statusLower}`, { defaultValue: safeStatus.replace(/_/g, ' ') });
        
        const isExpanded = !!expandedItems[item.id];

        return (
          <div 
            key={item.id} 
            className={`sm:grid sm:grid-cols-[1.2fr_1.5fr_0.8fr_1.2fr_1fr] sm:px-6 sm:py-5 sm:items-center sm:border-b sm:border-borderClient sm:bg-surface sm:hover:bg-hover sm:cursor-default sm:border-l-0 sm:shadow-none sm:rounded-none sm:last:border-b-0 flex flex-wrap p-5 rounded-xl border border-borderClient bg-surface shadow-sm relative cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:-translate-y-0.5 active:shadow-md ${rowBorderClass} ${isExpanded ? 'shadow-md -translate-y-0.5' : ''}`}
            onClick={() => {
              if (window.innerWidth <= 640) onToggleRow(item.id);
            }}
          >
            <div className="w-[60%] sm:w-auto text-base sm:text-[0.95rem] font-semibold text-textMain font-mono flex items-center gap-3 sm:gap-0 order-1 sm:order-none mb-1 sm:mb-0">
              <span className="sm:hidden text-xs text-textSecondary font-bold uppercase tracking-widest font-sans">{t('billing.table.date')}</span>
              <span>{dateStr}</span>
            </div>

            <div className={`text-textSecondary font-semibold ${isExpanded ? 'flex justify-between items-center w-full py-3 mt-3 border-t border-dashed border-borderClient order-3' : 'hidden sm:block'} sm:order-none`}>
              <span className="sm:hidden text-[0.8rem] text-textSecondary font-bold uppercase tracking-widest">{t('billing.table.plan')}</span>
              <span className="text-textMain font-bold sm:font-semibold">{planName}</span>
            </div>

           <div className="w-[40%] sm:w-auto flex justify-end sm:justify-start items-center gap-2.5 font-bold text-textMain font-heading tracking-tight order-2 sm:order-none mb-1 sm:mb-0">
              <span className="sm:hidden text-[0.8rem] text-textSecondary font-bold uppercase tracking-widest font-sans">{t('billing.table.amount')}</span>
              <span className="text-lg sm:text-[0.95rem]">{amountStr}</span>
              <span className={`sm:hidden inline-flex text-accent text-[0.9rem] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                <FaChevronDown />
              </span>
            </div>

            <div className={`flex items-center ${isExpanded ? 'flex justify-between w-full py-3 border-t border-dashed border-borderClient order-4' : 'hidden sm:flex'} sm:order-none`}>
              <span className="sm:hidden text-[0.8rem] text-textSecondary font-bold uppercase tracking-widest">{t('billing.table.status')}</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.75rem] font-bold uppercase whitespace-nowrap tracking-widest ${statusClass}`}>
                <StatusIcon size={12} />
                {statusText}
              </span>
            </div>

            <div className={`flex justify-end ${isExpanded ? 'flex justify-center w-full mt-2 pt-2 border-none order-5' : 'hidden sm:flex'} sm:order-none`}>
              <button 
                className="font-mono text-[0.8rem] text-textSecondary bg-transparent px-3 py-1.5 sm:px-3 sm:py-1.5 rounded-md border border-borderClient flex items-center justify-center gap-2 font-bold cursor-pointer transition-all hover:border-accent hover:text-textMain hover:bg-hover hover:-translate-y-[1px] w-full sm:w-auto" 
                title={t('billing.download_invoice')} 
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <FaFileInvoiceDollar className="text-sm" />
                <span>{invoiceId}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}