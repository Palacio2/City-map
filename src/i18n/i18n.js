import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { api } from '../services/api'; // Твій файл з axios/fetch запитами

const modules = import.meta.glob('./locales/**/*.json', { eager: true });
const resources = {};

Object.keys(modules).forEach((path) => {
  const parts = path.split('/'); 
  const lang = parts[2]; 
  const ns = parts[3].replace('.json', ''); 

  if (!resources[lang]) resources[lang] = {};
  resources[lang][ns] = modules[path].default || modules[path];
});

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
    ns: Object.keys(resources.uk || {}), 
    defaultNS: 'common',
    debug: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });

// --- ФУНКЦІЯ ПІДТЯГУВАННЯ ПЕРЕКЛАДІВ З БД ---
export const loadDynamicTranslations = async () => {
  try {
    const data = await api.translations.getAll(); // Твій новий ендпоінт
    
    data.forEach(item => {
      // Додаємо кожне значення в неймспейс 'dynamic' (або 'fields')
      if (item.uk) i18n.addResource('uk', 'fields', item.translation_key, item.uk);
      if (item.pl) i18n.addResource('pl', 'fields', item.translation_key, item.pl);
      if (item.en) i18n.addResource('en', 'fields', item.translation_key, item.en);
    });

    console.log('✅ Динамічні переклади завантажено');
  } catch (e) {
    console.error('❌ Помилка завантаження перекладів з БД', e);
  }
};

// Запускаємо завантаження
loadDynamicTranslations();

export default i18n;