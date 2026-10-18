import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFeedback } from './useFeedback';

const mocks = vi.hoisted(() => ({
  getMessages: vi.fn(), deleteMessage: vi.fn(), updateStatus: vi.fn(),
  confirm: vi.fn(), alert: vi.fn(),
  withLogging: vi.fn((_action: string, operation: () => Promise<unknown>) => operation()),
}));
vi.mock('./adminFeedbackApi', () => ({ adminFeedbackApi: mocks }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@admin/core/context/ModalContext', () => ({ useModals: () => ({ showConfirm: mocks.confirm, showAlert: mocks.alert }) }));
vi.mock('@admin/core/context/useActionLogger', () => ({ useActionLogger: () => ({ withLogging: mocks.withLogging }) }));

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);

describe('feedback operations with real React Query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    mocks.getMessages.mockResolvedValue([
      { id: '1', type: 'contact', message: 'Hi', created_at: '2026-01-01' },
      { id: '2', type: 'ui_bug', message: 'Broken button', created_at: '2026-01-01' },
    ]);
    mocks.deleteMessage.mockResolvedValue({ success: true });
  });
  afterEach(() => { cleanup(); client.clear(); });

  it('loads and filters feedback', async () => {
    const { result } = renderHook(() => useFeedback(true), { wrapper });
    await waitFor(() => expect(result.current.filteredMessages).toHaveLength(2));
    act(() => result.current.setFilter('bug'));
    expect(result.current.filteredMessages.map(message => message.id)).toEqual(['2']);
  });

  it('deletes by message ID after confirmation; server owns attachment cleanup', async () => {
    const { result } = renderHook(() => useFeedback(true), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.handleDelete('1'));
    expect(mocks.deleteMessage).not.toHaveBeenCalled();
    act(() => mocks.confirm.mock.calls[0][2]());
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('common.success', 'admin_feedback.tab.delete_success', 'success'));
    expect(mocks.deleteMessage).toHaveBeenCalledExactlyOnceWith('1');
    expect(mocks.withLogging).toHaveBeenCalledWith('feedback.delete', expect.any(Function), { id: '1' });
  });

  it('shows backend deletion failures without reporting success', async () => {
    mocks.deleteMessage.mockRejectedValue(new Error('Attachment deletion failed'));
    const { result } = renderHook(() => useFeedback(true), { wrapper });
    act(() => result.current.handleDelete('1'));
    act(() => mocks.confirm.mock.calls[0][2]());
    await waitFor(() => expect(mocks.alert).toHaveBeenCalledWith('Error', 'Attachment deletion failed', 'error'));
    expect(mocks.alert).toHaveBeenCalledTimes(1);
  });

  it('does not offer deletion without permission', () => {
    const { result } = renderHook(() => useFeedback(false), { wrapper });
    act(() => result.current.handleDelete('1'));
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.deleteMessage).not.toHaveBeenCalled();
  });
});
