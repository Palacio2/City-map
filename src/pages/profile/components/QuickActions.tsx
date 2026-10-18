import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaUserEdit, FaLock, FaCreditCard, FaChartBar, FaBalanceScale, FaChevronRight } from 'react-icons/fa';
import { useSubscription } from '@subscription/context/SubscriptionContext';
import type { QuickActionsProps } from '../types';

export const QuickActions = ({ onEditClick, onChangePasswordClick, onBillingClick }: QuickActionsProps = {}) => {
  const { t } = useTranslation('db');
  const { isPremium, isRealtor } = useSubscription();

  // Unified smooth animation classes for the card
  const cardAnimation = "flex items-center w-full justify-between p-4 bg-surface rounded-2xl shadow-xs transition-all duration-200 ease-in-out hover:bg-hover hover:scale-[1.01] active:scale-[0.98] group cursor-pointer border-none text-left";

  return (
    <div className="flex flex-col gap-3">
      
      {onEditClick ? (
        <button type="button" onClick={onEditClick} className={cardAnimation}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <FaUserEdit className="text-[1.1rem]" />
            </div>
            <div className="font-bold font-sans text-textMain text-[1rem]">
              {t('profile.actions.edit')}
            </div>
          </div>
          <FaChevronRight className="text-textSecondary/40 text-[0.85rem]" />
        </button>
      ) : (
        <Link to="/profile/edit" className={cardAnimation}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <FaUserEdit className="text-[1.1rem]" />
            </div>
            <div className="font-bold font-sans text-textMain text-[1rem]">
              {t('profile.actions.edit')}
            </div>
          </div>
          <FaChevronRight className="text-textSecondary/40 text-[0.85rem]" />
        </Link>
      )}

      {onChangePasswordClick ? (
        <button type="button" onClick={onChangePasswordClick} className={cardAnimation}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <FaLock className="text-[1.1rem]" />
            </div>
            <div className="font-bold font-sans text-textMain text-[1rem]">
              {t('profile.actions.change_password')}
            </div>
          </div>
          <FaChevronRight className="text-textSecondary/40 text-[0.85rem]" />
        </button>
      ) : (
        <Link to="/profile/password" className={cardAnimation}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <FaLock className="text-[1.1rem]" />
            </div>
            <div className="font-bold font-sans text-textMain text-[1rem]">
              {t('profile.actions.change_password')}
            </div>
          </div>
          <FaChevronRight className="text-textSecondary/40 text-[0.85rem]" />
        </Link>
      )}

      {onBillingClick ? (
        <button type="button" onClick={onBillingClick} className={cardAnimation}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <FaCreditCard className="text-[1.1rem]" />
            </div>
            <div className="font-bold font-sans text-textMain text-[1rem]">
              {t('profile.quick_actions.billing_title')}
            </div>
          </div>
          <FaChevronRight className="text-textSecondary/40 text-[0.85rem]" />
        </button>
      ) : (
        <Link to="/profile/billing-history" className={cardAnimation}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <FaCreditCard className="text-[1.1rem]" />
            </div>
            <div className="font-bold font-sans text-textMain text-[1rem]">
              {t('profile.quick_actions.billing_title')}
            </div>
          </div>
          <FaChevronRight className="text-textSecondary/40 text-[0.85rem]" />
        </Link>
      )}

      {isPremium && (
        <Link to="/profile/stats" className={cardAnimation}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <FaChartBar className="text-[1.1rem]" />
            </div>
            <div className="font-bold font-sans text-textMain text-[1rem]">
              {t('profile.quick_actions.stats_title')}
            </div>
          </div>
          <FaChevronRight className="text-textSecondary/40 text-[0.85rem]" />
        </Link>
      )}

      {isRealtor && (
        <Link to="/profile/stats/compare" className={cardAnimation}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <FaBalanceScale className="text-[1.1rem]" />
            </div>
            <div className="font-bold font-sans text-textMain text-[1rem]">
              {t('stats.comparison.title')}
            </div>
          </div>
          <FaChevronRight className="text-textSecondary/40 text-[0.85rem]" />
        </Link>
      )}
    </div>
  );
};