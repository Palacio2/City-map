import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaUser, FaCrown, FaCreditCard, FaSync, FaCheckCircle, FaTimesCircle, FaChartLine, FaEdit, FaKey, FaExclamationTriangle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useSubscription } from '@subscription/SubscriptionContext';
import { useAuth } from '@/components/auth/AuthContext';
import { formatPhoneNumberIntl, parsePhoneNumber } from 'react-phone-number-input';
import AvatarUpload from './AvatarUpload';

const formatPhoneWithFlag = (phone) => {
  if (!phone) return '';
  const parsed = parsePhoneNumber(phone);
  if (!parsed) return phone;
  
  const countryCode = parsed.country; 
  const intlFormat = formatPhoneNumberIntl(phone); 
  
  const parts = intlFormat.split(' ');
  const countryCodePart = parts[0]; 
  const numberPart = parts.slice(1).join('-'); 
  
  return (
    <span className="inline-flex items-center gap-2">
      {countryCode && (
        <img 
          src={`https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`} 
          alt={countryCode}
          className="w-5 h-[15px] object-cover rounded-[2px] block shadow-sm"
        />
      )}
      <span>{countryCodePart} {numberPart}</span>
    </span>
  );
};

const SubscriptionSection = React.memo(({ subscription, features, isPremium }) => {
  const { t, i18n } = useTranslation('db'); 
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
      text: t('billing.status_map.active'), 
      class: 'bg-success/15 text-success' 
    };

    if (isExpired) {
      status = { 
        icon: <FaTimesCircle />, 
        text: t('billing.status_map.incomplete_expired'), 
        class: 'bg-danger/15 text-danger' 
      };
    } else if (isFree) {
      status = { 
        icon: <FaTimesCircle />, 
        text: t('billing.plans.free.name'), 
        class: 'bg-danger/15 text-danger' 
      };
    } else if (isScheduledForCancel) {
      status = { 
        icon: <FaExclamationTriangle />, 
        text: `${t('billing.status_map.active')} (${t('billing.ending_soon')} ${formattedExpires})`, 
        class: 'bg-success/15 text-success' 
      };
    }

    return {
      status,
      name: t(`billing.plans.${planKey}.name`),
      price: t(`billing.plans.${planKey}.price`),
      expires: formattedExpires
    };
  }, [subscription, t, i18n.language]);

  if (!statusInfo) return null;

  return (
    <section className="bg-surface border border-borderClient rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-borderClient">
        <div className="flex items-center gap-2">
          <FaCrown className="text-[1.1rem] text-accent" />
          <h2 className="font-heading text-[1.1rem] text-textMain m-0 font-bold">{t('billing.current_sub')}</h2>
        </div>
        {subscription.plan !== 'free' && (
           <span className={`text-[0.75rem] px-3 py-1 rounded-full font-semibold uppercase tracking-widest ${statusInfo.status.class}`}>
             {statusInfo.status.text}
           </span>
        )}
      </div>

      <div className="bg-body rounded-xl p-5 border border-borderClient">
        {(subscription.status === 'cancelled' || subscription.isExpired) && subscription.plan !== 'free' && (
          <div className={`p-3 rounded-lg mb-4 font-medium text-[0.85rem] flex items-center gap-2 border ${subscription.isExpired ? 'bg-danger/10 text-danger border-danger/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
            <FaExclamationTriangle className="shrink-0" />
            <span>
              {subscription.isExpired 
                ? t('billing.status_map.incomplete_expired') + ': ' + statusInfo.expires
                : t('billing.ending_soon') + ': ' + statusInfo.expires}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
            <div>
                <h3 className="font-heading text-xl text-textMain m-0 font-bold">{statusInfo.name}</h3>
                {!subscription.isExpired && subscription.plan !== 'free' && (
                    <p className="text-[0.8rem] text-textSecondary mt-1 m-0">{t('billing.next_payment')}: {statusInfo.expires}</p>
                )}
            </div>
            {!subscription.isExpired && subscription.plan !== 'free' && (
                <div className="text-xl font-bold text-accent">{statusInfo.price}</div>
            )}
        </div>

        {/* ВИПРАВЛЕНО: Шлях до перекладів функцій тепер відповідає базі даних */}
        <div className={`overflow-hidden transition-all duration-300 ease-out md:max-h-none md:mb-6 ${isExpanded ? 'max-h-[500px] mb-4' : 'max-h-0'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t border-borderClient">
                {features.map((featureKey) => (
                    <div key={featureKey} className="text-[0.9rem] text-textSecondary flex items-start gap-2 font-medium">
                        <FaCheckCircle className="text-success text-[0.8rem] mt-1 shrink-0" /> 
                        {/* Тут звертаємось до ключа subscription.features.назва */}
                        <span>{t(`subscription.features.${featureKey}`)}</span>
                    </div>
                ))}
            </div>
        </div>

        <button 
            className="bg-transparent border-none text-accent text-[0.85rem] font-semibold flex items-center justify-center gap-2 w-full py-2 cursor-pointer mb-4 md:hidden transition-colors hover:text-textMain" 
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {isExpanded ? t('profile.actions.hide_details') : t('profile.actions.show_details')}
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        <div className="w-full mt-2">
          <Link to="/subscription" className={`inline-flex items-center justify-center gap-2 leading-none p-3.5 md:px-6 md:py-3.5 rounded-lg font-heading font-bold uppercase tracking-widest text-[0.85rem] no-underline transition-all cursor-pointer text-center w-full md:w-auto shadow-sm hover:-translate-y-0.5 hover:shadow-md ${
            (isPremium || subscription.isExpired)
              ? 'bg-textMain text-body border border-textMain hover:bg-accent hover:border-accent hover:text-white' 
              : 'bg-gradient-to-br from-accent to-accent-hover text-white border-none hover:brightness-110'
          }`}>
            <FaSync className={isPremium || subscription.isExpired ? '' : 'animate-spin'} style={{ animationDuration: '3s' }} /> 
            {(isPremium || subscription.isExpired) 
              ? t('billing.update_plan') 
              : t('billing.plans.premium.name')}
          </Link>
        </div>
      </div>
    </section>
  );
});

export default function Profile() {
  const { t } = useTranslation('db'); 
  const { user } = useAuth();
  const [userData, setUserData] = useState({ id: null, name: '', email: '', phone: '', avatar_url: null });
  
  const { subscription, isPremium, getFeatureKeys } = useSubscription();

  useEffect(() => {
    if (user) {
      setUserData({
        id: user.id,
        name: user.user_metadata?.full_name || t('profile.labels.full_name'),
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        avatar_url: user.user_metadata?.avatar_url || null
      });
    }
  }, [user, t]);

  const features = useMemo(() => {
    if (subscription && typeof getFeatureKeys === 'function') {
      // Отримуємо список ключів (roi_calculator, white_label_pdf і т.д.)
      return getFeatureKeys();
    }
    return [];
  }, [subscription, getFeatureKeys]);

  return (
    <div className="min-h-[100dvh] bg-body p-4 pt-[calc(var(--header-height)+1.5rem)] md:p-8 md:pt-[calc(var(--header-height)+2rem)] animate-fadeIn font-body">
      
      <div className="text-center mb-6">
        <h1 className="font-heading text-[1.75rem] md:text-[2.25rem] text-textMain m-0 font-bold tracking-tight">
          {t('header.profile')}
        </h1>
      </div>

      <div className="max-w-[900px] mx-auto flex flex-col gap-6">
        
        <section className="bg-surface border border-borderClient rounded-2xl p-5 md:p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-borderClient">
            <div className="flex items-center gap-2">
                <FaUser className="text-[1.1rem] text-accent" /> 
                <h2 className="font-heading text-[1.1rem] text-textMain m-0 font-bold">{t('profile.edit_page.main_info')}</h2>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:justify-between gap-5 items-start md:items-center">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <AvatarUpload 
                    uid={userData.id}
                    url={userData.avatar_url}
                    onUpload={(url) => setUserData(prev => ({ ...prev, avatar_url: url }))}
                />
                
                <div className="flex flex-col gap-1 overflow-hidden flex-1">
                    <h3 className="text-[1.15rem] font-bold text-textMain m-0 whitespace-nowrap overflow-hidden text-ellipsis">{userData.name}</h3>
                    <span className="text-[0.85rem] text-textSecondary whitespace-nowrap overflow-hidden text-ellipsis font-medium">{userData.email}</span>
                    <div className="text-[0.85rem] text-textSecondary opacity-80 font-medium mt-0.5">
                        {userData.phone ? formatPhoneWithFlag(userData.phone) : ''}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap md:flex-col justify-start md:justify-center items-start md:items-end gap-2 md:gap-2.5 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-borderClient md:border-t-0">
              <Link to="/profile/edit" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[0.85rem] font-bold text-textSecondary bg-transparent border border-borderClient no-underline transition-all hover:text-textMain hover:border-textMain hover:bg-hover hover:-translate-y-[1px] shadow-sm hover:shadow-md">
                <FaEdit /> <span>{t('profile.actions.edit')}</span>
              </Link>
              <Link to="/profile/password" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[0.85rem] font-bold text-textSecondary bg-transparent border border-borderClient no-underline transition-all hover:text-textMain hover:border-textMain hover:bg-hover hover:-translate-y-[1px] shadow-sm hover:shadow-md">
                <FaKey /> <span>{t('profile.actions.change_password')}</span>
              </Link>
            </div>
          </div>
        </section>

        <SubscriptionSection 
          subscription={subscription} 
          features={features} 
          isPremium={isPremium}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-2">
          {isPremium && (
            <Link to="/profile/stats" className="group bg-surface border border-borderClient rounded-2xl p-5 md:p-6 no-underline flex flex-row items-center justify-start gap-4 text-left transition-all shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-accent">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-[1.2rem] text-accent shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-white shadow-sm">
                  <FaChartLine />
              </div>
              <span className="font-heading text-[1rem] font-bold text-textMain leading-[1.2] transition-colors group-hover:text-accent">{t('profile.quick_actions.stats_title')}</span>
            </Link>
          )}
          
          <Link to="/profile/billing-history" className="group bg-surface border border-borderClient rounded-2xl p-5 md:p-6 no-underline flex flex-row items-center justify-start gap-4 text-left transition-all shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-accent">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-[1.2rem] text-accent shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-white shadow-sm">
                <FaCreditCard />
            </div>
            <span className="font-heading text-[1rem] font-bold text-textMain leading-[1.2] transition-colors group-hover:text-accent">{t('profile.quick_actions.billing_title')}</span>
          </Link>
        </div>
        
      </div>
    </div>
  );
}