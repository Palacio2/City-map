import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@supabaseClient';
import { userConsentApi } from '@api/userConsentApi';

const SAFE_ROUTES = ['/terms', '/about', '/faq', '/contacts', '/payment-success', '/login'];

export const useUserConsent = () => {
  const location = useLocation();
  const [hasConsent, setHasConsent] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  
  const isSafeRoute = SAFE_ROUTES.includes(location.pathname);
  const checkRunning = useRef(false);

  useEffect(() => {
    let mounted = true;

    const runCheck = async () => {
      if (checkRunning.current) return;
      checkRunning.current = true;

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const metaConsent = session.user.user_metadata?.rodo_accepted;
        
        if (metaConsent) {
          if (mounted) setHasConsent(true);
        }

        try {
          const dbStatus = await userConsentApi.checkConsentStatus(session.user.id);
          
          if (mounted) {
            if (dbStatus === false) {
              setHasConsent(false);
              localStorage.removeItem('rodo_accepted');
            } else {
              setHasConsent(true);
            }
          }
        } catch (e) {
          console.error(e);
          if (mounted && metaConsent) setHasConsent(true);
        }
      } else {
        const localConsent = localStorage.getItem('rodo_accepted');
        if (mounted) setHasConsent(localConsent === 'true');
      }
      
      if (mounted) setAuthReady(true);
      checkRunning.current = false;
    };

    runCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        runCheck();
      } else if (event === 'SIGNED_OUT') {
        setHasConsent(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleAcceptRodo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    setHasConsent(true);
    localStorage.setItem('rodo_accepted', 'true');

    if (user) {
      const { error } = await userConsentApi.acceptConsent(user.id);
      
      if (!error) {
        await supabase.auth.updateUser({
          data: { rodo_accepted: true }
        });
      } else {
        setHasConsent(false);
        localStorage.removeItem('rodo_accepted');
        throw new Error('Failed to save consent');
      }
    }
  };

  const handleDeclineRodo = async () => {
    await userConsentApi.signOut();
    localStorage.removeItem('rodo_accepted');
    window.location.href = '/';
  };

  return { 
    showRodoModal: authReady && !hasConsent && !isSafeRoute,
    authReady, 
    handleAcceptRodo, 
    handleDeclineRodo 
  };
};