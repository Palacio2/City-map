import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import { fetchUserBillingHistory, cancelUserSubscription } from '../api/billingApi';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import styles from './BillingHistoryPage.module.css';

const ITEMS_PER_PAGE = 5;

export default function BillingHistoryPage() {
  const { t } = useTranslation(['profile', 'subscription']);
  const navigate = useNavigate();
  
  const { subscription, updateSubscription, isLoading: isSubscriptionLoading } = useSubscription();
  const [billingHistory, setBillingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const loadBillingData = async () => {
      try {
        setIsLoading(true);
        const { subscriptions, count } = await fetchUserBillingHistory(currentPage, ITEMS_PER_PAGE);
        setBillingHistory(subscriptions || []);
        setTotalCount(count);
      } catch (e) {
        console.error(e);
        setError(t('profile:billing_page.error_load'));
      } finally {
        setIsLoading(false);
      }
    };
    loadBillingData();
  }, [currentPage, t]);

  const handleManageButton = () => {
    if (subscription.plan === 'free' || subscription.status !== 'active') {
      navigate('/subscription');
    } else {
      setShowCancelModal(true);
    }
  };

  const confirmCancellation = async () => {
    setIsCancelling(true);
    setShowCancelModal(false); 
    try {
      if (!subscription.id) throw new Error('No subscription ID found');
      await cancelUserSubscription(subscription.id);
      await updateSubscription(); 
       const { subscriptions, count } = await fetchUserBillingHistory(currentPage, ITEMS_PER_PAGE);
       setBillingHistory(subscriptions || []);
       setTotalCount(count);
    } catch (error) {
      console.error(error);
      alert(t('profile:billing_page.error_cancel'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePageChange = (newPage) => {
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const tableData = billingHistory.map(sub => {
    const planKey = sub.plan_name === 'pro' ? 'premium' : (sub.plan_name || 'free');
    
    return {
      id: sub.id,
      date: new Date(sub.created_at).toLocaleDateString('uk-UA'),
      amount: `€${sub.amount}`, 
      status: sub.status,
      planName: t(`subscription:subscription.plans.${planKey}.name`),
      method: t('profile:billing_page.method_online'),
      invoiceId: sub.payment_id ? sub.payment_id.replace('TX_', '').replace('SUB_', '').slice(-8).toUpperCase() : '---',
      expiresAt: sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('uk-UA') : t('profile:stats_page.never')
    };
  });

  const getSubscriptionInfo = () => {
    if (isSubscriptionLoading) return null;

    const actualPlanKey = (subscription?.isExpired || !subscription?.plan) 
        ? 'free' 
        : subscription.plan;
    
    return {
      planName: t(`subscription:subscription.plans.${actualPlanKey}.name`),
      amount: t(`subscription:subscription.plans.${actualPlanKey}.price`),
      expiresAt: (actualPlanKey !== 'free' && subscription?.expiresAt) 
        ? new Date(subscription.expiresAt).toLocaleDateString('uk-UA')
        : t('profile:stats_page.never'),
      isActive: subscription?.status === 'active' && actualPlanKey !== 'free',
      isFree: actualPlanKey === 'free'
    };
  };

  const subscriptionInfo = getSubscriptionInfo();

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/profile" className={styles.backButton}>
          <FaArrowLeft /> {t('profile:actions.back_to_profile')}
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{t('profile:billing_page.title')}</h1>
          <p className={styles.subtitle}>{t('profile:billing_page.subtitle')}</p>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.billingContainer}>
          
          {subscriptionInfo && (
            <div className={styles.subscriptionInfoCard}>
              <div className={styles.subInfoHeader}>
                  <h3>{t('profile:billing_page.current_sub')}</h3>
                  <span className={`${styles.statusBadge} ${subscriptionInfo.isActive ? styles.activeBadge : styles.freeBadge}`}>
                      {subscriptionInfo.isActive ? t('profile:subscription.status.active') : 'Free'}
                  </span>
              </div>
              
              <div className={styles.currentPlanDetails}>
                <div className={styles.planRow}>
                    <span className={styles.planLabel}>{t('profile:billing_page.plan_label')}</span>
                    <span className={styles.planValue}>{subscriptionInfo.planName}</span>
                </div>
                <div className={styles.planRow}>
                    <span className={styles.planLabel}>{t('profile:billing_page.price_label')}</span>
                    <span className={styles.planValue}>{subscriptionInfo.amount}</span>
                </div>
                {subscriptionInfo.isActive && (
                    <div className={styles.planRow}>
                        <span className={styles.planLabel}>{t('profile:billing_page.next_payment')}</span>
                        <span className={styles.planValue}>{subscriptionInfo.expiresAt}</span>
                    </div>
                )}
              </div>
              
              <button 
                className={`${styles.manageButton} ${subscriptionInfo.isActive ? styles.cancelButton : styles.upgradeButton}`} 
                onClick={handleManageButton}
                disabled={isCancelling}
              >
                {isCancelling ? t('profile:billing_page.processing') : (
                  subscriptionInfo.isActive 
                    ? t('profile:billing_page.cancel_sub')
                    : t('profile:billing_page.update_plan')
                )}
              </button>
            </div>
          )}

          <div className={styles.billingTableSection}>
            <div className={styles.tableHeaderWrapper}>
                <h3>{t('profile:billing_page.history_title')}</h3>
                <div className={styles.summaryBadge}>
                    <FaCheckCircle /> {totalCount} {t('profile:billing_page.transactions')}
                </div>
            </div>

            <div className={styles.billingTableContainer}>
                <div className={styles.tableHeader}>
                <span>{t('profile:billing_page.table.date')}</span>
                <span>{t('profile:billing_page.table.plan')}</span>
                <span>{t('profile:billing_page.table.amount')}</span>
                <span>{t('profile:billing_page.table.status')}</span>
                <span className={styles.alignRight}>{t('profile:billing_page.table.invoice')}</span>
                </div>
                
                <div className={styles.tableBody}>
                {tableData.length > 0 ? (
                    tableData.map((item) => {
                    const isErrorStatus = item.status === 'cancelled' || item.status === 'inactive';
                    const StatusIcon = isErrorStatus ? FaTimesCircle : FaCheckCircle;
                    const statusClass = isErrorStatus ? styles.statusError : styles.statusSuccess;

                    return (
                        <div key={item.id} className={styles.tableRow}>
                        <div className={styles.dateCell}>
                            <span className={styles.date}>{item.date}</span>
                        </div>
                        <span className={styles.plan}>{item.planName}</span>
                        <span className={styles.amount}>{item.amount}</span>
                        <div className={styles.statusCell}>
                            <span className={`${styles.status} ${statusClass}`}>
                            <StatusIcon />
                            {t(`profile:subscription.status.${item.status}`) !== `profile:subscription.status.${item.status}` 
                                ? t(`profile:subscription.status.${item.status}`) 
                                : item.status}
                            </span>
                        </div>
                        <div className={styles.actions}>
                            <span className={styles.invoiceId}>{item.invoiceId}</span>
                        </div>
                        </div>
                    );
                    })
                ) : (
                    <div className={styles.noData}>
                        {t('profile:billing_page.no_history')}
                    </div>
                )}
                </div>
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                <button
                    className={styles.paginationButton}
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                >
                    {t('profile:actions.prev')}
                </button>
                <span className={styles.paginationInfo}>
                    {currentPage} / {totalPages}
                </span>
                <button
                    className={styles.paginationButton}
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    {t('profile:actions.next')}
                </button>
                </div>
            )}
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>
              <FaExclamationTriangle />
            </div>
            <h3>{t('profile:billing_page.cancel_sub')}</h3>
            <p>{t('profile:billing_page.cancel_confirm')}</p>
            <div className={styles.modalActions}>
              <button 
                className={styles.modalBtnSecondary}
                onClick={() => setShowCancelModal(false)}
              >
                {t('profile:actions.back_to_profile')}
              </button>
              <button 
                className={styles.modalBtnDanger}
                onClick={confirmCancellation}
              >
                {t('profile:billing_page.cancel_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}