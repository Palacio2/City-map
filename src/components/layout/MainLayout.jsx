import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@ui/authForm/AuthContext';

import Header from '@header/Header';
import Footer from '@footer/Footer';
import RodoModal from '@modals/RodoModal';
import CookieBanner from '@modals/CookieBanner';
import Loader from '@components/loader/Loader';

import { useUserConsent } from '@hooks/useUserConsent';
import { useTimeTracker } from '@hooks/useTimeTracker';
import styles from './MainLayout.module.css';

export default function MainLayout() {
  const { t } = useTranslation('rodo');
  const { session } = useAuth();

  const { 
    showRodoModal, 
    authReady, 
    handleAcceptRodo, 
    handleDeclineRodo 
  } = useUserConsent();

  useTimeTracker();

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

      {authReady && session && showRodoModal && (
        <RodoModal
          onAccept={onAccept}
          onDecline={handleDeclineRodo}
        />
      )}
    </div>
  );
}