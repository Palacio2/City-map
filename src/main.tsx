import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/layout/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaSyncAlt } from 'react-icons/fa';
import './index.css';
import './i18n/i18n';

// Якщо ти поки не використовуєш цей компонент, TypeScript буде сваритися.
// Я залишу його, але "задію" нижче або ти можеш його просто видалити/закоментувати.
const GlobalErrorFallback: React.FC = () => {
  const { t } = useTranslation('db');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f5f7] p-5 text-center font-body">
      <div className="bg-white p-10 rounded-[20px] shadow-lg max-w-[480px] w-full border border-black/5">
        <div className="w-[72px] h-[72px] bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-6 border border-red-100">
          <FaExclamationTriangle />
        </div>
        <h1 className="m-0 mb-3 text-[#0f172a] text-[1.6rem] font-extrabold tracking-tight">
          {t('errorBoundary.title')}
        </h1>
        <p className="m-0 mb-8 text-[#475569] text-base leading-relaxed font-medium">
          {t('errorBoundary.subtitle')}
        </p>
        <button 
          onClick={() => globalThis.location.reload()}
          className="bg-[#3b82f6] text-white border-none py-3.5 px-7 rounded-xl text-[1.05rem] font-bold cursor-pointer inline-flex items-center gap-2.5 transition-all hover:-translate-y-0.5 hover:shadow-blue-500/30 shadow-md"
        >
          <FaSyncAlt /> {t('errorBoundary.refreshBtn')}
        </button>
      </div>
    </div>
  );
};

const container = document.getElementById("root");

// Перевірка на null: якщо контейнера немає, викидаємо помилку одразу
if (!container) {
  throw new Error("Root element not found. Check your index.html");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      {/* 
         Якщо хочеш, щоб GlobalErrorFallback не світився як помилка, 
         його треба або використати (наприклад, для тесту), або просто 
         видалити його оголошення, поки не підключиш справжній ErrorBoundary.
      */}
      <App />
    </ThemeProvider>
  </React.StrictMode>
);