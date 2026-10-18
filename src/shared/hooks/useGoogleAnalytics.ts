import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ANALYTICS_CONSENT_EVENT, hasAnalyticsConsent } from '../utils/analyticsConsent';

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
} & Record<`ga-disable-${string}`, boolean>;
const configuredIds = new Set<string>();

export const useGoogleAnalytics = (measurementId: string | undefined) => {
  const { pathname } = useLocation();
  const [consent, setConsent] = useState(hasAnalyticsConsent);
  useEffect(() => {
    const sync = () => setConsent(hasAnalyticsConsent());
    window.addEventListener('storage', sync);
    window.addEventListener(ANALYTICS_CONSENT_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, sync);
    };
  }, []);
  useEffect(() => {
    if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId) || measurementId.includes('XXXX')) return;
    const analytics = window as unknown as AnalyticsWindow;
    const page = pathname.startsWith('/map/') ? '/map' : pathname.startsWith('/city/') ? '/city' : pathname;
    const publicPage = ['/', '/map', '/city', '/about', '/faq', '/terms', '/contacts', '/subscription'].includes(page);
    analytics[`ga-disable-${measurementId}`] = !consent || !publicPage;
    if (!consent || !publicPage) return;
    if (!configuredIds.has(measurementId)) {
      analytics.dataLayer ??= [];
      analytics.gtag ??= (...args: unknown[]) => { analytics.dataLayer!.push(args); };
      analytics.gtag('js', new Date());
      analytics.gtag('config', measurementId, { send_page_view: false, allow_google_signals: false,
        allow_ad_personalization_signals: false, page_location: `${window.location.origin}${page}`,
        page_referrer: '', page_title: page });
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
      configuredIds.add(measurementId);
    }
    // Exclude secrets, personalized titles and account/admin routes; generalize map paths.
    analytics.gtag?.('event', 'page_view', {
      page_path: page, page_location: `${window.location.origin}${page}`,
      page_referrer: '', page_title: page,
    });
  }, [consent, measurementId, pathname]);
};
