import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginTab from './LoginTab';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  })
}));

vi.mock('@admin/core/context/useAdminAuth', () => ({
  useAdminAuth: vi.fn()
}));

vi.mock('@admin/features/login/components/BackgroundMap', () => ({
  default: () => <div data-testid="background-map" />
}));

vi.mock('@admin/features/login/components/AdminSidebarInfo', () => ({
  default: () => <div data-testid="sidebar-info" />
}));

import { useAdminAuth } from '@admin/core/context/useAdminAuth';

describe('LoginTab', () => {
  const mockHandleLoginSubmit = vi.fn();
  const mockHandleMfaSubmit = vi.fn();
  const mockHandleRestart = vi.fn();
  const mockSetEmail = vi.fn();
  const mockSetPassword = vi.fn();
  const mockSetMfaCode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMock = (step: 'credentials' | 'mfa_setup' | 'mfa_verify', error: string | null = null) => {
    (useAdminAuth as any).mockReturnValue({
      step,
      email: 'test@example.com',
      setEmail: mockSetEmail,
      password: 'password123',
      setPassword: mockSetPassword,
      mfaCode: '',
      setMfaCode: mockSetMfaCode,
      qrCodeUrl: step === 'mfa_setup' ? 'otpauth://totp/...' : null,
      loading: false,
      error,
      handleLoginSubmit: mockHandleLoginSubmit,
      handleMfaSubmit: mockHandleMfaSubmit,
      handleRestart: mockHandleRestart
    });
  };

  it('should render credentials form initially', () => {
    setupMock('credentials');
    render(<LoginTab />);
    
    expect(screen.getByText('admin_panel.login.title')).toBeInTheDocument();
    
    // Check for email and password inputs
    expect(screen.getByPlaceholderText('admin@citymaps.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('should render error message if present', () => {
    setupMock('credentials', 'Invalid credentials');
    render(<LoginTab />);
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('should render mfa setup form when step is mfa_setup', () => {
    setupMock('mfa_setup');
    render(<LoginTab />);
    
    expect(screen.getByText('admin_panel.login.scan_qr')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000 000')).toBeInTheDocument();
  });

  it('should render mfa verify form when step is mfa_verify', () => {
    setupMock('mfa_verify');
    render(<LoginTab />);
    
    expect(screen.getByText('admin_panel.login.two_factor')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000 000')).toBeInTheDocument();
  });
});
