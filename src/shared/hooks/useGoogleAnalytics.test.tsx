import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it } from 'vitest';
import { useGoogleAnalytics } from './useGoogleAnalytics';
import { setAnalyticsConsent } from '../utils/analyticsConsent';

const target = window as Window & { dataLayer?: unknown[][] };
function Tracker({ id }: { id: string }) { useGoogleAnalytics(id); return null; }
beforeEach(() => { localStorage.clear(); target.dataLayer = []; });
it('loads nothing before consent, responds to acceptance and stops on withdrawal', () => {
  render(<MemoryRouter><Tracker id="G-CONSENT1" /></MemoryRouter>);
  expect(document.querySelector('script[src*="G-CONSENT1"]')).toBeNull();
  act(() => setAnalyticsConsent(true));
  expect(document.querySelectorAll('script[src*="G-CONSENT1"]')).toHaveLength(1);
  expect(target.dataLayer?.some(row => row[0] === 'event')).toBe(true);
  const count = target.dataLayer!.length;
  act(() => setAnalyticsConsent(false));
  expect(target.dataLayer).toHaveLength(count);
  expect((window as unknown as Record<string, unknown>)['ga-disable-G-CONSENT1']).toBe(true);
});
it('never forwards query tokens, fragments, personalized map names or referrers', () => {
  setAnalyticsConsent(true);
  render(<MemoryRouter initialEntries={['/map/PL/private-city?email=private@example.org#token=secret']}><Tracker id="G-PRIVACY2" /></MemoryRouter>);
  const events = target.dataLayer?.filter(row => row[0] === 'event');
  expect(JSON.stringify(events)).toContain('"page_path":"/map"');
  expect(JSON.stringify(events)).not.toMatch(/private|secret|token|example/);
});
it('does not track recovery pages', () => {
  setAnalyticsConsent(true);
  render(<MemoryRouter initialEntries={['/auth/reset-password?code=secret']}><Tracker id="G-RECOVERY3" /></MemoryRouter>);
  expect(target.dataLayer?.filter(row => row[0] === 'event')).toHaveLength(0);
  expect(document.querySelector('script[src*="G-RECOVERY3"]')).toBeNull();
});
