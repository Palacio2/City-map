import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useGoogleAnalytics = (measurementId: string) => {
  const location = useLocation();

  useEffect(() => {
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('config', measurementId, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location, measurementId]);
};
