import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaUser, FaCrown, FaCreditCard, FaSync, FaCheckCircle, FaTimesCircle, FaChartLine, FaLock, FaEdit, FaKey } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';
import { formatPhoneNumber } from '../../utils/phoneUtils';
import { PLAN_KEY_MAP } from '../../utils/billing';
import styles from './Profile.module.css';

const SubscriptionSection = ({ subscription, features, isPremium }) => {
    const { t, i18n } = useTranslation(['profile', 'subscription']);

    const statusInfo = useMemo(() => {
        if (!subscription) return null;
        
        const isFree = subscription.plan === 'free';
        const isExpired = subscription.isExpired;
        const currentLang = i18n.language || 'uk-UA';
        
        const planKey = PLAN_KEY_MAP[subscription.plan] || 'free';
        
        let status = { 
            icon: <FaCheckCircle />, 
            text: t('profile:subscription.status.active'), 
            class: styles.active 
        };

        if (isExpired) {
            status = { 
                icon: <FaTimesCircle />, 
                text: t('profile:subscription.status.expired'), 
                class: styles.expired 
            };
        } else if (isFree) {
            status = { 
                icon: <FaTimesCircle />, 
                text: t('profile:subscription.status.free'), 
                class: styles.inactive 
            };
        }

        return {
            status,
            name: t(`subscription:subscription.plans.${planKey}.name`),
            price: t(`subscription:subscription.plans.${planKey}.price`),
            expires: subscription.expiresAt 
                ? new Date(subscription.expiresAt).toLocaleDateString(currentLang) 
                : null
        };
    }, [subscription, t, i18n.language]);

    if (!statusInfo) return null;

    return (
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <FaCrown className={styles.sectionIcon} />
                <h2>{t('profile:subscription.title')}</h2>
            </div>
            <div className={styles.subscriptionCard}>
                {(subscription.isCancelled || subscription.isExpired) && (
                    <div className={`${styles.alertNotice} ${subscription.isExpired ? styles.expiredNotice : styles.cancellationNotice}`}>
                        {subscription.isExpired 
                            ? t('profile:subscription.expired_notice', { date: statusInfo.expires })
                            : t('profile:subscription.cancelled_notice', { date: statusInfo.expires })}
                    </div>
                )}

                <div className={styles.subscriptionHeader}>
                    <div className={styles.planInfo}>
                        <h3 className={styles.planName}>{t('profile:subscription.plan', { plan: statusInfo.name })}</h3>
                        <span className={`${styles.status} ${statusInfo.status.class}`}>
                            {statusInfo.status.icon} {statusInfo.status.text}
                        </span>
                    </div>
                    {!subscription.isExpired && subscription.plan !== 'free' && (
                        <div className={styles.planPrice}>
                            <span className={styles.price}>{statusInfo.price}</span>
                            <span className={styles.billingDate}>{t('profile:subscription.expires', { date: statusInfo.expires })}</span>
                        </div>
                    )}
                </div>

                <div className={styles.featuresList}>
                    <h4>{t('profile:subscription.features_title')}</h4>
                    <div className={styles.featuresGrid}>
                        {features.map((feature, index) => (
                            <div key={index} className={styles.featureItem}>
                                <FaCheckCircle className={styles.featureIcon} /> <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.subscriptionActions}>
                    <Link to="/subscription" className={`${styles.baseLinkButton} ${styles.primaryButton}`}>
                        <FaSync /> 
                        {(isPremium || subscription.isExpired) 
                            ? t('profile:actions.manage_subscription') 
                            : t('profile:actions.choose_plan')}
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default function Profile() {
    const { t } = useTranslation(['profile', 'subscription']);
    const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
    const [isUserLoading, setIsUserLoading] = useState(true);
    
    const { subscription, isLoading: subLoading, isPremium, getFeatureKeys } = useSubscription();

    useEffect(() => {
        let mounted = true;
        const fetchUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && mounted) {
                    setUserData({
                        name: user.user_metadata?.full_name || t('profile:labels.user'),
                        email: user.email || '',
                        phone: user.user_metadata?.phone || ''
                    });
                }
            } catch (e) {
                console.error("User fetch error", e);
            } finally {
                if (mounted) setIsUserLoading(false);
            }
        };
        fetchUserData();
        return () => { mounted = false; };
    }, [t]);

    const features = useMemo(() => {
        if (subscription && typeof getFeatureKeys === 'function') {
            const keys = getFeatureKeys();
            return keys.slice(0, 8).map(key => t(`subscription:subscription.features.${key}`));
        }
        return [];
    }, [subscription, getFeatureKeys, t]);

    if (subLoading || isUserLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>{t('profile:billing_page.loading')}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('profile:title')}</h1>
                <p className={styles.subtitle}>{t('profile:subtitle')}</p>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <FaUser className={styles.sectionIcon} /> <h2>{t('profile:user_profile')}</h2>
                    </div>
                    <div className={styles.profileGrid}>
                        <div className={styles.profileInfo}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>{t('profile:labels.name')}</span>
                                <span className={styles.infoValue}>{userData.name}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>{t('profile:labels.email')}</span>
                                <span className={styles.infoValue}>{userData.email}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>{t('profile:labels.phone')}</span>
                                <span className={styles.infoValue}>
                                    {userData.phone ? formatPhoneNumber(userData.phone) : '---'}
                                </span>
                            </div>
                        </div>
                        <div className={styles.profileActions}>
                            <Link to="/profile/edit" className={`${styles.baseLinkButton} ${styles.actionButton}`}>
                                <FaEdit /> {t('profile:actions.edit')}
                            </Link>
                            <Link to="/profile/password" className={`${styles.baseLinkButton} ${styles.actionButtonSecondary}`}>
                                <FaKey /> {t('profile:actions.change_password')}
                            </Link>
                        </div>
                    </div>
                </section>

                <SubscriptionSection 
                    subscription={subscription} 
                    features={features} 
                    isPremium={isPremium}
                />

                <div className={styles.quickActions}>
                    <Link 
                        to={isPremium ? "/profile/stats" : "#"} 
                        className={`${styles.quickActionCard} ${!isPremium ? styles.lockedCard : ''}`}
                    >
                         {!isPremium && (
                             <div className={styles.lockOverlay}>
                                 <FaLock className={styles.lockIcon} /> {t('profile:quick_actions.locked')}
                             </div>
                         )}
                        <FaChartLine className={styles.quickActionIcon} />
                        <div>
                            <h3>{t('profile:quick_actions.stats_title')}</h3>
                            <p>{t('profile:quick_actions.stats_desc')}</p>
                        </div>
                    </Link>
                    
                    <Link to="/profile/billing-history" className={styles.quickActionCard}>
                        <FaCreditCard className={styles.quickActionIcon} />
                        <div>
                            <h3>{t('profile:quick_actions.billing_title')}</h3>
                            <p>{t('profile:quick_actions.billing_desc')}</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}