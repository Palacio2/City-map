import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaChevronDown, FaChevronUp, FaFileInvoiceDollar } from 'react-icons/fa';
import styles from './BillingTable.module.css';

const BillingTable = ({ history, isLoading, expandedItems, onToggleRow, dateFormatter, t }) => {
  if (isLoading) {
    return <div className={styles.emptyState}>Loading...</div>;
  }

  if (history.length === 0) {
    return <div className={styles.emptyState}>{t('billing:no_history')}</div>;
  }

  return (
    <div className={styles.gridBody}>
      {history.map((item) => {
        const planKey = item.plan_name === 'pro' ? 'premium' : (item.plan_name || 'free');
        const planName = t(`subscription:subscription.plans.${planKey}.name`);
        const isScheduledForCancel = item.cancel_at && new Date(item.cancel_at) > new Date();
        const dateStr = dateFormatter.format(new Date(item.created_at));
        const amountStr = `€${item.amount}`;
        const invoiceId = item.payment_id ? item.payment_id.replace(/^(TX_|SUB_)/, '').slice(-8).toUpperCase() : '---';

        const statusLower = item.status.toLowerCase();
        let statusClass = styles.statusDefault;
        let rowBorderClass = styles.borderDefault; 
        let StatusIcon = FaCheckCircle;

        if (statusLower === 'active') {
          statusClass = styles.statusSuccess;
          rowBorderClass = styles.borderSuccess;
        } else if (['cancelled', 'canceled', 'incomplete_expired', 'incomplete', 'unpaid', 'past_due'].includes(statusLower)) {
          statusClass = styles.statusError;
          StatusIcon = FaTimesCircle;
          rowBorderClass = styles.borderError;
        }

        const statusTranslationKey = `billing:status_map.${statusLower}`;
        const translatedStatus = t(statusTranslationKey, { defaultValue: item.status.replace(/_/g, ' ') });
        const statusText = isScheduledForCancel ? t('billing:ending_soon') : translatedStatus;
        
        const isExpanded = !!expandedItems[item.id];

        return (
          <div 
            key={item.id} 
            className={`${styles.gridRow} ${isExpanded ? styles.isExpanded : ''} ${rowBorderClass}`}
            onClick={() => onToggleRow(item.id)}
          >
            <div className={styles.cellDate}>
              <span className={styles.mobileLabel}>{t('billing:table.date')}</span>
              <span className={styles.dateValue}>{dateStr}</span>
            </div>

            <div className={`${styles.cellPlan} ${styles.mobileHidden}`}>
              <span className={styles.mobileLabel}>{t('billing:table.plan')}</span>
              <span className={styles.valueText}>{planName}</span>
            </div>

            <div className={styles.cellAmount}>
              <span className={styles.mobileLabel}>{t('billing:table.amount')}</span>
              <span className={styles.amountText}>{amountStr}</span>
              <span className={styles.mobileToggleIcon}>
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              </span>
            </div>

            <div className={`${styles.cellStatus} ${styles.mobileHidden}`}>
              <span className={styles.mobileLabel}>{t('billing:table.status')}</span>
              <span className={`${styles.statusPill} ${statusClass}`}>
                <StatusIcon size={12} />
                {statusText}
              </span>
            </div>

            <div className={`${styles.cellInvoice} ${styles.mobileHidden}`}>
              <button 
                className={styles.invoiceTag} 
                title={t('billing:download_invoice')} 
                onClick={(e) => e.stopPropagation()}
              >
                <FaFileInvoiceDollar className={styles.invoiceIcon} />
                <span className={styles.invoiceText}>{invoiceId}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BillingTable;