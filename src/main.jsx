import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App';
import { ThemeProvider } from './components/header/ThemeContext';
import './index.css';
import './i18n/i18n';

// 1. Ініціалізація з ТВОЇМ НОВИМ DSN
Sentry.init({
  dsn: "https://0188e681ee3e01dcb59f3618b52274b0@o4511014065274880.ingest.de.sentry.io/4511014082445392",
  sendDefaultPii: true, // Дозволяє бачити IP та базові дані юзера
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const container = document.getElementById("root"); // Переконайся, що в index.html id саме "root"
const root = createRoot(container);

root.render(
  <React.StrictMode>
    {/* 2. Обгортка, яка "ловить" помилки на льоту */}
    <Sentry.ErrorBoundary fallback={<div>Сталася помилка. Повідомлення вже надіслано розробникам.</div>}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);