import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, FaCrown, FaCreditCard, FaSync, FaCheckCircle, FaTimesCircle, FaChartLine, FaLock, FaEdit, FaKey, FaExclamationTriangle, FaExclamationCircle
} from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import styles from './Profile.module.css';

// Міні-компонент для секції Підписки (для чистоти основного компонента)
const SubscriptionSection = ({ subscription, planInfo, features, status, formatExpiryDate, styles }) => {
    return (
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <FaCrown className={styles.sectionIcon} />
                <h2>Підписка</h2>
            </div>
            <div className={styles.subscriptionCard}>
                
                {status.isCancelled && (
                    <div className={styles.cancellationNotice}>
                        <FaExclamationTriangle />
                        <span>Підписка скасована, але діє до {formatExpiryDate(subscription?.expiresAt)}</span>
                    </div>
                )}
                
                {status.isExpired && (
                    <div className={`${styles.cancellationNotice} ${styles.expiredNotice}`}>
                        <FaExclamationCircle />
                        <span>Термін дії підписки закінчився {formatExpiryDate(subscription?.expiresAt)}</span>
                    </div>
                )}

                <div className={styles.subscriptionHeader}>
                    <div className={styles.planInfo}>
                        <h3 className={styles.planName}>Тариф: {planInfo.name}</h3>
                        <span className={`${styles.status} ${status.statusDisplay.className}`}>
                            {status.statusDisplay.icon} {status.statusDisplay.text}
                        </span>
                    </div>
                    {subscription?.expiresAt && !status.isExpired && !status.isFree && (
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
                    <Link 
                        to="/subscription" 
                        className={`${styles.baseLinkButton} ${styles.primaryButton}`}
                    >
                        <FaSync /> {(!status.isFree || status.isExpired) ? 'Керувати підпискою' : 'Обрати тариф'}
                    </Link>
                    {(!status.isFree || status.isExpired) && (
                        <Link 
                            to="/billing" 
                            className={`${styles.baseLinkButton} ${styles.secondaryButton}`}
                        >
                            Керувати платежами
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
};


export default function Profile() {
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '',
        joinDate: ''
    });
    const [isUserLoading, setIsUserLoading] = useState(true);
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
        } finally {
            setIsUserLoading(false);
        }
    };

    const formatExpiryDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString('uk-UA') : 'Не вказано';
    };

    const planInfo = useMemo(() => {
        if (!subscription) return { name: 'Завантаження...', price: '' };

        const plans = {
            'premium': { name: 'Premium', price: '299 грн/міс' },
            'free': { name: 'Безкоштовний', price: '0 грн' }
        };

        return plans[subscription.plan] || plans.free;
    }, [subscription]);

    const features = useMemo(() => 
        subscription ? getTranslatedFeatures().slice(0, 6) : []
    , [subscription, getTranslatedFeatures]);

    const subscriptionStatus = useMemo(() => {
        const isFree = subscription?.plan === 'free';
        const isExpired = subscription?.isExpired;
        const isCancelled = subscription?.isCancelled && !isExpired;

        let statusDisplay;
        if (isExpired) {
            statusDisplay = { icon: <FaTimesCircle />, text: 'Закінчена', className: styles.expired };
        } else if (!isFree) {
            statusDisplay = { icon: <FaCheckCircle />, text: 'Активна', className: styles.active };
        } else {
            statusDisplay = { icon: <FaTimesCircle />, text: 'Безкоштовна', className: styles.inactive };
        }

        return {
            isFree,
            isExpired,
            isCancelled,
            statusDisplay
        };
    }, [subscription]);

    if (subLoading || isUserLoading) {
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
                            <Link to="/profile/edit" className={`${styles.baseLinkButton} ${styles.actionButton}`}>
                                <FaEdit /> Редагувати профіль
                            </Link>
                            <Link to="/profile/password" className={`${styles.baseLinkButton} ${styles.actionButtonSecondary}`}>
                                <FaKey /> Змінити пароль
                            </Link>
                        </div>
                    </div>
                </section>

                <SubscriptionSection
                    subscription={subscription}
                    planInfo={planInfo}
                    features={features}
                    status={subscriptionStatus}
                    formatExpiryDate={formatExpiryDate}
                    styles={styles}
                />

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
                </div>

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