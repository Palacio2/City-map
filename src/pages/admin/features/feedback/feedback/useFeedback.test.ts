import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFeedback } from './useFeedback';

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

vi.mock('@admin/core/context/useActionLogger', () => ({
  useActionLogger: () => ({
    withLogging: vi.fn(async (action, fn) => {
      await fn();
    })
  })
}));

const mockQueryClient = { invalidateQueries: vi.fn() };
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'feedbackMessages') {
      return {
        data: [
          { id: '1', type: 'contact', message: 'Hi' },
          { id: '2', type: 'ui_bug', message: 'Broken button' }
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

vi.mock('@services/api', () => ({
  api: {
    feedback: {
      getMessages: vi.fn(),
      deleteMessage: vi.fn().mockResolvedValue({}),
      deleteImage: vi.fn().mockResolvedValue({}),
      updateStatus: vi.fn().mockResolvedValue({})
    }
  }
}));

describe('useFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with all filter and returns all messages', () => {
    const { result } = renderHook(() => useFeedback(true));
    expect(result.current.filter).toBe('all');
    expect(result.current.filteredMessages).toHaveLength(2);
  });

  it('filters messages correctly', () => {
    const { result } = renderHook(() => useFeedback(true));
    
    act(() => {
      result.current.setFilter('bug');
    });
    
    expect(result.current.filter).toBe('bug');
    expect(result.current.filteredMessages).toHaveLength(1);
    expect(result.current.filteredMessages[0].type).toBe('ui_bug');
  });

  it('calls delete mutation if canDelete is true', () => {
    const { result } = renderHook(() => useFeedback(true));
    
    act(() => {
      result.current.handleDelete('1');
    });
    
    expect(mockShowConfirm).toHaveBeenCalled();
  });

  it('does not call delete mutation if canDelete is false', () => {
    const { result } = renderHook(() => useFeedback(false));
    
    act(() => {
      result.current.handleDelete('1');
    });
    
    expect(mockShowConfirm).not.toHaveBeenCalled();
  });
});
