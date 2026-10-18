export const ANALYTICS_CONSENT_KEY = 'cookie_consent';
export const ANALYTICS_CONSENT_EVENT = 'analytics-consent-changed';

export function hasAnalyticsConsent() {
  try { return localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'true'; }
  catch { return false; }
}

export function setAnalyticsConsent(accepted: boolean) {
  try { localStorage.setItem(ANALYTICS_CONSENT_KEY, String(accepted)); }
  catch { /* Unavailable storage keeps analytics disabled. */ }
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
}
