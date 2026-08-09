import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/layout/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaSyncAlt } from 'react-icons/fa';
import './index.css';
import './i18n/i18n';
import * as Sentry from '@sentry/react';

if (import.meta.env.MODE === 'production') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

if (import.meta.env.MODE === 'production') {
  console.log(
    '%cЗУПИНИСЯ!',
    'color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;'
  );
  console.log(
    '%cЦя функція браузера призначена для розробників. Якщо хтось сказав вам скопіювати-вставити сюди код, це шахрайство, яке дасть їм доступ до вашого акаунту!',
    'font-size: 18px; font-weight: bold; color: #333;'
  );
}

const GlobalErrorFallback: React.FC = () => {
  const { t } = useTranslation('db');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f5f7] p-5 text-center font-body">
      <div className="bg-white p-10 rounded-[20px] shadow-lg max-w-[480px] w-full border border-black/5">
        <div className="w-[72px] h-[72px] bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-6 border border-red-100">
          <FaExclamationTriangle />
        </div>
        <h1 className="m-0 mb-3 text-[#0f172a] text-[1.6rem] font-extrabold tracking-tight">
          {t('errorBoundary.title', 'Щось пішло не так')}
        </h1>
        <p className="m-0 mb-8 text-[#475569] text-base leading-relaxed font-medium">
          {t('errorBoundary.subtitle', 'Сталася помилка. Спробуйте оновити сторінку.')}
        </p>
        <button 
          onClick={() => globalThis.location.reload()}
          className="bg-[#3b82f6] text-white border-none py-3.5 px-7 rounded-xl text-[1.05rem] font-bold cursor-pointer inline-flex items-center gap-2.5 transition-all hover:-translate-y-0.5 hover:shadow-blue-500/30 shadow-md"
        >
          <FaSyncAlt /> {t('errorBoundary.refreshBtn', 'Оновити сторінку')}
        </button>
      </div>
    </div>
  );
};

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found. Check your index.html");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);