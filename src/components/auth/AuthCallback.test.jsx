import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AuthCallback from './AuthCallback';
import { supabase } from '../../supabaseClient';

// Mock the supabase client
vi.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
    },
  },
}));

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    render(
      <BrowserRouter>
        <AuthCallback />
      </BrowserRouter>
    );

    expect(screen.getByText('Обробка автентифікації')).toBeInTheDocument();
    expect(screen.getByText('Зачекайте, будь ласка...')).toBeInTheDocument();
  });

  it('renders success state on SIGNED_IN event', async () => {
    const mockUnsubscribe = vi.fn();
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      callback('SIGNED_IN', {});
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
    });

    render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Успішна автентифікація!')).toBeInTheDocument();
    });
  });
});
