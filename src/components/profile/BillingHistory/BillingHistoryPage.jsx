import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { useBillingHistory } from '@hooks/useBillingHistory';
import SubscriptionCard from './SubscriptionCard';
import BillingTable from './BillingTable';
import CancelModal from './CancelModal';

export default function BillingHistoryPage() {
  const { t } = useTranslation('db');
  const {
    history, totalCount, currentPage, 
    showCancelModal, cancellationError, isCancelling,
    subscription, expandedItems,
    dateFormatter, confirmCancellation, toggleModal, toggleRow, setPage
  } = useBillingHistory();

  const totalPages = Math.ceil(totalCount / 5);

  return (
    <div className="min-h-[100dvh] bg-body text-textMain py-8 px-4 md:px-8 font-body animate-fadeIn">
      <header className="max-w-[1200px] mx-auto mb-10 flex flex-col gap-4">
        <Link to="/profile" className="inline-flex items-center gap-2 text-textSecondary font-heading font-semibold text-[0.85rem] tracking-widest uppercase transition-all w-fit hover:text-accent hover:-translate-x-1 decoration-none">
          <FaArrowLeft /> <span>{t('billing.back_to_profile')}</span>
        </Link>
        <div className="mt-2">
          <h1 className="font-heading text-3xl md:text-[2.5rem] font-bold text-accent mb-2 inline-block">
            {t('billing.page_title')}
          </h1>
          <p className="text-textSecondary text-base max-w-[600px] leading-relaxed">
            {t('billing.page_subtitle')}
          </p>
        </div>
      </header>
      
      <main className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-8 items-start">
          
          <SubscriptionCard 
            subscription={subscription}
            onManage={() => toggleModal(true)}
            isCancelling={isCancelling}
            error={cancellationError}
            dateFormatter={dateFormatter}
          />

          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-center mb-1">
                <h3 className="font-heading text-xl m-0 text-textMain font-bold">{t('billing.history_title')}</h3>
                <div className="text-[0.85rem] text-textSecondary flex items-center gap-1.5 bg-surface px-3 py-1 rounded-full border border-borderClient font-medium">
                    <FaCheckCircle className="text-success" /> {totalCount} {t('billing.transactions')}
                </div>
            </div>

            <div className="bg-surface rounded-xl border border-borderClient overflow-hidden shadow-sm">
<div className="hidden sm:grid grid-cols-[1.2fr_1.5fr_0.8fr_1.2fr_1fr] px-6 py-5 bg-black/5 border-b border-borderClient border-l-4 border-transparent font-heading font-bold text-[0.75rem] uppercase tracking-widest text-textSecondary">                  <span>{t('billing.table.date')}</span>
                  <span>{t('billing.table.plan')}</span>
                  <span>{t('billing.table.amount')}</span>
                  <span>{t('billing.table.status')}</span>
                  <span className="text-right">{t('billing.table.invoice')}</span>
                </div>
                
                <BillingTable 
                  history={history}
                  expandedItems={expandedItems}
                  onToggleRow={toggleRow}
                  dateFormatter={dateFormatter}
                />
            </div>
            
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-4">
                  <button
                      className="bg-surface border border-borderClient text-textMain px-4 py-2 rounded-lg font-heading text-sm font-bold uppercase transition-all cursor-pointer hover:not(:disabled):border-accent hover:not(:disabled):text-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                  >
                      {t('billing.actions.prev')}
                  </button>
                  <span className="font-heading text-[0.95rem] font-bold text-textSecondary bg-body px-4 py-1.5 rounded-lg border border-borderClient">
                      {currentPage} / {totalPages}
                  </span>
                  <button
                      className="bg-surface border border-borderClient text-textMain px-4 py-2 rounded-lg font-heading text-sm font-bold uppercase transition-all cursor-pointer hover:not(:disabled):border-accent hover:not(:disabled):text-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={currentPage === totalPages}
                      onClick={() => setPage(currentPage + 1)}
                  >
                      {t('billing.actions.next')}
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