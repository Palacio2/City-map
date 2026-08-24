import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useNotifications } from './useNotifications';
import { adminNotificationsApi } from './adminNotificationsApi';

// Mocks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

const mockShowConfirm = vi.fn();
const mockShowAlert = vi.fn();
vi.mock('@admin/core/context/ModalContext', () => ({
  useModals: () => ({
    showConfirm: mockShowConfirm,
    showAlert: mockShowAlert
  })
}));

const mockQueryClient = { invalidateQueries: vi.fn() };
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'notifications') {
      return {
        data: [
          { id: '1', message: 'Test notification', type: 'info', is_active: true }
        ],
        isLoading: false,
        refetch: vi.fn()
      };
    }
    return { data: [], isLoading: false };
  },
  useMutation: ({ mutationFn, onSuccess, onError }: { mutationFn: (...args: unknown[]) => Promise<unknown>, onSuccess: (...args: unknown[]) => void, onError: (...args: unknown[]) => void }) => ({
    mutate: (vars: unknown) => {
      mutationFn(vars).then(onSuccess).catch(onError);
    }
  }),
  useQueryClient: () => mockQueryClient
}));

vi.mock('./adminNotificationsApi', () => ({
  adminNotificationsApi: {
    getAll: vi.fn(),
    create: vi.fn().mockResolvedValue({}),
    updateStatus: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({})
  }
}));

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current.newMessage).toBe('');
    expect(result.current.newType).toBe('info');
    expect(result.current.notifications).toHaveLength(1);
  });

  it('updates state for new message and type', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.setNewMessage('Hello world');
      result.current.setNewType('warning');
    });
    
    expect(result.current.newMessage).toBe('Hello world');
    expect(result.current.newType).toBe('warning');
  });

  it('calls create notification mutation when triggered', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.setNewMessage('Alert!');
    });
    
    act(() => {
      result.current.handleCreate({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    
    expect(adminNotificationsApi.create).toHaveBeenCalled();
  });

  it('does not create if message is empty', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.handleCreate({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    
    expect(adminNotificationsApi.create).not.toHaveBeenCalled();
  });

  it('calls toggle status mutation', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.toggleStatus('1', true);
    });
    
    expect(adminNotificationsApi.updateStatus).toHaveBeenCalledWith('1', false);
  });

  it('opens confirm dialog on delete', () => {
    const { result } = renderHook(() => useNotifications());
    
    act(() => {
      result.current.deleteNotification('1');
    });
    
    expect(mockShowConfirm).toHaveBeenCalled();
  });
});
