import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { useBillingHistory } from '@hooks/useBillingHistory';
import SubscriptionCard from './SubscriptionCard';
import BillingTable from './BillingTable';
import CancelModal from './CancelModal';
import styles from './BillingHistoryPage.module.css';

export default function BillingHistoryPage() {
  const {
    history, totalCount, isLoading, currentPage, 
    showCancelModal, cancellationError, isCancelling,
    subscription, isSubLoading, expandedItems,
    dateFormatter, confirmCancellation, toggleModal, toggleRow, setPage, t
  } = useBillingHistory();

  const totalPages = Math.ceil(totalCount / 5);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/profile" className={styles.backButton}>
          <FaArrowLeft /> <span>{t('profile:actions.back_to_profile')}</span>
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{t('billing:page_title')}</h1>
          <p className={styles.subtitle}>{t('billing:page_subtitle')}</p>
        </div>
      </header>
      
      <main className={styles.content}>
        <div className={styles.billingGrid}>
          <SubscriptionCard 
            subscription={subscription}
            isLoading={isSubLoading}
            onManage={() => toggleModal(true)}
            isCancelling={isCancelling}
            error={cancellationError}
            dateFormatter={dateFormatter}
            t={t}
          />

          <section className={styles.historySection}>
            <div className={styles.tableHeaderWrapper}>
                <h3 className={styles.cardTitle}>{t('billing:history_title')}</h3>
                <div className={styles.summaryBadge}>
                    <FaCheckCircle /> {totalCount} {t('billing:transactions')}
                </div>
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.gridHeader}>
                  <span>{t('billing:table.date')}</span>
                  <span>{t('billing:table.plan')}</span>
                  <span>{t('billing:table.amount')}</span>
                  <span>{t('billing:table.status')}</span>
                  <span className={styles.alignRight}>{t('billing:table.invoice')}</span>
                </div>
                
                <BillingTable 
                  history={history}
                  isLoading={isLoading}
                  expandedItems={expandedItems}
                  onToggleRow={toggleRow}
                  dateFormatter={dateFormatter}
                  t={t}
                />
            </div>
            
            {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                      className={styles.pageBtn}
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                  >
                      {t('billing:actions.prev')}
                  </button>
                  <span className={styles.pageInfo}>
                      {currentPage} / {totalPages}
                  </span>
                  <button
                      className={styles.pageBtn}
                      disabled={currentPage === totalPages}
                      onClick={() => setPage(currentPage + 1)}
                  >
                      {t('billing:actions.next')}
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
          t={t}
        />
      )}
    </div>
  );
}