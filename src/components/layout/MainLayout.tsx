import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/auth/AuthContext';

import Header from './Header';
import Footer from './Footer';

import RodoModal from '../modals/RodoModal';
import CookieBanner from '../modals/CookieBanner';
import Loader from '@components/loader/Loader';
import FeedbackWidget from '@components/feedbackWidget/FeedbackWidget';

import { useUserConsent } from '@hooks/useUserConsent';
import { useTimeTracker } from '@hooks/useTimeTracker';

export default function MainLayout() {
  const { t } = useTranslation('rodo');
  const { session } = useAuth();
  const { pathname } = useLocation();

  const { 
    showRodoModal, 
    hasConsent,
    authReady, 
    handleAcceptRodo, 
    handleDeclineRodo 
  } = useUserConsent();

  useTimeTracker();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  const onAccept = async () => {
    try {
      await handleAcceptRodo();
    } catch {
      alert(t('errors.save_failed'));
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-[var(--bg-body)] text-[var(--text-main)] transition-colors duration-300">
      <Header />
      
      <main className="flex-1 w-full flex flex-col relative px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-6 md:pt-8 pb-8 md:pb-10">
        <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 flex-1 flex flex-col justify-start">
          <Suspense fallback={<Loader fullScreen={true} text={t('loading')} />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      
      <Footer />
      <CookieBanner />

      {authReady && session && hasConsent && (
        <FeedbackWidget />
      )}

      {authReady && session && showRodoModal && (
        <RodoModal onAccept={onAccept} onDecline={handleDeclineRodo} />
      )}
    </div>
  );
}