import { it, expect, beforeEach } from 'vitest';
import { prepareAccountStorage } from './accountStorage';
beforeEach(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
it('purges legacy private values before first session, preserves unrelated settings and auth tokens', () => {
  window.localStorage.setItem('geo_analyzer_export_settings', 'phone-A');
  window.localStorage.setItem('draft_district_1', 'draft-A');
  window.localStorage.setItem('parser_city', 'city-A');
  window.localStorage.setItem('theme', 'dark'); window.localStorage.setItem('sb-project-auth-token', 'token');
  window.sessionStorage.setItem('tracked_districts_data', 'A');
  prepareAccountStorage('B');
  expect(window.localStorage.getItem('geo_analyzer_export_settings')).toBeNull();
  expect(window.localStorage.getItem('draft_district_1')).toBeNull(); expect(window.localStorage.getItem('parser_city')).toBeNull();
  expect(window.sessionStorage.getItem('tracked_districts_data')).toBeNull();
  expect(window.localStorage.getItem('theme')).toBe('dark'); expect(window.localStorage.getItem('sb-project-auth-token')).toBe('token');
});
it('keeps same-owner settings across reloads and clears them on logout', () => {
  prepareAccountStorage('A'); window.localStorage.setItem('geo_analyzer_export_settings', 'phone-A');
  prepareAccountStorage('A'); expect(window.localStorage.getItem('geo_analyzer_export_settings')).toBe('phone-A');
  prepareAccountStorage(null); expect(window.localStorage.getItem('geo_analyzer_export_settings')).toBeNull();
});
