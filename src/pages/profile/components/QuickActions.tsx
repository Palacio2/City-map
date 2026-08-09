import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaUserEdit, FaLock, FaCreditCard, FaChartBar, FaBalanceScale } from 'react-icons/fa';
import { useSubscription } from '@subscription/contex/SubscriptionContext';

export const QuickActions = () => {
  const { t } = useTranslation('db');
  const { isPremium, isRealtor } = useSubscription();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Link 
        to="/profile/edit" 
        className="flex items-center gap-4 p-5 bg-surface border border-borderClient rounded-xl transition-all hover:-translate-y-1 hover:border-accent hover:shadow-md group"
      >
        <div className="w-12 h-12 rounded-full bg-hover flex items-center justify-center text-textSecondary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
          <FaUserEdit className="text-xl" />
        </div>
        <div>
          <h4 className="font-heading font-bold text-textMain m-0 text-base">
            {t('profile.actions.edit')}
          </h4>
        </div>
      </Link>

      <Link 
        to="/profile/password" 
        className="flex items-center gap-4 p-5 bg-surface border border-borderClient rounded-xl transition-all hover:-translate-y-1 hover:border-accent hover:shadow-md group"
      >
        <div className="w-12 h-12 rounded-full bg-hover flex items-center justify-center text-textSecondary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
          <FaLock className="text-xl" />
        </div>
        <div>
          <h4 className="font-heading font-bold text-textMain m-0 text-base">
            {t('profile.actions.change_password')}
          </h4>
        </div>
      </Link>

      <Link 
        to="/profile/billing-history" 
        className="flex items-center gap-4 p-5 bg-surface border border-borderClient rounded-xl transition-all hover:-translate-y-1 hover:border-accent hover:shadow-md group"
      >
        <div className="w-12 h-12 rounded-full bg-hover flex items-center justify-center text-textSecondary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
          <FaCreditCard className="text-xl" />
        </div>
        <div>
          <h4 className="font-heading font-bold text-textMain m-0 text-base">
            {t('profile.quick_actions.billing_title')}
          </h4>
        </div>
      </Link>

      {isPremium && (
        <Link 
          to="/profile/stats" 
          className="flex items-center gap-4 p-5 bg-surface border border-borderClient rounded-xl transition-all hover:-translate-y-1 hover:border-accent hover:shadow-md group"
        >
          <div className="w-12 h-12 rounded-full bg-hover flex items-center justify-center text-textSecondary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
            <FaChartBar className="text-xl" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-textMain m-0 text-base">
              {t('profile.quick_actions.stats_title')}
            </h4>
          </div>
        </Link>
      )}

      {isRealtor && (
        <Link 
          to="/profile/stats/compare" 
          className="flex items-center gap-4 p-5 bg-surface border border-borderClient rounded-xl transition-all hover:-translate-y-1 hover:border-accent hover:shadow-md group"
        >
          <div className="w-12 h-12 rounded-full bg-hover flex items-center justify-center text-textSecondary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
            <FaBalanceScale className="text-xl" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-textMain m-0 text-base">
              {t('stats.comparison.title')}
            </h4>
          </div>
        </Link>
      )}
    </div>
  );
};