import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App';
import { ThemeProvider } from './components/header/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaSyncAlt } from 'react-icons/fa';
import './index.css';
import './i18n/i18n';

Sentry.init({
  dsn: "https://0188e681ee3e01dcb59f3618b52274b0@o4511014065274880.ingest.de.sentry.io/4511014082445392",
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const GlobalErrorFallback = () => {
  const { t } = useTranslation();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main, #f4f5f7)',
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'var(--font-body, sans-serif)'
    }}>
      <div style={{
        background: 'var(--bg-surface, #ffffff)',
        padding: '40px 32px',
        borderRadius: 'var(--radius-lg, 20px)',
        boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0,0,0,0.1))',
        maxWidth: '480px',
        width: '100%',
        border: '1px solid var(--border, rgba(0,0,0,0.08))'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          background: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--danger, #ef4444)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          margin: '0 auto 24px auto',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <FaExclamationTriangle />
        </div>
        <h1 style={{
          margin: '0 0 12px 0',
          color: 'var(--text-main, #0f172a)',
          fontSize: '1.6rem',
          fontWeight: '800',
          letterSpacing: '-0.02em'
        }}>
          {t('errorBoundary.title')}
        </h1>
        <p style={{
          margin: '0 0 32px 0',
          color: 'var(--text-muted, #475569)',
          fontSize: '1rem',
          lineHeight: '1.6',
          fontWeight: '500'
        }}>
          {t('errorBoundary.subtitle')}
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: 'var(--primary, #3b82f6)',
            color: '#ffffff',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 'var(--radius-md, 12px)',
            fontSize: '1.05rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
          }}
        >
          <FaSyncAlt /> {t('errorBoundary.refreshBtn')}
        </button>
      </div>
    </div>
  );
};

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<GlobalErrorFallback />}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);