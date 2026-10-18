import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import PromoCodesModal from './PromoCodesModal';
import type { AdminUsersAPI } from './types';

vi.mock('@admin/core/ui/BaseModal', () => ({ default: ({ children }: { children: ReactNode }) => <div>{children}</div> }));
vi.mock('@admin/core/context/ModalContext', () => ({ useModals: () => ({ showAlert: vi.fn(), showConfirm: vi.fn() }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const mount = (manageFinance: AdminUsersAPI['manageFinance']) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <PromoCodesModal isOpen onClose={vi.fn()} adminUsersAPI={{ manageFinance }} t={key => key} />
  </QueryClientProvider>,
);
it('continues after an empty filtered page instead of hiding later City-map codes', async () => {
  const api = vi.fn().mockResolvedValueOnce({ codes: [], nextCursor: 'promo_next' })
    .mockResolvedValueOnce({ codes: [{ id: 'promo_city', code: 'CITY20', coupon: { percent_off: 20, duration: 'once' } }], nextCursor: null });
  mount(api);
  fireEvent.click(await screen.findByRole('button', { name: 'admin_users.promo_modal.load_more' }, { timeout: 5000 }));
  expect(await screen.findByText('CITY20', {}, { timeout: 5000 })).toBeInTheDocument();
  expect(api).toHaveBeenLastCalledWith('list_promos', { cursor: 'promo_next' });
});
it('reports failed reads and allows retry instead of presenting an empty list', async () => {
  const api = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ codes: [], nextCursor: null });
  mount(api);
  expect(await screen.findByRole('alert')).toHaveTextContent('admin_users.promo_modal.load_error');
  fireEvent.click(screen.getByRole('button', { name: 'admin_users.promo_modal.retry' }));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});
it('retries ambiguous creation with the same identity and rejects invalid discount values', async () => {
  const api = vi.fn(async (action: string) => {
    if (action === 'create_promo') throw new Error('offline');
    return { codes: [], nextCursor: null };
  });
  mount(api);
  fireEvent.change(screen.getByPlaceholderText('admin_users.promo.placeholder'), { target: { value: 'CITY20' } });
  const button = screen.getByRole('button', { name: 'admin_users.promo.create_btn' });
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '101' } });
  expect(button).toBeDisabled();
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '20' } });
  fireEvent.click(button);
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  await waitFor(() => expect(api.mock.calls.filter(call => call[0] === 'create_promo')).toHaveLength(2));
  const creates = (api.mock.calls as unknown[][]).filter(call => call[0] === 'create_promo');
  expect(creates[0][1]).toEqual(creates[1][1]);
});
