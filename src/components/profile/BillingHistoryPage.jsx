import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaDownload, FaReceipt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { fetchUserBillingHistory, cancelUserSubscription } from '../api/billingApi';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import { PLAN_KEY_MAP, ITEMS_PER_PAGE } from '../../utils/billing'; 
import styles from './BillingHistoryPage.module.css';

export default function BillingHistoryPage() {
  const { t } = useTranslation(['profile', 'subscription']);
  const navigate = useNavigate();
  
  const { subscription, updateSubscription, isLoading: isSubscriptionLoading, getFeatureKeys } = useSubscription();
  const [billingHistory, setBillingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadBillingData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { subscriptions, count } = await fetchUserBillingHistory(currentPage, ITEMS_PER_PAGE);
      setBillingHistory(subscriptions || []);
      setTotalCount(count);
    } catch (e) {
      setError(t('profile:billing_page.error_load'));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, t]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const handleManageSubscription = async () => {
    if (subscription.plan === 'free' || subscription.status !== 'active') {
      navigate('/subscription');
      return;
    }

    if (!window.confirm(t('profile:billing_page.cancel_confirm'))) return;

    setIsCancelling(true);
    try {
      if (!subscription.id) throw new Error('No subscription ID found');
      await cancelUserSubscription(subscription.id);
      await updateSubscription(); 
      loadBillingData();
    } catch (error) {
      console.error(error);
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

  const tableData = useMemo(() => {
    return billingHistory.map(sub => {
      const displayPlanKey = PLAN_KEY_MAP[sub.plan_name] || 'free';
      
      return {
        id: sub.id,
        date: new Date(sub.created_at).toLocaleDateString('uk-UA'),
        amount: t(`subscription:subscription.plans.${displayPlanKey}.price`), 
        status: sub.status,
        planName: t(`subscription:subscription.plans.${displayPlanKey}.name`),
        method: t('profile:billing_page.method_online'),
        invoiceId: sub.payment_id,
        expiresAt: sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('uk-UA') : t('profile:stats_page.never')
      };
    });
  }, [billingHistory, t]);

  const subscriptionInfo = useMemo(() => {
    if (isSubscriptionLoading) return null;

    const actualPlanKey = (subscription?.isExpired || subscription?.plan === 'free') 
        ? 'free' 
        : subscription?.plan;
    
    const mappedKey = PLAN_KEY_MAP[actualPlanKey] || 'free';

    return {
      planName: t(`subscription:subscription.plans.${mappedKey}.name`),
      amount: t(`subscription:subscription.plans.${mappedKey}.price`),
      expiresAt: (mappedKey !== 'free' && subscription?.ends_at)
        ? new Date(subscription.ends_at).toLocaleDateString('uk-UA')
        : t('profile:stats_page.never'),
      isActive: subscription?.status === 'active' && mappedKey !== 'free',
      isFree: mappedKey === 'free'
    };
  }, [subscription, isSubscriptionLoading, t]);

  const featureKeys = useMemo(() => {
    return getFeatureKeys ? getFeatureKeys() : (subscription?.features || []);
  }, [getFeatureKeys, subscription]);

  if (isLoading || isSubscriptionLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>{t('profile:billing_page.loading')}</p>
      </div>
    );
  }

  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }

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
          <div className={styles.billingSummary}>
            <div className={styles.summaryCard}>
              <div className={`${styles.summaryIcon} ${styles.iconSuccess}`}>
                <FaCheckCircle />
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryNumber}>{totalCount}</span>
                <span className={styles.summaryLabel}>{t('profile:billing_page.summary_success')}</span>
              </div>
            </div>
          </div>

          <div className={styles.billingTableContainer}>
            <div className={styles.tableHeader}>
              <span>{t('profile:billing_page.table.date')}</span>
              <span>{t('profile:billing_page.table.plan')}</span>
              <span>{t('profile:billing_page.table.amount')}</span>
              <span>{t('profile:billing_page.table.method')}</span>
              <span>{t('profile:billing_page.table.status')}</span>
              <span className={styles.alignRight}>{t('profile:billing_page.table.actions')}</span>
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
                        <span className={styles.invoiceId}>{item.invoiceId || '---'}</span>
                      </div>
                      <span className={styles.plan}>{item.planName}</span>
                      <span className={styles.amount}>{item.amount}</span>
                      <span className={styles.method}>{item.method}</span>
                      <div className={styles.statusCell}>
                        <span className={`${styles.status} ${statusClass}`}>
                          <StatusIcon />
                          {t(`profile:subscription.status.${item.status}`) || item.status}
                        </span>
                      </div>
                      <div className={styles.actions}>
                        <button 
                            className={styles.actionButton} 
                            aria-label={t('profile:actions.download')}
                        >
                          <FaDownload />
                        </button>
                        <button 
                            className={styles.actionButton} 
                            aria-label={t('profile:actions.view_details')}
                        >
                          <FaReceipt />
                        </button>
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
                {t('profile:billing_page.pagination', { current: currentPage, total: totalPages })}
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

          {subscriptionInfo && (
            <div className={styles.subscriptionInfo}>
              <h3>{t('profile:billing_page.current_sub')}</h3>
              <div className={styles.currentPlan}>
                <div className={styles.planDetails}>
                  <h4>{subscriptionInfo.planName}</h4>
                  <p>{subscriptionInfo.amount}</p>
                  <span className={styles.nextPayment}>
                     {subscriptionInfo.isActive 
                        ? t('profile:billing_page.next_payment', { date: subscriptionInfo.expiresAt })
                        : !subscriptionInfo.isFree 
                          ? t('profile:billing_page.valid_until', { date: subscriptionInfo.expiresAt })
                          : ''
                     }
                  </span>
                </div>
                
                <button 
                  className={`${styles.manageButton} ${subscriptionInfo.isActive ? styles.cancelButton : ''}`} 
                  onClick={handleManageSubscription}
                  disabled={isCancelling}
                >
                  {isCancelling ? t('profile:billing_page.processing') : (
                    subscriptionInfo.isActive 
                      ? t('profile:billing_page.cancel_sub')
                      : t('profile:billing_page.update_plan')
                  )}
                </button>
              </div>
            </div>
          )}

          {featureKeys.length > 0 && (
            <div className={styles.subscriptionFeatures}>
              <h3>{t('profile:billing_page.active_features')}</h3>
              <ul>
                {featureKeys.map((featureKey, index) => (
                  <li key={`${featureKey}-${index}`}>
                    <FaCheckCircle className={styles.featureIcon} />
                    {t(`subscription:subscription.features.${featureKey}`)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}