import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import { fetchUserBillingHistory, cancelUserSubscription } from '../../components/api/billingApi';
import styles from './Billing.module.css';

const PLAN_CONFIG = {
  pro: { price: '149 грн/міс' },
  premium: { price: '299 грн/міс' },
  free: { price: '0 грн' }
};

const STATUS_CONFIG = {
  active: { icon: FaCheckCircle, color: '#48bb78' },
  cancelled: { icon: FaTimesCircle, color: '#e53e3e' },
  default: { icon: FaCheckCircle, color: '#48bb78' }
};

const TABLE_HEADERS = ['Дата', 'Тариф', 'Сума', 'ID Транзакції', 'Статус'];

export default function Billing() {
  const [data, setData] = useState({
    currentSubscription: null,
    billingHistory: [],
    page: 1,
    totalPages: 0
  });
  const [ui, setUi] = useState({
    isLoading: true,
    isCancelling: false,
    error: null,
    cancellationMessage: null,
    showConfirmation: false
  });

  const updateState = (type, updates) => type === 'data' 
    ? setData(prev => ({ ...prev, ...updates }))
    : setUi(prev => ({ ...prev, ...updates }));

  const fetchBillingData = async () => {
    try {
      updateState('ui', { isLoading: true, error: null });
      const { subscriptions, count } = await fetchUserBillingHistory(data.page);

      const formattedHistory = subscriptions.map(sub => ({
        id: sub.id,
        date: new Date(sub.created_at).toLocaleDateString(),
        amount: PLAN_CONFIG[sub.plan_name]?.price || '---',
        status: sub.status,
        plan: sub.plan_name,
        invoiceId: sub.payment_id,
        expiresAt: sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : 'Немає',
        cancelledAt: sub.cancelled_at
      }));
      
      const currentSub = formattedHistory.find(sub => sub.status === 'active') || formattedHistory[0] || {
        plan: 'free', status: 'active', expiresAt: 'Назавжди'
      };

      updateState('data', {
        currentSubscription: currentSub,
        billingHistory: formattedHistory,
        totalPages: Math.ceil(count / 10)
      });
    } catch (e) {
      updateState('ui', { error: e.message || 'Помилка завантаження історії платежів' });
    } finally {
      updateState('ui', { isLoading: false });
    }
  };

  useEffect(() => { fetchBillingData(); }, [data.page]);

  const handleCancelClick = () => {
    const { currentSubscription } = data;
    const canCancel = currentSubscription && 
                     currentSubscription.plan !== 'free' && 
                     currentSubscription.status === 'active';
    
    if (!canCancel) {
      updateState('ui', { cancellationMessage: "Ви не маєте активної платної підписки для скасування." });
      return;
    }
    updateState('ui', { showConfirmation: true });
  };

  const confirmCancellation = async () => {
    updateState('ui', { showConfirmation: false, isCancelling: true });
    
    try {
      await cancelUserSubscription(data.currentSubscription.id);
      updateState('ui', { 
        cancellationMessage: "Підписку успішно скасовано. Функції будуть доступні до кінця терміну дії." 
      });
      await fetchBillingData();
    } catch (e) {
      updateState('ui', { cancellationMessage: e.message || "Помилка при скасуванні підписки." });
    } finally {
      updateState('ui', { isCancelling: false });
    }
  };

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.default;

  const { currentSubscription, billingHistory, page, totalPages } = data;
  const { isLoading, error, cancellationMessage, showConfirmation, isCancelling } = ui;
  const isCancellable = currentSubscription && currentSubscription.plan !== 'free' && currentSubscription.status === 'active';

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className={styles.container}>
      {showConfirmation && (
        <ConfirmationModal 
          currentSubscription={currentSubscription}
          onConfirm={confirmCancellation}
          onCancel={() => updateState('ui', { showConfirmation: false })}
          isCancelling={isCancelling}
        />
      )}
      
      <Header />
      
      <div className={styles.content}>
        <div className={styles.billingContainer}>
          <CurrentPlanSection 
            currentSubscription={currentSubscription}
            cancellationMessage={cancellationMessage}
            isCancellable={isCancellable}
            onCancelClick={handleCancelClick}
            getStatusConfig={getStatusConfig}
          />
          
          <BillingHistorySection 
            billingHistory={billingHistory}
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) => updateState('data', { page: newPage })}
            getStatusConfig={getStatusConfig}
          />
        </div>
      </div>
    </div>
  );
}

// Допоміжні компоненти
const LoadingState = () => (
  <div className={styles.loadingContainer}>
    <FaSync className={styles.loadingSpinner} />
    <p>Завантаження даних...</p>
  </div>
);

const ErrorState = ({ error }) => <div className={styles.errorContainer}>Помилка: {error}</div>;

const Header = () => (
  <div className={styles.header}>
    <Link to="/profile" className={styles.backButton}>
      <FaArrowLeft /> Назад до профілю
    </Link>
    <div className={styles.titleSection}>
      <h1 className={styles.title}>Управління підпискою</h1>
      <p className={styles.subtitle}>Керуйте своїм планом та переглядайте історію платежів.</p>
    </div>
  </div>
);

const ConfirmationModal = ({ currentSubscription, onConfirm, onCancel, isCancelling }) => (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent}>
      <h3>Підтвердження скасування</h3>
      <p>Ви впевнені, що хочете скасувати свою підписку? Функції залишаться доступними до {currentSubscription?.expiresAt}, але автоматичне продовження буде вимкнено.</p>
      <div className={styles.modalActions}>
        <button onClick={onConfirm} className={styles.modalButtonConfirm} disabled={isCancelling}>
          {isCancelling ? 'Скасування...' : 'Так, скасувати'}
        </button>
        <button onClick={onCancel} className={styles.modalButtonCancel}>Ні</button>
      </div>
    </div>
  </div>
);

const CurrentPlanSection = ({ currentSubscription, cancellationMessage, isCancellable, onCancelClick, getStatusConfig }) => {
  if (!currentSubscription) return null;
  
  const { icon: IconComponent, color } = getStatusConfig(currentSubscription.status);

  return (
    <div className={styles.currentPlanSection}>
      <h3 className={styles.currentPlanTitle}>Ваш поточний план</h3>
      {cancellationMessage && <div className={styles.message}>{cancellationMessage}</div>}
      
      <div className={styles.planCard}>
        {currentSubscription.status === 'cancelled' && (
          <div className={styles.cancellationInfo}>
            <FaExclamationTriangle />
            <span>Підписка скасована, але діє до {currentSubscription.expiresAt}</span>
          </div>
        )}
        
        <div className={styles.planDetails}>
          <h4 className={styles.planName}>
            {currentSubscription.status === 'cancelled' ? 'Безкоштовний' : currentSubscription.plan}
          </h4>
          <span className={styles.planStatus} style={{ color }}>
            <IconComponent /> {currentSubscription.status}
          </span>
          <p className={styles.planExpires}>Закінчується: {currentSubscription.expiresAt}</p>
          {currentSubscription.cancelledAt && (
            <p className={styles.cancelledDate}>
              Скасовано: {new Date(currentSubscription.cancelledAt).toLocaleDateString()}
            </p>
          )}
        </div>
        {isCancellable && (
          <button onClick={onCancelClick} className={styles.cancelButton}>
            Скасувати підписку
          </button>
        )}
      </div>
    </div>
  );
};

const BillingHistorySection = ({ billingHistory, page, totalPages, onPageChange, getStatusConfig }) => (
  <div className={styles.billingTableContainer}>
    <h3 className={styles.historyTitle}>Історія платежів</h3>
    
    <div className={styles.tableHeader}>
      {TABLE_HEADERS.map(header => <span key={header}>{header}</span>)}
    </div>
    
    <div className={styles.tableBody}>
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
    
    <PaginationControls page={page} totalPages={totalPages} onPageChange={onPageChange} />
  </div>
);

const PaginationControls = ({ page, totalPages, onPageChange }) => (
  <div className={styles.paginationControls}>
    <button onClick={() => onPageChange(Math.max(page - 1, 1))} disabled={page === 1} className={styles.paginationButton}>
      Попередня
    </button>
    <span>Сторінка {page} з {totalPages}</span>
    <button onClick={() => onPageChange(Math.min(page + 1, totalPages))} disabled={page === totalPages} className={styles.paginationButton}>
      Наступна
    </button>
  </div>
);