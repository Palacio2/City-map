import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@auth/context/AuthContext';
import { useSubscription } from '@subscription/context/SubscriptionContext';
import { FEATURES_CONFIG } from '@config/features';
import Loader from '@components/loader/Loader';
import SeoMeta from '@seo/SeoMeta';
import { useProfile } from './hooks/useProfile';
import { ProfileHeader } from './components/ProfileHeader';
import { QuickActions } from './components/QuickActions';
import { SubscriptionCard } from './components/SubscriptionCard';

const ProfileEditModal = lazy(() => import('./components/ProfileEditModal').then(m => ({ default: m.ProfileEditModal })));
const PasswordChangeModal = lazy(() => import('./components/PasswordChangeModal').then(m => ({ default: m.PasswordChangeModal })));
const BillingHistoryModal = lazy(() => import('./components/BillingHistoryModal').then(m => ({ default: m.BillingHistoryModal })));

export default function ProfilePage() {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { subscription } = useSubscription();
  const { profile, isLoading, isError } = useProfile();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

  const [hasOpenedEdit, setHasOpenedEdit] = useState(false);
  const [hasOpenedPassword, setHasOpenedPassword] = useState(false);
  const [hasOpenedBilling, setHasOpenedBilling] = useState(false);

  const openEditModal = () => { setHasOpenedEdit(true); setIsEditModalOpen(true); };
  const openPasswordModal = () => { setHasOpenedPassword(true); setIsPasswordModalOpen(true); };
  const openBillingModal = () => { setHasOpenedBilling(true); setIsBillingModalOpen(true); };

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
    <div className="bg-body py-6 sm:py-8 px-4 md:px-8 animate-fadeIn pb-24 relative min-h-[100dvh] overflow-hidden">
      <SeoMeta title={t('profile.title')} description={t('profile.title')} />
      
      <div className="fixed inset-0 pointer-events-none z-0 bg-body" />
      
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.15] dark:opacity-[0.25]"
        style={{
          backgroundImage: 'radial-gradient(var(--border-color) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 85%)',
        }}
      />
      
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }}
      />
      
      <div className="max-w-[768px] mx-auto flex flex-col gap-6 sm:gap-8 relative z-10">
        <div className="animate-slide-up-fade">
          <ProfileHeader profile={profile} />
        </div>
        
        <div className="animate-slide-up-fade">
          <QuickActions 
            onEditClick={openEditModal} 
            onChangePasswordClick={openPasswordModal}
            onBillingClick={openBillingModal}
          />
        </div>
        
        {FEATURES_CONFIG.ENABLE_SUBSCRIPTIONS_PAGE && (
          <div className="animate-slide-up-fade mt-2">
            <SubscriptionCard
              subscription={subscription}
              onManage={() => subscription.paidSubscriptions?.length ? openBillingModal() : navigate('/subscription')}
              isCancelling={false}
            />
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {hasOpenedEdit && (
          <ProfileEditModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
          />
        )}

        {hasOpenedPassword && (
          <PasswordChangeModal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
          />
        )}

        {hasOpenedBilling && (
          <BillingHistoryModal
            isOpen={isBillingModalOpen}
            onClose={() => setIsBillingModalOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
}
