import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { api } from '../services/api.js';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {},
    fallbackLng: 'en',
    supportedLngs: ['uk', 'en', 'pl'],
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
    // Оскільки ми не знаємо неймспейсів заздалегідь, 
    // використовуємо 'db' як основний за замовчуванням
    defaultNS: 'db',
    fallbackNS: 'db',
    debug: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });

/**
 * ФУНКЦІЯ ЗАВАНТАЖЕННЯ ПЕРЕКЛАДІВ ТІЛЬКИ З БД
 */
export const loadDynamicTranslations = async () => {
  try {
    const data = await api.translations.getAll(); 
    
    data.forEach(item => {
      if (item.uk) i18n.addResourceBundle('uk', 'db', { [item.translation_key]: item.uk }, true, true);
      if (item.pl) i18n.addResourceBundle('pl', 'db', { [item.translation_key]: item.pl }, true, true);
      if (item.en) i18n.addResourceBundle('en', 'db', { [item.translation_key]: item.en }, true, true);
    });

    console.log('✅ Переклади з БД завантажено успішно');
  } catch (e) {
    console.error('❌ Помилка завантаження перекладів з БД', e);
  }
};

// Запускаємо завантаження
export const dbTranslationsPromise = loadDynamicTranslations();

export default i18n;