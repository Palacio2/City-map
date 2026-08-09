import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export interface CurrencyInfo {
  code: string;
  locale: string;
  symbol: string;
}

export const useFormat = () => {
  const { t, i18n } = useTranslation('db');

  const getCurrencyInfo = useCallback((countryName?: string | null): CurrencyInfo => {
    if (!countryName) return { code: 'PLN', locale: 'pl-PL', symbol: 'zł' };
    const normalized = countryName.toLowerCase().trim();
    if (['pl', 'poland', 'polska', 'польща'].some(k => normalized.includes(k))) return { code: 'PLN', locale: 'pl-PL', symbol: 'zł' };
    if (['de', 'fr', 'es', 'it', 'germany', 'france'].some(k => normalized.includes(k))) return { code: 'EUR', locale: 'de-DE', symbol: '€' };
    if (['us', 'usa', 'uk', 'gb', 'сша'].some(k => normalized.includes(k))) {
      if (['uk', 'gb'].some(k => normalized.includes(k))) return { code: 'GBP', locale: 'en-GB', symbol: '£' };
      return { code: 'USD', locale: 'en-US', symbol: '$' };
    }
    return { code: 'USD', locale: 'en-US', symbol: '$' };
  }, []);

  const formatPrice = useCallback((value: number | string | null | undefined, info?: CurrencyInfo): string => {
    const num = Number.parseFloat(String(value));
    if (Number.isNaN(num)) return String(value || '');
    const currency = info || { code: 'PLN', locale: 'pl-PL', symbol: 'zł' };
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      maximumFractionDigits: 0
    }).format(num);
  }, []);

  const formatNumber = useCallback((value: number | string | null | undefined): string => {
    const num = Number.parseFloat(String(value));
    if (Number.isNaN(num)) return String(value || '');
    return new Intl.NumberFormat(i18n.language || 'pl-PL').format(num);
  }, [i18n.language]);

  return { getCurrencyInfo, formatPrice, formatNumber, t };
};