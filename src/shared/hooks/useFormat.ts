import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getCurrencyInfo,
  formatPrice as baseFormatPrice,
  formatNumber as baseFormatNumber,
  formatDate as baseFormatDate,
  CurrencyInfo
} from '@/shared/utils/formatters';

export const useFormat = () => {
  const { t, i18n } = useTranslation('db');

  const formatPrice = useCallback((value: unknown, info?: CurrencyInfo): string => {
    return baseFormatPrice(value, info);
  }, []);

  const formatNumber = useCallback((value: unknown): string => {
    return baseFormatNumber(value, i18n.language || 'pl-PL');
  }, [i18n.language]);

  const formatDate = useCallback((value: unknown, options?: Intl.DateTimeFormatOptions, fallback: string = ''): string => {
    const formatted = baseFormatDate(value, i18n.language || 'uk-UA', options);
    return formatted || fallback;
  }, [i18n.language]);

  return { getCurrencyInfo, formatPrice, formatNumber, formatDate, t };
};

export type { CurrencyInfo };