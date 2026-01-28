import React from 'react';
import { FaCheck, FaTimes, FaMinus } from 'react-icons/fa';

export const getValue = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const getCurrencyCode = (countryName) => {
  if (!countryName) return 'USD';
  const lowerName = countryName.toLowerCase().trim();

  if (['ukraine', 'україна', 'ua', 'ukr'].includes(lowerName)) return 'UAH';
  if (['poland', 'polska', 'pl', 'pol', 'польща'].includes(lowerName)) return 'PLN';
  if (['uk', 'united kingdom', 'england', 'london', 'great britain'].includes(lowerName)) return 'GBP';
  
  const euroZone = ['germany', 'france', 'italy', 'spain', 'austria', 'netherlands', 'belgium', 'portugal', 'greece', 'finland', 'ireland', 'slovakia', 'lithuania', 'latvia', 'estonia', 'slovenia', 'cyprus', 'malta', 'luxembourg'];
  if (euroZone.some(c => lowerName.includes(c))) return 'EUR';

  return 'USD';
};

export const formatPrice = (val, country) => {
  if (!val && val !== 0) return '-';
  const currency = getCurrencyCode(country);
  try {
    return new Intl.NumberFormat('uk-UA', { 
      style: 'currency', 
      currency, 
      maximumFractionDigits: 0 
    }).format(val);
  } catch (e) {
    return `${val} ${currency}`;
  }
};

export const formatNumber = (val, unit = '') => {
  if (val === null || val === undefined) return '-';
  const safeUnit = typeof unit === 'string' ? unit : ''; 
  return `${val}${safeUnit}`;
};

export const formatRating = (val) => val ? `${val}/10` : '-';

export const formatBool = (val, useIcons = true, styles = {}, t = null) => {
  if (useIcons) {
    if (val === true) return <FaCheck className={styles.check} />;
    if (val === false) return <FaTimes className={styles.cross} />;
    return <FaMinus className={styles.dash} />;
  }
  
  if (t) {
    return val === true ? t('yes') : (val === false ? t('no') : '-');
  }
  
  return val === true ? 'Yes' : (val === false ? 'No' : '-');
};

export const formatLevel = (val, t) => val ? t(`levels.${val}`, { defaultValue: val }) : '-';