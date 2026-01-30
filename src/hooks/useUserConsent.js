import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@supabaseClient';
import { userConsentApi } from '@api/userConsentApi';

const SAFE_ROUTES = ['/terms', '/about', '/faq', '/contacts', '/payment-success', '/login'];

export const useUserConsent = () => {
  const location = useLocation();
  const [hasConsent, setHasConsent] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  
  const consentChecked = useRef(false);

  useEffect(() => {
    const checkConsent = async () => {
      if (sessionStorage.getItem('rodo_accepted') === 'true') {
        setHasConsent(true);
        setAuthReady(true);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        if (consentChecked.current) return;
        
        try {
            const status = await userConsentApi.checkConsentStatus(session.user.id);
            if (status) {
                setHasConsent(true);
                sessionStorage.setItem('rodo_accepted', 'true');
            }
        } catch (e) {
            console.error(e);
        } finally {
            consentChecked.current = true;
        }
      }
      setAuthReady(true);
    };

    checkConsent();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
         consentChecked.current = false;
         checkConsent();
      } else if (event === 'SIGNED_OUT') {
         setHasConsent(false);
         sessionStorage.removeItem('rodo_accepted');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isSafeRoute = SAFE_ROUTES.includes(location.pathname);
  const showRodoModal = authReady && !hasConsent && !isSafeRoute;

  const handleAcceptRodo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await userConsentApi.acceptConsent(user.id);
    if (!error) {
      setHasConsent(true);
      sessionStorage.setItem('rodo_accepted', 'true');
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