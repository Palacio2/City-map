import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationsTab from './NotificationsTab';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  })
}));

vi.mock('@admin/core/context/useActionGuard', () => ({
  useActionGuard: vi.fn()
}));

vi.mock('@admin/features/notifications/useNotifications', () => ({
  useNotifications: vi.fn()
}));

import { useActionGuard } from '@admin/core/context/useActionGuard';
import { useNotifications } from '@admin/features/notifications/useNotifications';

describe('NotificationsTab Access Control', () => {
  const mockCreateNotification = vi.fn();
  const mockToggleStatus = vi.fn();
  const mockDeleteNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [
        { id: '1', message: 'Test message', type: 'info', is_active: true, created_at: new Date().toISOString() }
      ],
      loading: false,
      newMessage: '',
      setNewMessage: vi.fn(),
      newType: 'info',
      setNewType: vi.fn(),
      createNotification: mockCreateNotification,
      toggleStatus: mockToggleStatus,
      deleteNotification: mockDeleteNotification,
      refetch: vi.fn()
    });
  });

  it('should render create notification form when having notifications.send permission', () => {
    vi.mocked(useActionGuard).mockReturnValue({
      canDo: (action: string) => action === 'notifications.send'
    } as ReturnType<typeof useActionGuard>);

    render(<NotificationsTab />);
    
    // Form should exist
    expect(screen.getByPlaceholderText('admin_notifications.tab.placeholder')).toBeInTheDocument();
  });

  it('should not render create notification form when missing notifications.send permission', () => {
    vi.mocked(useActionGuard).mockReturnValue({
      canDo: () => false
    } as ReturnType<typeof useActionGuard>);

    render(<NotificationsTab />);
    
    // Form should not exist
    expect(screen.queryByPlaceholderText('admin_notifications.tab.placeholder')).not.toBeInTheDocument();
  });

  it('should disable toggle status button when missing notifications.send permission', () => {
    vi.mocked(useActionGuard).mockReturnValue({
      canDo: () => false
    } as ReturnType<typeof useActionGuard>);

    render(<NotificationsTab />);
    
    // The active/inactive button in the table
    const toggleBtn = screen.getByText('admin_notifications.tab.active').closest('button');
    expect(toggleBtn).toBeDisabled();
  });

  it('should not render delete button when missing notifications.send permission', () => {
    vi.mocked(useActionGuard).mockReturnValue({
      canDo: () => false
    } as ReturnType<typeof useActionGuard>);

    render(<NotificationsTab />);
    
    // The delete button uses title 'admin_notifications.tab.delete_title'
    expect(screen.queryByTitle('admin_notifications.tab.delete_title')).not.toBeInTheDocument();
  });
});
