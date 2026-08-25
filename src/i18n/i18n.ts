// @ts-nocheck
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translations from '../../public/locales/translations.json';

const resources = {
  uk: { db: translations.uk },
  en: { db: translations.en },
  pl: { db: translations.pl },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['uk', 'en', 'pl'],
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
    defaultNS: 'db',
    fallbackNS: 'db',
    debug: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false } // No longer needed since resources are synchronous
  });

export default i18n;
