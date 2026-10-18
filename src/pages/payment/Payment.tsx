import { useCallback, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { subscriptionPlans } from '@subscription/config/subscriptionPlans';
import { useCheckout } from './hooks/useCheckout';
import type { PaymentLocationState, PaymentResponse } from './types';

export default function Payment() {
  const { state } = useLocation(), navigate = useNavigate(), { t } = useTranslation('db');
  const planKey = (state as PaymentLocationState | null)?.planKey;
  const [promoCode, setPromoCode] = useState('');
  const ready = useCallback((result: PaymentResponse) => {
    if (result.completed) {
      navigate('/payment-success?session_id=' + encodeURIComponent(result.sessionId));
    } else if (result.url) window.location.assign(result.url);
  }, [navigate]);
  const { start, isLoading, error } = useCheckout(planKey, ready, promoCode);
  if (!planKey || !['weekly', 'premium', 'realtor'].includes(planKey)) {
    return <Navigate to='/subscription' replace />;
  }
  const plan = subscriptionPlans[planKey];
  return (
    <main className='min-h-screen pt-28 pb-16 px-4 bg-body flex justify-center'>
      <section className='ui-glass-panel p-8 max-w-xl w-full h-fit'>
        <h1 className='ui-heading-1'>
          {t('payment.page_title', { plan: t(`subscription.plans.${planKey}.name`) })}
        </h1>
        <p className='text-accent text-2xl mb-6'>{t(`subscription.plans.${planKey}.price`)}</p>
        <ul className='space-y-3 mb-6'>
          {plan.features.map((feature) => (
            <li key={feature}>{t(`subscription.features.${feature}`)}</li>
          ))}
        </ul>
        <p className='ui-text-muted mb-6'>
          {t('payment.checkout.explanation', {
            defaultValue:
              'Введіть промокод тут, якщо маєте його. На захищеній сторінці Stripe перевірте остаточну суму та умови знижки перед підтвердженням.',
          })}
        </p>
        <label htmlFor='checkout-promo' className='block mb-2'>{t('payment.checkout.promo_label')}</label>
        <input id='checkout-promo' type='text' value={promoCode} maxLength={64}
          autoComplete='off' spellCheck={false} disabled={isLoading}
          onChange={event => setPromoCode(event.target.value.toUpperCase())}
          className='w-full p-3 mb-6 rounded-xl border border-borderClient bg-surface text-textMain' />
        {error && (
          <p role='alert' className='text-danger mb-4'>
            {t(error, { defaultValue: t('payment.errors.create_failed') })}
          </p>
        )}
        <button
          type='button'
          onClick={() => void start()}
          disabled={isLoading}
          className='ui-button-primary w-full'
        >
          {isLoading
            ? t('payment.status.loading')
            : t('payment.checkout.continue', { defaultValue: 'Перейти до оплати' })}
        </button>
        <button
          type='button'
          disabled={isLoading}
          onClick={() => navigate('/subscription')}
          className='mt-4 w-full'
        >
          {t('payment.actions.back')}
        </button>
      </section>
    </main>
  );
}
