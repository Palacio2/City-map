import { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import AppRoutes from './routes/Routes';
import { AuthProvider } from '@auth/context/AuthContext';
import { SubscriptionProvider } from '@subscription/contex/SubscriptionContext';
import { FavoritesProvider } from '@pages/favorites/context/FavoritesContext';
import './i18n/i18n';
import './client.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
    <div className="w-12 h-12 border-4 border-t-[var(--accent-color)] border-[var(--border-color)] rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <SubscriptionProvider>
              <FavoritesProvider>
                <div className="client-layout">
                  <Suspense fallback={<PageLoader />}>
                    <AppRoutes />
                  </Suspense>
                </div>
              </FavoritesProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}