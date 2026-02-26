import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/Routes';
import { SubscriptionProvider } from './pages/subscription/SubscriptionContext';
import { FavoritesProvider } from './pages/favorites/FavoritesContext';

function App() {
  return (
    <BrowserRouter future={{ 
      v7_startTransition: true,
      v7_relativeSplatPath: true 
    }}>
      <SubscriptionProvider>
        <FavoritesProvider>
          <AppRoutes />
        </FavoritesProvider>
      </SubscriptionProvider>
    </BrowserRouter>
  );
}

export default App;