import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/layout/ThemeContext';
import './index.css';
import './i18n/i18n';
import * as Sentry from '@sentry/react';

if (import.meta.env.MODE === 'production') {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend(event) {
      delete event.user;
      delete event.request;
      event.breadcrumbs = [];
      return event;
    },
  });
}


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
