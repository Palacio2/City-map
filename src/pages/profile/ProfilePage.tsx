import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@auth/context/AuthContext';
import { useSubscription } from '@subscription/contex/SubscriptionContext';
import { FEATURES_CONFIG } from '@config/features';
import Loader from '@components/loader/Loader';
import SeoMeta from '@seo/SeoMeta';
import { useProfile } from './hooks/useProfile';
import { ProfileHeader } from './components/ProfileHeader';
import { QuickActions } from './components/QuickActions';
import { SubscriptionCard } from './components/SubscriptionCard';

export default function ProfilePage() {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { subscription } = useSubscription();
  const { profile, isLoading, isError } = useProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  if (isLoading) return <Loader fullScreen text={t('common.loading')} />;

  if (isError || !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-danger font-heading text-2xl mb-4">{t('profile.errors.unknown_error')}</h2>
        <button
          type="button"
          onClick={handleSignOut}
          className="px-6 py-3 bg-surface border border-borderClient rounded-xl font-bold hover:bg-hover transition-colors"
        >
          {t('header.logout')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-body py-8 px-4 md:px-8 animate-fadeIn">
      <SeoMeta title={t('profile.title')} description={t('profile.title')} />
      <div className="max-w-[1200px] mx-auto flex justify-between items-center mb-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-textMain m-0 tracking-tight">
          {t('profile.title')}
        </h1>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 px-5 py-2.5 bg-danger/10 text-danger border border-danger/20 rounded-xl font-heading font-bold text-sm uppercase tracking-widest transition-all hover:bg-danger hover:text-white"
        >
          <FaSignOutAlt className="text-lg" />
          <span className="hidden sm:inline">{t('header.logout')}</span>
        </button>
      </div>
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
        <div className="flex flex-col gap-8">
          <ProfileHeader profile={profile} />
          <QuickActions />
        </div>
        <div className="w-full">
          {FEATURES_CONFIG.ENABLE_SUBSCRIPTIONS_PAGE && (
            <SubscriptionCard
              subscription={subscription}
              onManage={() => navigate('/subscription')}
              isCancelling={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}