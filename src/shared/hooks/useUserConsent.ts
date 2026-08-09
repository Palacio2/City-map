import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@supabaseClient';
import { userConsentApi } from '@api/userConsentApi';
import { useAuth } from '@auth/context/AuthContext';

const SAFE_ROUTES = ['/terms', '/about', '/faq', '/contacts', '/payment-success', '/login'];

export interface UseUserConsentReturn {
  showRodoModal: boolean;
  authReady: boolean;
  hasConsent: boolean;
  handleAcceptRodo: () => Promise<void>;
  handleDeclineRodo: () => Promise<void>;
}

export const useUserConsent = (): UseUserConsentReturn => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  
  const [hasConsent, setHasConsent] = useState<boolean>(() => {
    return localStorage.getItem('rodo_accepted') === 'true';
  });
  
  const [authReady, setAuthReady] = useState<boolean>(false);
  const isSafeRoute = SAFE_ROUTES.includes(location.pathname);
  const checkRunning = useRef(false);

  useEffect(() => {
    let mounted = true;
    
    const runCheck = async () => {
      if (authLoading || checkRunning.current) return;
      checkRunning.current = true;
      
      if (isAuthenticated && user) {
        try {
          const dbStatus = await userConsentApi.checkConsentStatus();
          if (mounted) {
            if (dbStatus) {
              setHasConsent(true);
              localStorage.setItem('rodo_accepted', 'true');
            } else {
              setHasConsent(false);
              localStorage.removeItem('rodo_accepted');
              if (user.user_metadata?.rodo_accepted) {
                await supabase.auth.updateUser({
                  data: { rodo_accepted: false }
                });
              }
            }
          }
        } catch {
          const metaConsent = user.user_metadata?.rodo_accepted;
          if (mounted) setHasConsent(!!metaConsent || localStorage.getItem('rodo_accepted') === 'true');
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
    localStorage.setItem('rodo_accepted', 'true');
    setHasConsent(true);
    if (isAuthenticated && user) {
      try {
        const { error } = await userConsentApi.acceptConsent();
        if (error) throw error;
        await supabase.auth.updateUser({
          data: { rodo_accepted: true }
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeclineRodo = async () => {
    localStorage.removeItem('rodo_accepted');
    if (isAuthenticated) {
      await signOut();
    }
    setHasConsent(false);
    window.location.href = '/';
  };

  return {
    showRodoModal: authReady && !hasConsent && !isSafeRoute,
    authReady,
    hasConsent,
    handleAcceptRodo,
    handleDeclineRodo
  };
};