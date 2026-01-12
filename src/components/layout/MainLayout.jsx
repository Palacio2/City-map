import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '@header/Header';
import Footer from '@footer/Footer';
import { supabase } from '../../supabaseClient';
import RodoModal from '../../components/modals/RodoModal';
import CookieBanner from '../../components/modals/CookieBanner';
import { userConsentApi } from '../api/userConsentApi';
import styles from './MainLayout.module.css';

const SAFE_ROUTES = ['/terms', '/about', '/faq', '/contacts', '/payment-success'];

export default function MainLayout() {
  const { t } = useTranslation('rodo');
  const [showRodoModal, setShowRodoModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [authReady, setAuthReady] = useState(false); // 👈 НОВЕ

  const location = useLocation();

  const evaluateModalVisibility = (uid, consent) => {
    if (!uid || consent || SAFE_ROUTES.includes(location.pathname)) {
      setShowRodoModal(false);
    } else {
      setShowRodoModal(true);
    }
  };

  useEffect(() => {
    const updateState = async (session) => {
      if (session?.user) {
        setUserId(session.user.id);
        const consent = await userConsentApi.checkConsentStatus(session.user.id);
        setHasConsent(consent);
        evaluateModalVisibility(session.user.id, consent);
      } else {
        setUserId(null);
        setHasConsent(false);
        setShowRodoModal(false);
      }
      setAuthReady(true);
    };

    supabase.auth.getSession().then(({ data: { session } }) => updateState(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      updateState(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authReady) evaluateModalVisibility(userId, hasConsent);
  }, [location.pathname, userId, hasConsent, authReady]);

  const handleAcceptRodo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return window.location.href = '/login';

    const { error } = await userConsentApi.acceptConsent(user.id);
    if (!error) {
      setHasConsent(true);
      setShowRodoModal(false);
    } else alert(t('errors.save_failed'));
  };

  const handleDeclineRodo = async () => {
    await userConsentApi.signOut();
    window.location.href = '/';
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

      {authReady && <CookieBanner />}

      {authReady && showRodoModal && (
        <RodoModal
          onAccept={handleAcceptRodo}
          onDecline={handleDeclineRodo}
        />
      )}
    </div>
  );
}
