import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SubscriptionCard } from './SubscriptionCard';
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
const paid = { id: 'paid-id', plan: 'premium', status: 'active', expiresAt: '2027-01-01', cancel_at: null };

describe('subscription access and paid billing', () => {
  it('shows gift expiry without a payment amount or cancellation action', () => {
    render(<SubscriptionCard subscription={{ plan: 'realtor', status: 'active', source: 'gift', expiresAt: '2027-01-01' }}
      onManage={vi.fn()} onCancel={vi.fn()} isCancelling={false} />);
    expect(screen.getByText('billing.gift_access')).toBeInTheDocument();
    expect(screen.getByText('billing.access_until')).toBeInTheDocument();
    expect(screen.queryByText('billing.next_payment')).not.toBeInTheDocument();
    expect(screen.queryByText('billing.price_label')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'billing.cancel_sub' })).not.toBeInTheDocument();
  });
  it('cancels the explicit paid record even when a stronger gift controls access', () => {
    const cancel = vi.fn();
    render(<SubscriptionCard subscription={{ plan: 'realtor', status: 'active', source: 'gift', paidSubscriptions: [paid] }}
      onManage={vi.fn()} onCancel={cancel} isCancelling={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'billing.cancel_sub' }));
    expect(cancel).toHaveBeenCalledWith('paid-id');
  });
  it('keeps overdue billing manageable and suppresses repeat scheduled cancellation', () => {
    render(<SubscriptionCard subscription={{ plan: 'free', paidSubscriptions: [{ ...paid, status: 'past_due' },
      { ...paid, id: 'scheduled', cancel_at: '2027-01-01' }] }} onManage={vi.fn()} onCancel={vi.fn()} isCancelling={false} />);
    expect(screen.getAllByRole('button', { name: 'billing.cancel_sub' })).toHaveLength(1);
    expect(screen.getByText('billing.cancellation_scheduled')).toBeInTheDocument();
  });
  it('opens billing management from the profile instead of presenting an immediate cancel action', () => {
    const manage = vi.fn();
    render(<SubscriptionCard subscription={{ plan: 'premium', paidSubscriptions: [paid] }} onManage={manage} isCancelling={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'billing.manage_billing' }));
    expect(manage).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'billing.cancel_sub' })).not.toBeInTheDocument();
  });
});
