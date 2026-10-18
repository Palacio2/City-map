import { useTranslation } from 'react-i18next';
import type { SubscriptionCardProps } from '../types';

export const SubscriptionCard = ({ subscription, onManage, onCancel, isCancelling, error }: SubscriptionCardProps) => {
  const { t } = useTranslation('db');
  if (!subscription) return null;
  const plan = subscription.isExpired ? 'free' : subscription.plan || 'free';
  const active = ['active', 'trialing'].includes(subscription.status ?? '') && plan !== 'free';
  const paid = subscription.paidSubscriptions ?? [];
  const displayDate = (value: string) => new Date(value).toLocaleDateString();

  return (
    <section className="bg-surface rounded-2xl p-5 md:p-8 shadow-xs flex flex-col gap-5">
      <h2 className="text-xl text-textMain font-bold">{t('billing.current_sub')}</h2>
      {subscription.billingUnavailable && <p role="alert" className="text-danger">{t('billing.status_unavailable')}</p>}
      <div className="flex justify-between gap-3">
        <span className="text-textSecondary">{t('billing.plan_label')}</span>
        <strong>{t(`billing.plans.${plan}.name`)}</strong>
      </div>
      {active && subscription.source === 'gift' && <p className="text-textSecondary text-sm">{t('billing.gift_access')}</p>}
      {active && subscription.expiresAt && (
        <div className="flex justify-between gap-3">
          <span className="text-textSecondary">{t('billing.access_until')}</span>
          <span>{displayDate(subscription.expiresAt)}</span>
        </div>
      )}
      {paid.length > 0 && (
        <div className="flex flex-col gap-4 border-t border-borderClient pt-4">
          <h3 className="font-bold text-textMain">{t('billing.paid_subscriptions')}</h3>
          {paid.map(item => (
            <div key={item.id} className="flex flex-col gap-2">
              <strong>{t(`billing.plans.${item.plan}.name`)}</strong>
              <span className="text-sm text-textSecondary">{t(`billing.status_map.${item.status}`, { defaultValue: item.status })}</span>
              {item.cancel_at ? (
                <p className="text-sm text-textSecondary">{t('billing.cancellation_scheduled', { date: displayDate(item.cancel_at) })}</p>
              ) : item.expiresAt ? (
                <p className="text-sm text-textSecondary">{t('billing.period_end', { date: displayDate(item.expiresAt) })}</p>
              ) : null}
              {onCancel && !item.cancel_at && (
                <button type="button" onClick={() => onCancel(item.id)} disabled={isCancelling}
                  className="p-3 rounded-xl bg-danger text-white font-bold disabled:opacity-50">
                  {t('billing.cancel_sub')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {error && <p role="alert" className="text-danger">{error}</p>}
      <button type="button" onClick={onManage} disabled={isCancelling}
        className="p-4 rounded-xl bg-accent text-white font-bold disabled:opacity-50">
        {t(paid.length && !onCancel ? 'billing.manage_billing' : 'billing.update_plan')}
      </button>
    </section>
  );
};
