import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, 
  FaCrown, 
  FaCreditCard, 
  FaSync,
  FaCheckCircle,
  FaTimesCircle,
  FaChartLine,
  FaLock,
  FaEdit,
  FaKey,
  FaExclamationTriangle,
  FaExclamationCircle
} from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import styles from './Profile.module.css';

export default function Profile() {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    joinDate: ''
  });
  
  const { subscription, isLoading: subLoading, isPremium, getTranslatedFeatures } = useSubscription();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserData({
          name: user.user_metadata?.full_name || 'Користувач',
          email: user.email || '',
          phone: user.user_metadata?.phone || 'Не вказано',
          joinDate: new Date(user.created_at).toLocaleDateString('uk-UA')
        });
      }
    } catch (error) {
      console.error('Помилка завантаження даних:', error);
    }
  };

  const formatExpiryDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString('uk-UA') : 'Не вказано';
  };

  const getPlanDisplayInfo = () => {
    if (!subscription) return { name: 'Завантаження...', price: '' };

    if (subscription.isCancelled) {
      return { name: 'Безкоштовний', price: '0 грн' };
    }

    const plans = {
      'pro': { name: 'Pro', price: '149 грн/міс' },
      'premium': { name: 'Premium', price: '299 грн/міс' },
      'free': { name: 'Безкоштовний', price: '0 грн' }
    };

    return plans[subscription.plan] || plans.free;
  };

  const planInfo = getPlanDisplayInfo();
  const features = subscription?.features ? getTranslatedFeatures().slice(0, 6) : [];

  if (subLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Завантаження...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Мій обліковий запис</h1>
        <p className={styles.subtitle}>Керуйте вашою підпискою та налаштуваннями</p>
      </div>

      <div className={styles.content}>
        {/* Профіль користувача */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaUser className={styles.sectionIcon} />
            <h2>Профіль користувача</h2>
          </div>
          <div className={styles.profileGrid}>
            <div className={styles.profileInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Ім'я:</span>
                <span className={styles.infoValue}>{userData.name}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email:</span>
                <span className={styles.infoValue}>{userData.email}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Телефон:</span>
                <span className={styles.infoValue}>{userData.phone}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Дата реєстрації:</span>
                <span className={styles.infoValue}>{userData.joinDate}</span>
              </div>
            </div>
            <div className={styles.profileActions}>
              <Link to="/profile/edit" className={styles.actionButton}>
                <FaEdit /> Редагувати профіль
              </Link>
              <Link to="/profile/password" className={styles.actionButtonSecondary}>
                <FaKey /> Змінити пароль
              </Link>
            </div>
          </div>
        </section>

        {/* Підписка */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaCrown className={styles.sectionIcon} />
            <h2>Підписка</h2>
          </div>
          <div className={styles.subscriptionCard}>
            {subscription?.isCancelled && (
              <div className={styles.cancellationNotice}>
                <FaExclamationTriangle />
                <span>Підписка скасована, але діє до {formatExpiryDate(subscription?.expiresAt)}</span>
              </div>
            )}

            <div className={styles.subscriptionHeader}>
              <div className={styles.planInfo}>
                <h3 className={styles.planName}>Тариф: {planInfo.name}</h3>
                <span className={`${styles.status} ${subscription?.status === 'active' ? styles.active : styles.inactive}`}>
                  {subscription?.status === 'active' ? <><FaCheckCircle /> Активна</> : <><FaTimesCircle /> Скасована</>}
                </span>
              </div>
              {subscription?.plan !== 'free' && !subscription?.isCancelled && (
                <div className={styles.planPrice}>
                  <span className={styles.price}>{planInfo.price}</span>
                  <span className={styles.billingDate}>Закінчується: {formatExpiryDate(subscription?.expiresAt)}</span>
                </div>
              )}
            </div>

            <div className={styles.featuresList}>
              <h4>Доступні функції:</h4>
              <div className={styles.featuresGrid}>
                {features.map((feature, index) => (
                  <div key={index} className={styles.featureItem}>
                    <FaCheckCircle className={styles.featureIcon} />
                    <span>{feature}</span>
                  </div>
                ))}
                {subscription?.features && subscription.features.length > 6 && (
                  <div className={styles.featureItem}>
                    <FaCheckCircle className={styles.featureIcon} />
                    <span>і ще {subscription.features.length - 6} функцій...</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.subscriptionActions}>
              <Link to="/subscription" className={styles.primaryButton}>
                <FaSync /> {subscription?.plan !== 'free' && !subscription?.isCancelled ? 'Оновити підписку' : 'Обрати тариф'}
              </Link>
              {(subscription?.plan !== 'free' && !subscription?.isCancelled) && (
                <Link to="/billing" className={styles.secondaryButton}>
                  Керувати платежами
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Швидкі дії */}
        <div className={styles.quickActions}>
          {isPremium ? (
            <Link to="/profile/stats" className={styles.quickActionCard}>
              <FaChartLine className={styles.quickActionIcon} />
              <h3>Статистика використання</h3>
              <p>Переглянути вашу активність</p>
            </Link>
          ) : (
            <div className={`${styles.quickActionCard} ${styles.lockedCard}`}>
              <div className={styles.lockOverlay}>
                <FaLock className={styles.lockIcon} />
                <span>Потрібна Premium підписка</span>
              </div>
              <FaChartLine className={styles.quickActionIcon} />
              <h3>Статистика використання</h3>
              <p>Переглянути вашу активність</p>
            </div>
          )}

          <Link to="/profile/billing-history" className={styles.quickActionCard}>
            <FaCreditCard className={styles.quickActionIcon} />
            <h3>Історія платежів</h3>
            <p>Переглянути всі транзакції</p>
          </Link>

          <Link to="/profile/account-actions" className={styles.quickActionCard}>
            <FaExclamationCircle className={styles.quickActionIcon} />
            <h3>Дії з акаунтом</h3>
            <p>Керування акаунтом</p>
          </Link>
        </div>

        {/* Довідка */}
        <section className={styles.helpSection}>
          <h3>Потрібна допомога?</h3>
          <p>Зв'яжіться з нашою службою підтримки</p>
          <div className={styles.helpLinks}>
            <Link to="/contacts" className={styles.helpLink}>Контакти</Link>
            <Link to="/faq" className={styles.helpLink}>Часті запитання</Link>
            <a href="mailto:support@geoanalyzer.com" className={styles.helpLink}>Написати на email</a>
          </div>
        </section>
      </div>
    </div>
  );
}