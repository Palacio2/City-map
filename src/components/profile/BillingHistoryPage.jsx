import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaReceipt, FaCheckCircle, FaClock, FaTimesCircle, FaSync } from 'react-icons/fa';
import { fetchUserBillingHistory } from '../api/billingApi';
import styles from './BillingHistoryPage.module.css';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';

const PLAN_PRICES = {
  'pro': '149 грн/міс',
  'premium': '299 грн/міс',
  'free': '0 грн'
};

const STATUS_CONFIG = {
  'active': { icon: <FaCheckCircle />, color: '#48bb78' },
  'inactive': { icon: <FaTimesCircle />, color: '#e53e3e' }
};

export default function BillingHistoryPage() {
  const { subscription, isLoading: isSubscriptionLoading, getTranslatedFeatures } = useSubscription();
  const [billingHistory, setBillingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  const handleActionClick = (action) => {
    alert(`Функціонал для ${action} тимчасово недоступний.`);
  };

  const loadBillingData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { subscriptions, count } = await fetchUserBillingHistory(currentPage, itemsPerPage);
      
      const formattedHistory = (subscriptions || []).map(sub => ({
        id: sub.id,
        date: new Date(sub.created_at).toLocaleDateString(),
        amount: PLAN_PRICES[sub.plan_name] || '---',
        status: sub.status,
        plan: sub.plan_name,
        method: 'Онлайн оплата',
        invoiceId: sub.payment_id,
        expiresAt: sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : 'Немає'
      }));
      setBillingHistory(formattedHistory);
      setTotalCount(count);
    } catch (e) {
      setError('Не вдалося завантажити історію платежів. Спробуйте пізніше.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const currentPlan = billingHistory[0] || null;

  if (isLoading || isSubscriptionLoading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSync className={styles.loadingSpinner} />
        <p>Завантаження історії...</p>
      </div>
    );
  }

  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/profile" className={styles.backButton}>
          <FaArrowLeft /> Назад до профілю
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Історія платежів</h1>
          <p className={styles.subtitle}>Перегляд усіх ваших транзакцій та рахунків</p>
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
                <span className={styles.summaryLabel}>Успішних підписок</span>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon} style={{ background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)' }}>
                <FaClock />
              </div>
              <div className={styles.summaryContent}>
                <span className={styles.summaryNumber}>0</span>
                <span className={styles.summaryLabel}>В очікуванні</span>
              </div>
            </div>
          </div>

          <div className={styles.billingTableContainer}>
            <div className={styles.tableHeader}>
              <span>Дата</span>
              <span>Тариф</span>
              <span>Сума</span>
              <span>Спосіб оплати</span>
              <span>Статус</span>
              <span>Дії</span>
            </div>
            <div className={styles.tableBody}>
              {billingHistory.length > 0 ? (
                billingHistory.map((item) => {
                  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
                  return (
                    <div key={item.id} className={styles.tableRow}>
                      <div className={styles.dateCell}>
                        <span className={styles.date}>{item.date}</span>
                        <span className={styles.invoiceId}>{item.invoiceId || '---'}</span>
                      </div>
                      <span className={styles.plan}>{item.plan}</span>
                      <span className={styles.amount}>{item.amount}</span>
                      <span className={styles.method}>{item.method}</span>
                      <div className={styles.statusCell}>
                        <span className={styles.status} style={{ color: statusConfig.color }}>
                          {statusConfig.icon}
                          {item.status}
                        </span>
                      </div>
                      <div className={styles.actions}>
                        <button className={styles.downloadButton} onClick={() => handleActionClick('завантаження квитанції')}>
                          <FaDownload />
                        </button>
                        <button className={styles.viewButton} onClick={() => handleActionClick('перегляду деталей')}>
                          <FaReceipt />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.noData}>Немає історії платежів.</div>
              )}
            </div>
          </div>

          <div className={styles.pagination}>
            <button 
              className={styles.paginationButton} 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Попередня
            </button>
            <span className={styles.paginationInfo}>Сторінка {currentPage} з {totalPages || 1}</span>
            <button 
              className={styles.paginationButton} 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Наступна
            </button>
          </div>

          <div className={styles.subscriptionInfo}>
            <h3>Поточна підписка</h3>
            <div className={styles.currentPlan}>
              <div className={styles.planDetails}>
                <h4>{currentPlan?.plan || 'Немає підписки'}</h4>
                <p>{currentPlan?.amount || '---'}</p>
                <span className={styles.nextPayment}>Наступний платіж: {currentPlan?.expiresAt || '---'}</span>
              </div>
              <button className={styles.manageButton}>
                Керувати підпискою
              </button>
            </div>
          </div>

          {subscription && (
            <div className={styles.subscriptionFeatures}>
              <h3>Включені можливості</h3>
              <ul>
                {getTranslatedFeatures().map((feature, index) => (
                  <li key={index}>
                    <FaCheckCircle className={styles.featureIcon} />
                    {feature}
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