import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@supabaseClient';
import { userConsentApi } from '@api/userConsentApi';

const SAFE_ROUTES = ['/terms', '/about', '/faq', '/contacts', '/payment-success'];

export const useUserConsent = () => {
  const location = useLocation();
  const [showRodoModal, setShowRodoModal] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const checkConsent = async (session) => {
      if (session?.user) {
        const uid = session.user.id;
        const hasConsent = await userConsentApi.checkConsentStatus(uid);
        
        const isSafeRoute = SAFE_ROUTES.includes(location.pathname);
        setShowRodoModal(!hasConsent && !isSafeRoute);
      } else {
        setShowRodoModal(false);
      }
      setAuthReady(true);
    };

    supabase.auth.getSession().then(({ data: { session } }) => checkConsent(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkConsent(session);
    });

    return () => subscription.unsubscribe();
  }, [location.pathname]);

  const handleAcceptRodo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return window.location.href = '/login';

    const { error } = await userConsentApi.acceptConsent(user.id);
    if (!error) {
      setShowRodoModal(false);
    } else {
      throw new Error('Failed to save consent');
    }
  };

  const handleDeclineRodo = async () => {
    await userConsentApi.signOut();
    window.location.href = '/';
  };

  return { 
    showRodoModal, 
    authReady, 
    handleAcceptRodo, 
    handleDeclineRodo 
  };
};