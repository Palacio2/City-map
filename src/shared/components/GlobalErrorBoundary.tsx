import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    if (import.meta.env.MODE === 'production') {
      Sentry.captureException(error, { extra: { errorInfo } });
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-body p-6 text-center">
          <FaExclamationTriangle className="text-danger text-6xl mb-4 opacity-80" />
          <h1 className="text-3xl font-bold text-textMain mb-2 font-heading">
            Щось пішло не так
          </h1>
          <p className="text-textSecondary mb-6 max-w-md">
            Виникла непередбачувана помилка. Ми вже отримали звіт і працюємо над її вирішенням.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:-translate-y-0.5 transition-all"
            >
              Оновити сторінку
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-surface text-textMain font-bold rounded-xl border border-border shadow-xs hover:bg-hover transition-all"
            >
              На головну
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}