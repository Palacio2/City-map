import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import UsersTab from './UsersTab';
import { BrowserRouter } from 'react-router-dom';

// Mocks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

const mockUseAdmin = vi.fn();
vi.mock('@admin/core/context/AdminContext', () => ({
  useAdmin: () => mockUseAdmin()
}));

const mockUseActionGuard = vi.fn();
vi.mock('@admin/core/context/useActionGuard', () => ({
  useActionGuard: () => mockUseActionGuard()
}));

const mockUseModals = vi.fn();
vi.mock('@admin/core/context/ModalContext', () => ({
  useModals: () => mockUseModals()
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false, error: null }),
  useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() })
}));

vi.mock('@admin/core/context/useActionLogger', () => ({
  useActionLogger: () => ({ withLogging: vi.fn() })
}));

describe('UsersTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAdmin.mockReturnValue({ currentAdmin: { role: 'super_admin' } });
    mockUseModals.mockReturnValue({ showConfirm: vi.fn(), showAlert: vi.fn() });
    mockUseActionGuard.mockReturnValue({
      canDo: vi.fn().mockReturnValue(true),
      requireAction: vi.fn()
    });
  });

  const renderComponent = () => render(
    <BrowserRouter>
      <UsersTab />
    </BrowserRouter>
  );

  it('renders the users tab without crashing', () => {
    renderComponent();
    expect(screen.getByText('admin_users.tab.title')).toBeInTheDocument();
  });
});
