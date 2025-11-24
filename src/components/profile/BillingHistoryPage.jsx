import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaReceipt, FaCheckCircle, FaClock, FaTimesCircle, FaSync } from 'react-icons/fa';
import { fetchUserBillingHistory } from '../api/billingApi';
import styles from './BillingHistoryPage.module.css';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';

const PLAN_PRICES = {
  'premium': '299 грн/міс',
  'free': '0 грн'
};

// Оновлений STATUS_CONFIG з українськими статусами
const STATUS_CONFIG = {
  'active': { icon: <FaCheckCircle />, color: '#48bb78', label: 'Активна' },
  'inactive': { icon: <FaTimesCircle />, color: '#e53e3e', label: 'Неактивна' },
  'cancelled': { icon: <FaTimesCircle />, color: '#e53e3e', label: 'Скасована' }
};

// Функція для форматування назви плану
const formatPlanName = (planName) => {
  const planMap = {
    'free': 'Безкоштовний',
    'premium': 'Преміум',
    'pro': 'Преміум'
  };
  return planMap[planName] || planMap['free'];
};

// Функція для форматування статусу
const formatStatus = (status) => {
  const statusMap = {
    'active': 'Активна',
    'inactive': 'Неактивна', 
    'cancelled': 'Скасована'
  };
  return statusMap[status] || statusMap['inactive'];
};

// Функція для отримання конфігурації статусу на основі оригінального статусу
const getStatusConfig = (originalStatus) => {
  return STATUS_CONFIG[originalStatus] || STATUS_CONFIG.active;
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
     
      console.log('Отримані дані з API:', subscriptions); // Додамо лог для дебагу
     
      const formattedHistory = (subscriptions || []).map(sub => {
        // Визначаємо план для відображення
        const displayPlan = sub.plan_name === 'pro' ? 'premium' : sub.plan_name;
        
        return {
          id: sub.id,
          date: new Date(sub.created_at).toLocaleDateString('uk-UA'),
          amount: PLAN_PRICES[displayPlan] || '---',
          status: formatStatus(sub.status), // Український статус
          originalStatus: sub.status, // Оригінальний статус для стилів
          plan: formatPlanName(displayPlan), // Українська назва плану
          originalPlan: sub.plan_name, // Оригінальна назва плану
          method: 'Онлайн оплата',
          invoiceId: sub.payment_id,
          expiresAt: sub.ends_at ? new Date(sub.ends_at).toLocaleDateString('uk-UA') : 'Немає'
        };
      });
      
      setBillingHistory(formattedHistory);
      setTotalCount(count);
    } catch (e) {
      console.error('Помилка завантаження:', e);
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

  const currentSubscriptionInfo = (() => {
    if (isSubscriptionLoading) {
      return {
        plan: 'Завантаження',
        amount: '---',
        expiresAt: '---'
      };
    }
   
    // Визначаємо актуальний план
    let actualPlanName;
    if (subscription?.isExpired || subscription?.plan === 'free') {
      actualPlanName = 'free';
    } else {
      // Конвертуємо pro в premium
      actualPlanName = subscription?.plan === 'pro' ? 'premium' : subscription?.plan;
    }
   
    const displayPlanKey = PLAN_PRICES.hasOwnProperty(actualPlanName) ? actualPlanName : 'free';
   
    let endsAtFormatted = 'Немає';
    if (displayPlanKey !== 'free' && subscription?.ends_at) {
        endsAtFormatted = new Date(subscription.ends_at).toLocaleDateString('uk-UA');
    }

    return {
      plan: formatPlanName(displayPlanKey),
      amount: PLAN_PRICES[displayPlanKey] || '---',
      expiresAt: endsAtFormatted
    };
  })();

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
                  // Використовуємо оригінальний статус для визначення кольору
                  const statusConfig = getStatusConfig(item.originalStatus);
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
                <h4>{currentSubscriptionInfo.plan}</h4>
                <p>{currentSubscriptionInfo.amount}</p>
                <span className={styles.nextPayment}>Наступний платіж: {currentSubscriptionInfo.expiresAt}</span>
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