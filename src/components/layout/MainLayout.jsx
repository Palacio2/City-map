import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Header from '@header/Header';
import Footer from '@footer/Footer';
import RodoModal from '@modals/RodoModal';
import CookieBanner from '@modals/CookieBanner';

import { useUserConsent } from '@hooks/useUserConsent';
import { useTimeTracker } from '@hooks/useTimeTracker';
import styles from './MainLayout.module.css';

export default function MainLayout() {
  const { t } = useTranslation('rodo');
  
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
    } catch (e) {
      alert(t('errors.save_failed'));
    }
  };

  return (
    <div className={styles.layout}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <Outlet />
        </div>
      </main>

      <Footer />

      {authReady && (
        <>
          <CookieBanner />
          
          {showRodoModal && (
            <RodoModal
              onAccept={onAccept}
              onDecline={handleDeclineRodo}
            />
          )}
        </>
      )}
    </div>
  );
}