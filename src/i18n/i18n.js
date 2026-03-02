import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Автоматично імпортуємо всі .json файли з папки locales
// { eager: true } завантажує файли відразу (як звичайний import)
const modules = import.meta.glob('./locales/**/*.json', { eager: true });

const resources = {};

// Перетворюємо шляхи файлів у структуру resources для i18next
Object.keys(modules).forEach((path) => {
  // Шлях виглядає як: "./locales/uk/common.json"
  const parts = path.split('/'); 
  const lang = parts[2]; // "uk", "en" або "pl"
  const ns = parts[3].replace('.json', ''); // назва файлу без розширення

  if (!resources[lang]) {
    resources[lang] = {};
  }

  // Записуємо контент файлу в потрібну мову та неймспейс
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
      lookupLocalStorage: 'i18nextLng',
    },

    // Неймспейси тепер підтягуються автоматично з ключів об'єкта
    ns: Object.keys(resources.uk || {}), 
    defaultNS: 'common',

    debug: true,

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false
    }
  });

export default i18n;