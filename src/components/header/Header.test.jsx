import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Header from './Header';
import { useSubscription } from '../../pages/subscription/SubscriptionContext';

// Mock the useSubscription hook
vi.mock('../../pages/subscription/SubscriptionContext', () => ({
  useSubscription: vi.fn(),
}));

describe('Header', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('renders the header with correct content for guests', async () => {
    useSubscription.mockReturnValue({ isPremium: false });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.getByText('Увійти')).toBeInTheDocument();
    });

    // Check for the logo
    expect(screen.getByText('GeoAnalyzer')).toBeInTheDocument();

    // Check for navigation links
    expect(screen.getByText('Головна')).toBeInTheDocument();
    expect(screen.getByText('Про проект')).toBeInTheDocument();
    expect(screen.getByText('Контакти')).toBeInTheDocument();
    expect(screen.getByText('Підписка')).toBeInTheDocument();
  });
});
