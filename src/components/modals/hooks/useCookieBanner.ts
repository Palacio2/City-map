import { useState, useEffect, useCallback } from 'react';

export const useCookieBanner = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = useCallback(() => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
  }, []);

  const closeBanner = useCallback(() => {
    setIsVisible(false);
  }, []);

  return { isVisible, acceptCookies, closeBanner };
};