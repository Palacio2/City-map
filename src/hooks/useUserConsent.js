import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@supabaseClient';
import { userConsentApi } from '@api/userConsentApi';
import { useAuth } from '@ui/authForm/AuthContext';

const SAFE_ROUTES = ['/terms', '/about', '/faq', '/contacts', '/payment-success', '/login'];

export const useUserConsent = () => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [hasConsent, setHasConsent] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  
  const isSafeRoute = SAFE_ROUTES.includes(location.pathname);
  const checkRunning = useRef(false);

  useEffect(() => {
    let mounted = true;

    const runCheck = async () => {
      if (authLoading || checkRunning.current) return;
      checkRunning.current = true;

      if (isAuthenticated && user) {
        const metaConsent = user.user_metadata?.rodo_accepted;
        
        if (metaConsent) {
          if (mounted) setHasConsent(true);
        }

        try {
          const dbStatus = await userConsentApi.checkConsentStatus();
          
          if (mounted) {
            if (dbStatus === false) {
              setHasConsent(false);
              localStorage.removeItem('rodo_accepted');
            } else {
              setHasConsent(true);
            }
          }
        } catch {
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

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user, authLoading]);

  const handleAcceptRodo = async () => {
    setHasConsent(true);
    localStorage.setItem('rodo_accepted', 'true');

    if (isAuthenticated && user) {
      const { error } = await userConsentApi.acceptConsent();
      
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