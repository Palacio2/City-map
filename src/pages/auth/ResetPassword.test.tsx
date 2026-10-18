import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import ResetPassword from './ResetPassword';
const state = vi.hoisted(() => ({ isAuthenticated: false, isLoading: false }));
vi.mock('./context/AuthContext', () => ({ useAuth: () => state }));
vi.mock('../profile/components/PasswordChangeModal', () => ({ PasswordChangeModal: () => <div>Password editor</div> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
it('offers a fresh recovery link for an expired or absent session', () => {
  state.isAuthenticated = false;
  render(<MemoryRouter><ResetPassword /></MemoryRouter>);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/forgot-password');
  expect(screen.queryByText('Password editor')).toBeNull();
});
it('allows a verified session to change its password', () => {
  state.isAuthenticated = true;
  render(<MemoryRouter><ResetPassword /></MemoryRouter>);
  expect(screen.getByText('Password editor')).toBeInTheDocument();
});
