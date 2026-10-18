import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@auth/context/AuthContext';
import { useSubscription } from '@subscription/context/SubscriptionContext';
import { fetchCheckoutStatus } from './api/paymentApi';
export default function PaymentSuccess() {
  const [params] = useSearchParams(), { user } = useAuth(), { t } = useTranslation('db');
  const { updateSubscription } = useSubscription();
  const id = params.get('session_id');
  const valid = !!id && /^cs_[A-Za-z0-9_]+$/.test(id);
  const { data, isLoading, error } = useQuery({
    queryKey: ['checkoutStatus', user?.id, id],
    queryFn: ({ signal }) => fetchCheckoutStatus(id!, signal),
    enabled: !!user && valid,
    retry: 1,
    staleTime: 0,
  });
  const confirmed = data?.confirmed === true && data.status === 'complete' &&
    ['paid', 'no_payment_required'].includes(data.paymentStatus);
  useEffect(() => {
    if (confirmed) void updateSubscription();
  }, [confirmed, updateSubscription]);
  const message = !user
    ? t('payment.checkout.login', {
      defaultValue: 'Увійдіть в акаунт, з якого здійснювали оплату, щоб перевірити результат.',
    })
    : !valid || error
    ? t('payment.checkout.unverified', {
      defaultValue: 'Не вдалося підтвердити оплату. Перевірте підписку у своєму профілі.',
    })
    : isLoading
    ? t('payment.status.loading')
    : confirmed
    ? t('payment.checkout.confirmed', {
      defaultValue: 'Оплату підтверджено. Доступ оновиться після синхронізації підписки.',
    })
    : t('payment.checkout.pending', {
      defaultValue: 'Оплату ще не підтверджено. Перевірте її стан у своєму профілі.',
    });
  return (
    <main className='min-h-screen pt-28 px-4 flex justify-center bg-body'>
      <section className='ui-glass-panel p-8 max-w-xl h-fit'>
        <h1 className='ui-heading-1'>
          {t('payment.checkout.result', { defaultValue: 'Результат оплати' })}
        </h1>
        <p role='status'>{message}</p>
        <Link to={user ? '/profile' : '/login'} className='ui-button-primary mt-6'>
          {t('payment.checkout.profile', { defaultValue: 'Перейти до акаунта' })}
        </Link>
      </section>
    </main>
  );
}
