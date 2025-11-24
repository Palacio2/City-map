import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSync, 
  FaExclamationTriangle,
  FaGem // Іконка для Premium
} from 'react-icons/fa';
import { fetchUserBillingHistory, cancelUserSubscription } from '../../components/api/billingApi';
import styles from './Billing.module.css';

// *** ІМПОРТ КОНТЕКСТУ ПІДПИСКИ ***
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import { subscriptionPlans } from '../../pages/subscription/subscriptionPlans'; 

// Конфігурації для відображення
const PLAN_CONFIG = {
  premium: { price: '299 грн/міс' },
  free: { price: '0 грн' }
};

const STATUS_CONFIG = {
  'active': { icon: FaCheckCircle, color: '#48bb78', label: 'Активна' },
  'inactive': { icon: FaTimesCircle, color: '#e53e3e', label: 'Неактивна' },
  'cancelled': { icon: FaTimesCircle, color: '#e53e3e', label: 'Скасована' },
  'expired': { icon: FaExclamationTriangle, color: '#f6ad55', label: 'Прострочена' },
  'default': { icon: FaCheckCircle, color: '#48bb78', label: 'Активна' }
};

const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.default;

const formatPlanName = (planName) => {
  const planMap = {
    'free': 'Безкоштовний',
    'premium': 'Преміум',
  };
  return planMap[planName] || 'Безкоштовний';
};

const TABLE_HEADERS = ['Дата', 'Тариф', 'Сума', 'ID Транзакції', 'Статус'];

// Компонент-заглушка для відображення історії (логіка залишається вашою)
const BillingHistoryTable = ({ billingHistory, page, totalPages, onPageChange }) => (
  // Ваш код таблиці тут...
  <div className={styles.billingTable}>
      <div className={styles.tableHeader}>
        {TABLE_HEADERS.map((header) => (
          <span key={header} className={styles.tableCell}>{header}</span>
        ))}
      </div>
      <div className={styles.tableBody}>
        {/* Приклад відображення історії. Замініть на свій справжній код */}
        {billingHistory.length > 0 ? billingHistory.map((item) => {
          const { icon: IconComponent, color } = getStatusConfig(item.status);
          
          return (
            <div key={item.id} className={styles.tableRow}>
              <span className={styles.tableCell}>{item.date}</span>
              <span className={styles.tableCell}>{item.plan}</span>
              <span className={styles.tableCell}>{item.amount}</span>
              <span className={styles.tableCell}>{item.invoiceId || '---'}</span>
              <div className={styles.statusCell}>
                <span className={styles.status} style={{ color }}>
                  <IconComponent />
                  {item.status}
                </span>
              </div>
            </div>
          );
        }) : <div className={styles.noData}>Немає історії платежів.</div>}
      </div>
  </div>
);

// Компонент-заглушка для пагінації (логіка залишається вашою)
const PaginationControls = ({ page, totalPages, onPageChange }) => (
  <div className={styles.paginationControls}>
    <button onClick={() => onPageChange(Math.max(page - 1, 1))} disabled={page === 1} className={styles.paginationButton}>
      Попередня
    </button>
    <span>Сторінка {page} з {totalPages}</span>
    <button onClick={() => onPageChange(Math.min(page + 1, totalPages))} disabled={page === totalPages || totalPages === 0} className={styles.paginationButton}>
      Наступна
    </button>
  </div>
);


export default function Billing() {
  // *** ВИКОРИСТАННЯ КОНТЕКСТУ ***
  const { subscription, isPremium, isLoading: subLoading, getTranslatedFeatures } = useSubscription(); 
  
  const [data, setData] = useState({
    billingHistory: [],
    page: 1,
    totalPages: 1
  });
  const [ui, setUi] = useState({
    isLoading: true,
    isCancelling: false,
    error: null,
    cancellationMessage: null,
    showConfirmation: false
  });

  // Логіка для завантаження історії (заглушка)
  const loadData = useCallback(async (page) => {
    // ВАШ КОД для завантаження історії транзакцій з API
    // Для демонстрації використовуємо заглушку
    setUi(prev => ({ ...prev, isLoading: true }));
    try {
        const history = [
            // Приклад даних
            { id: 1, date: '20.10.2025', plan: 'Преміум', amount: '299 грн', invoiceId: 'INV-001', status: 'active' },
            { id: 2, date: '20.09.2025', plan: 'Преміум', amount: '299 грн', invoiceId: 'INV-000', status: 'active' },
        ];
        setData(prev => ({ 
            ...prev, 
            billingHistory: history,
            totalPages: 1,
            page: page
        }));
    } catch (error) {
        setUi(prev => ({ ...prev, error: 'Помилка завантаження історії' }));
    } finally {
        setUi(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    // Завантажуємо історію
    loadData(data.page);
  }, [data.page, loadData]); 

  const handlePageChange = (newPage) => {
    setData(prev => ({ ...prev, page: newPage }));
  };

  // *** ДАНІ ПОТОЧНОЇ ПІДПИСКИ З КОНТЕКСТУ ***
  const currentSubscriptionInfo = {
    plan: formatPlanName(subscription?.plan),
    status: subscription?.status || 'inactive',
    expiresAt: subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : '---',
    amount: PLAN_CONFIG[subscription?.plan]?.price || '0 грн',
    isCancelled: subscription?.isCancelled
  };

  const currentStatus = getStatusConfig(currentSubscriptionInfo.status);
  const nextPaymentLabel = currentSubscriptionInfo.isCancelled ? 'Діє до:' : 'Наступний платіж:';

  // Логіка керування підпискою (заглушка)
  const handleManageSubscription = () => {
    // Сюди має бути перенаправлення на портал керування підпискою (наприклад, Stripe Customer Portal)
    console.log('Керування підпискою: Перенаправлення...');
  };

  if (ui.isLoading || subLoading) {
      return (
        <div className={styles.loadingContainer}>
            <FaSync className={styles.spinner} />
            <p>Завантаження даних...</p>
        </div>
      );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/profile" className={styles.backButton}>
          <FaArrowLeft />
          Назад до профілю
        </Link>
        <div className={styles.titleSection}>
          <h1>Історія та керування підпискою</h1>
          <p>Перегляд історії платежів та керування вашим планом GeoAnalyzer.</p>
        </div>
      </div>

      <div className={styles.content}>
        {/* ---------------------------------------------------- */}
        {/* *** СЕКЦІЯ 1: ПОТОЧНА ПІДПИСКА / PREMIUM ACTIVITY *** */}
        {/* ---------------------------------------------------- */}
        <section className={styles.subscriptionSection}>
            <h2>
                <FaGem className={isPremium ? styles.premiumIconActive : styles.premiumIconInactive} />
                Ваша Premium активність
            </h2>
            
            <div className={styles.currentPlanCard}>
                <div className={styles.planHeader}>
                    <h3 className={isPremium ? styles.premiumText : styles.freeText}>
                        {currentSubscriptionInfo.plan}
                    </h3>
                    <div className={styles.planStatus} style={{ borderColor: currentStatus.color, color: currentStatus.color }}>
                        {currentStatus.icon} {currentStatus.label}
                    </div>
                </div>
                
                <div className={styles.planDetails}>
                    <p className={styles.planAmount}>
                        {currentSubscriptionInfo.amount}
                        <span className={styles.planCycle}> / місяць</span>
                    </p>
                    <p className={styles.planExpires}>
                        {nextPaymentLabel} 
                        <span className={styles.expirationDate}>{currentSubscriptionInfo.expiresAt}</span>
                    </p>
                </div>

                {/* Повідомлення про скасування, якщо підписка скасована */}
                {currentSubscriptionInfo.isCancelled && (
                    <div className={styles.cancellationInfo} style={{ backgroundColor: '#e53e3e' }}>
                        <FaExclamationTriangle />
                        <span>Підписка скасована. Вона буде діяти до {currentSubscriptionInfo.expiresAt}.</span>
                    </div>
                )}
                
                <div className={styles.planActions}>
                    {isPremium ? (
                         <button 
                            className={styles.manageButton}
                            onClick={handleManageSubscription}
                            disabled={currentSubscriptionInfo.isCancelled}
                        >
                            {currentSubscriptionInfo.isCancelled ? 'Скасовано' : 'Керувати підпискою'}
                        </button>
                    ) : (
                         <Link to="/subscription" className={styles.upgradeButton}>
                            Оновити до Premium
                        </Link>
                    )}
                </div>
            </div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* *** СЕКЦІЯ 2: ВКЛЮЧЕНІ ФУНКЦІЇ *** */}
        {/* ---------------------------------------------------- */}
        {subscription && (
            <section className={styles.subscriptionFeaturesSection}>
                <h3>Включені можливості</h3>
                <ul className={styles.featureList}>
                    {getTranslatedFeatures().map((feature, index) => (
                        <li key={index} className={styles.featureItem}>
                            <FaCheckCircle className={styles.featureIcon} />
                            {feature}
                        </li>
                    ))}
                </ul>
            </section>
        )}
        
        {/* ---------------------------------------------------- */}
        {/* *** СЕКЦІЯ 3: ІСТОРІЯ ПЛАТЕЖІВ *** */}
        {/* ---------------------------------------------------- */}
        <div className={styles.billingHistory}>
          <h2>Історія платежів</h2>
          <BillingHistoryTable 
            billingHistory={data.billingHistory} 
            page={data.page} 
            totalPages={data.totalPages} 
            onPageChange={handlePageChange}
          />
          <PaginationControls 
            page={data.page} 
            totalPages={data.totalPages} 
            onPageChange={handlePageChange} 
          />
        </div>
      </div>
    </div>
  );
}