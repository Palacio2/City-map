import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@ui/authForm/AuthContext';

import Header from '@header/Header';
import Footer from '@footer/Footer';
import RodoModal from '@modals/RodoModal';
import CookieBanner from '@modals/CookieBanner';
import Loader from '@components/loader/Loader';
import FeedbackWidget from '@components/feedbackWidget/FeedbackWidget';

import { useUserConsent } from '@hooks/useUserConsent';
import { useTimeTracker } from '@hooks/useTimeTracker';
import styles from './MainLayout.module.css';

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
    <div className={styles.layout}>
      <Header />
      
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
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