import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { useBillingHistory } from '@hooks/useBillingHistory';
import SubscriptionCard from './SubscriptionCard';
import BillingTable from './BillingTable';
import CancelModal from './CancelModal';
import styles from './BillingHistoryPage.module.css';

export default function BillingHistoryPage() {
  const { t } = useTranslation('billing');
  const {
    history, totalCount, currentPage, 
    showCancelModal, cancellationError, isCancelling,
    subscription, expandedItems,
    dateFormatter, confirmCancellation, toggleModal, toggleRow, setPage
  } = useBillingHistory();

  const totalPages = Math.ceil(totalCount / 5);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/profile" className={styles.backButton}>
          <FaArrowLeft /> <span>{t('back_to_profile')}</span>
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{t('page_title')}</h1>
          <p className={styles.subtitle}>{t('page_subtitle')}</p>
        </div>
      </header>
      
      <main className={styles.content}>
        <div className={styles.billingGrid}>
          <SubscriptionCard 
            subscription={subscription}
            onManage={() => toggleModal(true)}
            isCancelling={isCancelling}
            error={cancellationError}
            dateFormatter={dateFormatter}
          />

          <section className={styles.historySection}>
            <div className={styles.tableHeaderWrapper}>
                <h3 className={styles.cardTitle}>{t('history_title')}</h3>
                <div className={styles.summaryBadge}>
                    <FaCheckCircle /> {totalCount} {t('transactions')}
                </div>
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.gridHeader}>
                  <span>{t('table.date')}</span>
                  <span>{t('table.plan')}</span>
                  <span>{t('table.amount')}</span>
                  <span>{t('table.status')}</span>
                  <span className={styles.alignRight}>{t('table.invoice')}</span>
                </div>
                
                <BillingTable 
                  history={history}
                  expandedItems={expandedItems}
                  onToggleRow={toggleRow}
                  dateFormatter={dateFormatter}
                />
            </div>
            
            {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                      className={styles.pageBtn}
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                  >
                      {t('actions.prev')}
                  </button>
                  <span className={styles.pageInfo}>
                      {currentPage} / {totalPages}
                  </span>
                  <button
                      className={styles.pageBtn}
                      disabled={currentPage === totalPages}
                      onClick={() => setPage(currentPage + 1)}
                  >
                      {t('actions.next')}
                  </button>
                </div>
            )}
          </section>
        </div>
      </main>
      
      {showCancelModal && (
        <CancelModal 
          onClose={() => toggleModal(false)}
          onConfirm={confirmCancellation}
          isProcessing={isCancelling}
          error={cancellationError}
        />
      )}
    </div>
  );
}