import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './routes/Routes';
import { AuthProvider } from './components/auth/AuthContext';
import { SubscriptionProvider } from './pages/subscription/SubscriptionContext';
import { FavoritesProvider } from './pages/favorites/FavoritesContext';
import { HelmetProvider } from 'react-helmet-async';
import { dbTranslationsPromise } from './i18n/i18n'; 
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

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-body)]">
    <div className="w-12 h-12 border-4 border-t-[var(--accent-color)] border-[var(--border-color)] rounded-full animate-spin"></div>
  </div>
);

const App: React.FC = () => {
  const [translationsLoaded, setTranslationsLoaded] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    // Чекаємо, поки i18n стягне дані з БД
    dbTranslationsPromise.then(() => {
      if (isMounted) {
        setTranslationsLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Блокуємо рендер додатку, поки немає перекладів
  if (!translationsLoaded) {
    return <PageLoader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter future={{ 
          v7_startTransition: true,
          v7_relativeSplatPath: true 
        }}>
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
};

export default App;