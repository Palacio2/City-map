import { useState, useEffect, useCallback } from 'react';
import { ANALYTICS_CONSENT_KEY, setAnalyticsConsent } from '@shared/utils/analyticsConsent';

export const useCookieBanner = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    let consent: string | null = null;
    try { consent = localStorage.getItem(ANALYTICS_CONSENT_KEY); } catch { /* Show the choice when storage is unavailable. */ }
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = useCallback(() => {
    setAnalyticsConsent(true);
    setIsVisible(false);
  }, []);

  const closeBanner = useCallback(() => {
    setAnalyticsConsent(false);
    setIsVisible(false);
  }, []);

  return { isVisible, acceptCookies, closeBanner };
};
