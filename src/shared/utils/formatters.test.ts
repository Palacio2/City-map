import { describe, it, expect } from 'vitest';
import { formatNumber, formatPrice, formatAirQuality, formatTranslatedText, formatDate, getCurrencyInfo } from './formatters';

describe('formatters at the dynamic data boundary', () => {
  it('matches countries exactly without treating Ukraine as UK', () => {
    expect(getCurrencyInfo('Poland').code).toBe('PLN');
    expect(getCurrencyInfo('Ukraine').code).toBe('UAH');
    expect(getCurrencyInfo('EU').code).toBe('EUR');
    expect(getCurrencyInfo('GBP').code).toBe('GBP');
  });
  it('preserves zero and finite numeric strings', () => {
    expect(formatNumber(0, 'en-US')).toBe('0');
    expect(formatNumber('1234.5', 'en-US')).toBe('1,234.5');
    expect(formatPrice(42, { code: 'USD', locale: 'en-US', symbol: '$' })).toBe('$42');
  });
  it('does not turn objects, booleans, partial numbers or missing data into statistics', () => {
    for (const value of [null, undefined, {}, [], true, '12oops', Infinity, NaN, '']) {
      expect(formatNumber(value)).toBe('');
      expect(formatPrice(value)).toBe('');
      expect(formatAirQuality(value, key => key)).toBe('');
      expect(formatDate(value)).toBe('');
    }
    expect(formatTranslatedText({}, key => key)).toBe('');
    expect(formatTranslatedText(false, key => key)).toBe('false');
  });
  it('maps valid air quality measurements', () => {
    expect(formatAirQuality(25, key => key)).toBe('common.enums.good');
    expect(formatAirQuality('125', key => key)).toBe('common.enums.bad');
  });
  it('formats valid dates according to the provided locale', () => {
    const iso = '2026-05-15T00:00:00Z';
    const enFormatted = formatDate(iso, 'en-US', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' });
    expect(enFormatted).toBe('5/15/2026');
  });
});
