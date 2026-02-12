import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaUser, FaCrown, FaCreditCard, FaSync, FaCheckCircle, FaTimesCircle, FaChartLine, FaEdit, FaKey, FaExclamationTriangle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { supabase } from '@supabaseClient';
import { useSubscription } from '@subscription/SubscriptionContext';
import { formatPhoneNumber } from '@utils/phoneUtils';
import AvatarUpload from './AvatarUpload';
import styles from './Profile.module.css';

const SubscriptionSection = React.memo(({ subscription, features, isPremium }) => {
  const { t, i18n } = useTranslation(['profile', 'subscription']);
  const [isExpanded, setIsExpanded] = useState(false);

  const statusInfo = useMemo(() => {
    if (!subscription) return null;
    
    const isFree = subscription.plan === 'free';
    const isExpired = subscription.isExpired;
    const currentLang = i18n.language || 'uk-UA';
    const planKey = subscription.plan || 'free'; 
    const isScheduledForCancel = subscription.cancel_at && new Date(subscription.cancel_at) > new Date();
    
    const formattedExpires = subscription.expiresAt 
      ? new Date(subscription.expiresAt).toLocaleDateString(currentLang) 
      : null;

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
    } else if (isScheduledForCancel) {
      status = { 
        icon: <FaExclamationTriangle />, 
        text: `${t('profile:subscription.status.active')} (${t('profile:subscription.expires_short', { date: formattedExpires })})`, 
        class: styles.active 
      };
    }

    return {
      status,
      name: t(`subscription:subscription.plans.${planKey}.name`),
      price: t(`subscription:subscription.plans.${planKey}.price`),
      expires: formattedExpires
    };
  }, [subscription, t, i18n.language]);

  if (!statusInfo) return null;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerTitleRow}>
          <FaCrown className={styles.sectionIcon} />
          <h2>{t('profile:subscription.title')}</h2>
        </div>
        {subscription.plan !== 'free' && (
           <span className={`${styles.statusBadge} ${statusInfo.status.class}`}>
             {statusInfo.status.text}
           </span>
        )}
      </div>

      <div className={styles.subscriptionCard}>
        {(subscription.status === 'cancelled' || subscription.isExpired) && subscription.plan !== 'free' && (
          <div className={`${styles.alertNotice} ${subscription.isExpired ? styles.expiredNotice : styles.cancellationNotice}`}>
            {subscription.isExpired 
              ? t('profile:subscription.expired_notice', { date: statusInfo.expires })
              : t('profile:subscription.cancelled_notice', { date: statusInfo.expires })}
          </div>
        )}

        <div className={styles.subscriptionMainInfo}>
            <div>
                <h3 className={styles.planName}>{statusInfo.name}</h3>
                {!subscription.isExpired && subscription.plan !== 'free' && (
                    <p className={styles.billingDate}>{t('profile:expires', { date: statusInfo.expires })}</p>
                )}
            </div>
            {!subscription.isExpired && subscription.plan !== 'free' && (
                <div className={styles.priceTag}>{statusInfo.price}</div>
            )}
        </div>

        <div className={`${styles.featuresContainer} ${isExpanded ? styles.expanded : ''}`}>
            <div className={styles.featuresList}>
                {features.map((featureKey, index) => (
                    <div key={index} className={styles.featureItem}>
                        <FaCheckCircle className={styles.featureIcon} /> 
                        <span>{t(`subscription:subscription.features.${featureKey}`)}</span>
                    </div>
                ))}
            </div>
        </div>

        <button 
            className={styles.expandButton} 
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {isExpanded ? t('profile:actions.hide_details') : t('profile:actions.show_details')}
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>

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
});

export default function Profile() {
  const { t } = useTranslation(['profile', 'subscription']);
  const [userData, setUserData] = useState({ id: null, name: '', email: '', phone: '', avatar_url: null });
  
  const { subscription, isPremium, getFeatureKeys } = useSubscription();

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserData({
          id: user.id,
          name: user.user_metadata?.full_name || t('profile:labels.user'),
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          avatar_url: user.user_metadata?.avatar_url || null
        });
      }
    } catch (e) {
      console.error("Error fetching user data:", e);
    }
  }, [t]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const features = useMemo(() => {
    if (subscription && typeof getFeatureKeys === 'function') {
      return getFeatureKeys().slice(0, 8);
    }
    return [];
  }, [subscription, getFeatureKeys]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('profile:title')}</h1>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerTitleRow}>
                <FaUser className={styles.sectionIcon} /> <h2>{t('profile:user_profile')}</h2>
            </div>
          </div>
          
          <div className={styles.profileCompactContainer}>
            <div className={styles.profileInfoCompact}>
                <AvatarUpload 
                    uid={userData.id}
                    url={userData.avatar_url}
                    onUpload={(url) => setUserData(prev => ({ ...prev, avatar_url: url }))}
                />
                
                <div className={styles.textInfo}>
                    <h3 className={styles.userName}>{userData.name}</h3>
                    <span className={styles.userEmail}>{userData.email}</span>
                    <span className={styles.userPhone}>{userData.phone ? formatPhoneNumber(userData.phone) : ''}</span>
                </div>
            </div>

            <div className={styles.profileActionsGrid}>
              <Link to="/profile/edit" className={`${styles.baseLinkButton} ${styles.actionButton}`}>
                <FaEdit /> <span>{t('profile:actions.edit')}</span>
              </Link>
              <Link to="/profile/password" className={`${styles.baseLinkButton} ${styles.actionButtonSecondary}`}>
                <FaKey /> <span>{t('profile:actions.change_password')}</span>
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
          {isPremium && (
            <Link to="/profile/stats" className={styles.quickActionCard}>
              <div className={styles.iconWrapper}>
                  <FaChartLine />
              </div>
              <span className={styles.actionTitle}>{t('profile:quick_actions.stats_title')}</span>
            </Link>
          )}
          
          <Link to="/profile/billing-history" className={styles.quickActionCard}>
            <div className={styles.iconWrapper}>
                <FaCreditCard />
            </div>
            <span className={styles.actionTitle}>{t('profile:quick_actions.billing_title')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}