import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaDownload, FaReceipt, FaCheckCircle, FaTimesCircle, FaSync } from 'react-icons/fa';
import { fetchUserBillingHistory, cancelUserSubscription } from '../api/billingApi';
import styles from './BillingHistoryPage.module.css';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';

const STATUS_ICONS = {
  'active': { icon: <FaCheckCircle />, color: '#48bb78' },
  'inactive': { icon: <FaTimesCircle />, color: '#e53e3e' },
  'cancelled': { icon: <FaTimesCircle />, color: '#e53e3e' }
};

export default function BillingHistoryPage() {
  // 1. Завантажуємо 'profile' (для сторінки) та 'subscription' (для фіч і планів)
  const { t } = useTranslation(['profile', 'subscription']);
  
  const { subscription, updateSubscription, isLoading: isSubscriptionLoading, getFeatureKeys } = useSubscription();
  const [billingHistory, setBillingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const navigate = useNavigate();
  const itemsPerPage = 10;

  const handleActionClick = (action) => {
    console.warn(`Function ${action} in development`);
  };

  const getStatusConfig = (status) => {
      const config = STATUS_ICONS[status] || STATUS_ICONS.active;
      return {
          ...config,
          // Статуси беремо з profile.json (subscription.status)
          label: t(`profile:subscription.status.${status}`) || status
      };
  };

  const getPlanName = (plan) => {
      const keyMap = {
          'pro': 'premium',
          'premium': 'premium',
          'weekly': 'weekly',
          'realtor': 'realtor',
          'free': 'free'
      };
      const key = keyMap[plan] || 'free';
      // Беремо назву плану з subscription.json (subscription.plans.key.name)
      return t(`subscription:subscription.plans.${key}.name`);
  };

  const getPlanPrice = (plan) => {
      const prices = {
          'weekly': '99 грн',
          'premium': '299 грн',
          'realtor': '599 грн',
          'free': '0 грн'
      };
      return prices[plan] || prices.free;
  };

  const loadBillingData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { subscriptions, count } = await fetchUserBillingHistory(currentPage, itemsPerPage);
     
      const formattedHistory = (subscriptions || []).map(sub => {
        const displayPlan = sub.plan_name === 'pro' ? 'premium' : sub.plan_name;
        
        return {
          id: sub.id,
          date: new Date(sub.created_at).toLocaleDateString('uk-UA'),
          amount: getPlanPrice(displayPlan),
          status: sub.status,
          plan: displayPlan, // Передаємо ключ, а не переклад, щоб getPlanName спрацював у render
          method: t('profile:billing_page.method_online') || 'Онлайн',
          invoiceId: sub.payment_id,
          expiresAt: sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('uk-UA') : t('profile:stats_page.never')
        };
      });
      
      setBillingHistory(formattedHistory);
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

    const confirmed = window.confirm(t('profile:billing_page.cancel_confirm'));
    
    if (!confirmed) return;

    setIsCancelling(true);
    try {
      if (!subscription.id) throw new Error('No subscription ID found');

      await cancelUserSubscription(subscription.id);
      
      await updateSubscription(); 
      alert(t('profile:billing_page.cancel_success'));
      
      loadBillingData();
      
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const currentSubscriptionInfo = (() => {
    if (isSubscriptionLoading) {
      return { plan: '...', amount: '---', expiresAt: '---' };
    }
   
    let actualPlanName = (subscription?.isExpired || subscription?.plan === 'free') 
        ? 'free' 
        : subscription?.plan;
   
    let endsAtFormatted = t('profile:stats_page.never');
    if (actualPlanName !== 'free' && subscription?.ends_at) {
        endsAtFormatted = new Date(subscription.ends_at).toLocaleDateString('uk-UA');
    }

    return {
      plan: getPlanName(actualPlanName),
      amount: getPlanPrice(actualPlanName),
      expiresAt: endsAtFormatted
    };
  })();

  if (isLoading || isSubscriptionLoading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSync className={styles.loadingSpinner} />
        <p>{t('profile:billing_page.loading')}</p>
      </div>
    );
  }

  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }

  const featureKeys = getFeatureKeys ? getFeatureKeys() : (subscription?.features || []);

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
              <div className={styles.summaryIcon} style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' }}>
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
              <span>{t('profile:billing_page.table.actions')}</span>
            </div>
            <div className={styles.tableBody}>
              {billingHistory.length > 0 ? (
                billingHistory.map((item) => {
                  const statusConfig = getStatusConfig(item.status);
                  return (
                    <div key={item.id} className={styles.tableRow}>
                      <div className={styles.dateCell}>
                        <span className={styles.date}>{item.date}</span>
                        <span className={styles.invoiceId}>{item.invoiceId || '---'}</span>
                      </div>
                      {/* Викликаємо getPlanName для перекладу назви плану */}
                      <span className={styles.plan}>{getPlanName(item.plan)}</span>
                      <span className={styles.amount}>{item.amount}</span>
                      <span className={styles.method}>{item.method}</span>
                      <div className={styles.statusCell}>
                        <span className={styles.status} style={{ color: statusConfig.color }}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className={styles.actions}>
                        <button 
                            className={styles.downloadButton} 
                            onClick={() => handleActionClick('download')}
                            title={t('profile:actions.download')}
                        >
                          <FaDownload />
                        </button>
                        <button 
                            className={styles.viewButton} 
                            onClick={() => handleActionClick('view')}
                            title={t('profile:actions.view_details')}
                        >
                          <FaReceipt />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.noData} style={{padding: '20px', textAlign: 'center', color: '#718096'}}>
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
              <span className={styles.paginationInfo}>{t('profile:billing_page.pagination', { current: currentPage, total: totalPages })}</span>
              <button
                className={styles.paginationButton}
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                {t('profile:actions.next')}
              </button>
            </div>
          )}

          <div className={styles.subscriptionInfo}>
            <h3>{t('profile:billing_page.current_sub')}</h3>
            <div className={styles.currentPlan}>
              <div className={styles.planDetails}>
                <h4>{currentSubscriptionInfo.plan}</h4>
                <p>{currentSubscriptionInfo.amount}</p>
                <span className={styles.nextPayment}>
                   {subscription?.status === 'active' && subscription?.plan !== 'free' 
                      ? t('profile:billing_page.next_payment', { date: currentSubscriptionInfo.expiresAt })
                      : subscription?.plan !== 'free' 
                        ? t('profile:billing_page.valid_until', { date: currentSubscriptionInfo.expiresAt })
                        : ''
                   }
                </span>
              </div>
              
              <button 
                className={`${styles.manageButton} ${subscription?.status === 'active' && subscription?.plan !== 'free' ? styles.cancelButton : ''}`} 
                onClick={handleManageSubscription}
                disabled={isCancelling}
              >
                {isCancelling ? t('profile:billing_page.processing') : (
                  subscription?.status === 'active' && subscription?.plan !== 'free' 
                    ? t('profile:billing_page.cancel_sub')
                    : t('profile:billing_page.update_plan')
                )}
              </button>
            </div>
          </div>

          {subscription && (
            <div className={styles.subscriptionFeatures}>
              {/* Виправлено ключ на active_features, який є в JSON */}
              <h3>{t('profile:billing_page.active_features')}</h3>
              <ul>
                {featureKeys.map((featureKey, index) => (
                  <li key={index}>
                    <FaCheckCircle className={styles.featureIcon} />
                    {/* Переклад фіч беремо з subscription.json */}
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