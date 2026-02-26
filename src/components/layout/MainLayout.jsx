import React, { useEffect, useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@supabaseClient';

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
  const [session, setSession] = useState(null);

  const { 
    showRodoModal, 
    authReady, 
    handleAcceptRodo, 
    handleDeclineRodo 
  } = useUserConsent();

  useTimeTracker();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const onAccept = async () => {
    try {
      await handleAcceptRodo();
    } catch (e) {
      console.error(e);
      alert(t('errors.save_failed'));
    }
  };

  return (
    <div className={styles.layout}>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          
          <Suspense fallback={<Loader fullScreen={true} text="Завантаження..." />}>
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