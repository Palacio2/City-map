import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/Routes';
import { SubscriptionProvider } from './pages/subscription/SubscriptionContext';

function App() {
  return (
    <BrowserRouter>
      <SubscriptionProvider>
        <AppRoutes />
      </SubscriptionProvider>
    </BrowserRouter>
  );
}

export default App;