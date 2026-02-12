import React, { useEffect, useState, Suspense } from 'react'; // 👈 1. Додано Suspense
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@supabaseClient';

import Header from '@header/Header';
import Footer from '@footer/Footer';
import RodoModal from '@modals/RodoModal';
import CookieBanner from '@modals/CookieBanner';

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
          
          {/* 👇 2. Обгортаємо Outlet. Це вирішує проблему білого екрану */}
          <Suspense fallback={
            <div style={{ padding: '50px', textAlign: 'center', fontSize: '1.2rem', color: '#666' }}>
              ⏳ Завантаження сторінки...
            </div>
          }>
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