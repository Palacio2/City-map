import React from 'react';
import { useSubscription } from '@/pages/subscription/contex/SubscriptionContext';
import { FEATURES_CONFIG } from '@config/features';
import { FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface RequireSubscriptionProps {
  allowedPlans?: string[]; // e.g. ['realtor', 'investor']
  requirePremium?: boolean; // if true, any paid plan works
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLockFallback?: boolean;
}

export const RequireSubscription: React.FC<RequireSubscriptionProps> = ({ 
  allowedPlans = [], 
  requirePremium = false,
  children, 
  fallback = null,
  showLockFallback = false
}) => {
  const { t } = useTranslation('db');
  const { subscription, isFree } = useSubscription();
  const navigate = useNavigate();
  
  let hasAccess = false;
  
  if (requirePremium) {
    hasAccess = !isFree;
  } else if (allowedPlans.length > 0) {
    hasAccess = allowedPlans.includes(subscription.plan || 'free');
  } else {
    hasAccess = true;
  }
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (showLockFallback) {
    return (
      <div 
        className={`flex items-center gap-2 p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg opacity-70 transition-opacity ${FEATURES_CONFIG.ENABLE_SUBSCRIPTIONS_PAGE ? 'cursor-pointer hover:opacity-100' : ''}`}
        onClick={() => {
          if (FEATURES_CONFIG.ENABLE_SUBSCRIPTIONS_PAGE) {
            navigate('/subscription');
          }
        }}
      >
        <FaLock className="text-[var(--accent-color)]" />
        <span className="text-sm text-[var(--text-secondary)] font-medium">{t('subscription.required')}</span>
      </div>
    );
  }
  
  return <>{fallback}</>;
};
