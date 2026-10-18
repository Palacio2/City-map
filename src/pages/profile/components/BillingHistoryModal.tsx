import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import Loader from '@components/loader/Loader';
import { useBillingHistory } from '../hooks/useBillingHistory';
import { SubscriptionCard } from './SubscriptionCard';
import { BillingTable } from './BillingTable';
import { CancelModal } from './CancelModal';
import type { BillingHistoryModalProps } from '../types';

export const BillingHistoryModal = ({ isOpen, onClose }: BillingHistoryModalProps) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
    return () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current);
      closeTimer.current = null;
    };
  }, [isOpen]);

  const handleClose = () => {
    if (closeTimer.current !== null || isCancelling) return;
    toggleModal(false);
    setIsClosing(true);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      setIsClosing(false);
      onClose();
    }, 400); // Wait for slide-down animation
  };

  const {
    history,
    totalCount,
    currentPage,
    isLoading,
    isError,
    showCancelModal,
    cancellationError,
    isCancelling,
    subscription,
    expandedItems,
    confirmCancellation,
    selectSubscriptionForCancellation,
    toggleModal,
    toggleRow,
    setPage,
    t
  } = useBillingHistory(isOpen);

  useEffect(() => {
    if (!isOpen) toggleModal(false);
  }, [isOpen, toggleModal]);

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* The Modal Overlay */}
      <div className={`fixed inset-0 z-[1100] w-full flex flex-col sm:justify-center items-center ${isClosing ? 'animate-fade-out-custom' : 'animate-fadeIn'}`}>
        
        {/* Dark Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-xs z-0 cursor-pointer" 
          aria-label="Close modal" 
          onClick={handleClose}
        />

        {/* Bottom Sheet Card */}
        <div className={`w-full sm:max-w-[1000px] mt-auto sm:mt-0 bg-surface rounded-t-3xl sm:rounded-[2rem] px-4 py-5 sm:p-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] sm:shadow-card border-t sm:border border-border relative flex flex-col h-auto max-h-[92dvh] overflow-hidden z-10 ${isClosing ? 'animate-slide-down-sheet' : 'animate-slide-up-sheet'}`}>
          {/* Subtle gradient in the form header */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          
          {/* Header Row (Inside Card) */}
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 relative z-10 shrink-0 px-1 sm:px-0">
            <button 
              type="button"
              onClick={handleClose}
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-surface shadow-xs border border-border text-textSecondary hover:text-textMain hover:bg-hover transition-all cursor-pointer"
            >
              <FaArrowLeft />
            </button>
            <div className="flex flex-col">
              <div className="text-xl sm:text-2xl font-bold font-sans text-textMain m-0 tracking-tight truncate">
                {t('billing.page_title')}
              </div>
              <p className="text-textSecondary text-sm sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">
                {t('billing.page_subtitle')}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar px-1 sm:px-2 pb-2">
            <SubscriptionCard
              subscription={subscription}
              onManage={() => navigate('/subscription')}
              onCancel={selectSubscriptionForCancellation}
              isCancelling={isCancelling}
              error={cancellationError}
            />
            {isLoading ? (
              <div className="py-20 flex justify-center"><Loader /></div>
            ) : isError ? (
              <div className="mb-6 p-4 rounded-xl bg-danger/10 text-danger border border-danger/20 font-medium text-center">
                {t('billing.errors.load')}
              </div>
            ) : (
              <div className="mt-6">
                
                <section className="flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-sans text-lg sm:text-xl m-0 text-textMain font-bold tracking-tight">
                      {t('billing.history_title')}
                    </h3>
                    <div className="text-[0.75rem] text-textSecondary flex items-center gap-1.5 bg-black/5 dark:bg-black/20 px-2.5 py-1 rounded-full border border-transparent font-medium">
                      <FaCheckCircle className="text-success" /> {totalCount} {t('billing.transactions')}
                    </div>
                  </div>
                  
                  <div className="bg-surface rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-card sm:min-h-[340px] flex flex-col">
                    <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr] px-5 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5 font-sans font-bold text-[0.65rem] uppercase tracking-widest text-textSecondary shrink-0">
                      <span>{t('billing.table.date')}</span>
                      <span>{t('billing.table.plan')}</span>
                      <span>{t('billing.table.amount')}</span>
                      <span className="text-right">{t('billing.table.status')}</span>
                    </div>
                    
                    <div className="flex-1">
                      <BillingTable
                        history={history}
                        expandedItems={expandedItems}
                        onToggleRow={toggleRow}
                      />
                    </div>
                  </div>
                  
                  {Math.ceil(totalCount / 5) > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-4 shrink-0">
                      <button
                        type="button"
                        className="bg-surface border border-borderClient text-textMain px-3 py-1.5 rounded-md font-sans text-[0.7rem] font-bold uppercase transition-all cursor-pointer hover:not-disabled:border-primary hover:not-disabled:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        {t('billing.actions.prev')}
                      </button>
                      <span className="font-sans text-[0.85rem] font-bold text-textSecondary bg-black/5 dark:bg-black/20 px-3 py-1 rounded-md border border-transparent">
                        {currentPage} / {Math.ceil(totalCount / 5)}
                      </span>
                      <button
                        type="button"
                        className="bg-surface border border-borderClient text-textMain px-3 py-1.5 rounded-md font-sans text-[0.7rem] font-bold uppercase transition-all cursor-pointer hover:not-disabled:border-primary hover:not-disabled:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPage === Math.ceil(totalCount / 5)}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        {t('billing.actions.next')}
                      </button>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-[1200]">
          <CancelModal
            onClose={() => toggleModal(false)}
            onConfirm={confirmCancellation}
            isProcessing={isCancelling}
            error={cancellationError}
          />
        </div>
      )}
    </>
  );
};
