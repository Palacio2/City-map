import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { api } from '../services/api'; // Перевірте, чи правильний шлях до вашого api

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
    // Використовуємо 'db' як основний за замовчуванням
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
    
    if (!data || !Array.isArray(data)) {
        throw new Error("Дані перекладів не є масивом");
    }

    // Створюємо порожні об'єкти для кожної мови
    const bundles = { uk: {}, pl: {}, en: {} };

    // Наповнюємо їх
    data.forEach(item => {
      const key = item.translation_key;
      if (item.uk) bundles.uk[key] = item.uk;
      if (item.pl) bundles.pl[key] = item.pl;
      if (item.en) bundles.en[key] = item.en;
    });

    // Додаємо весь пакунок одразу в неймспейси 'db' та 'translation'
    Object.keys(bundles).forEach(lang => {
      if (Object.keys(bundles[lang]).length > 0) {
        i18n.addResourceBundle(lang, 'db', bundles[lang], true, true);
        i18n.addResourceBundle(lang, 'translation', bundles[lang], true, true);
      }
    });

    console.log(`✅ Усі переклади імпортовано. Кількість: ${data.length}`);
    return true; 
  } catch (e) {
    console.error('❌ Помилка завантаження перекладів', e);
    return false;
  }
};

// Запускаємо завантаження і експортуємо Promise
export const dbTranslationsPromise = loadDynamicTranslations();

export default i18n;