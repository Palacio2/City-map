import React from 'react';
import { useSubscription } from '@/pages/subscription/contex/SubscriptionContext';
import { FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

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
  const { currentPlan, isFree, isRealtor, isInvestor } = useSubscription();
  const navigate = useNavigate();
  
  let hasAccess = false;
  
  if (requirePremium) {
    hasAccess = !isFree;
  } else if (allowedPlans.length > 0) {
    hasAccess = allowedPlans.includes(currentPlan || 'free');
  } else {
    hasAccess = true;
  }
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (showLockFallback) {
    return (
      <div 
        className="flex items-center gap-2 p-3 bg-surface border border-borderClient rounded-lg opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
        onClick={() => navigate('/subscription')}
      >
        <FaLock className="text-accent" />
        <span className="text-sm text-textSecondary font-medium">Потрібна підписка</span>
      </div>
    );
  }
  
  return <>{fallback}</>;
};
