import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { FaArrowLeft } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { subscriptionPlans } from '@subscription/config/subscriptionPlans';
import Loader from '@components/loader/Loader';
import { useFormat } from '@hooks/useFormat';
import { usePaymentIntent } from './hooks/usePaymentIntent';
import { PaymentSummary } from './components/PaymentSummary';
import { CheckoutForm } from './components/CheckoutForm';
import { stripeAppearanceConfig } from './config/stripeConfig';
import type { PaymentLocationState } from './types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export default function Payment() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { t } = useTranslation('db');
  const { formatPrice, getCurrencyInfo } = useFormat();

  const planKey = (state as PaymentLocationState)?.planKey;
  const planConfig = planKey ? subscriptionPlans[planKey] : null;

  const {
    clientSecret,
    promoCode,
    setPromoCode,
    finalAmount,
    paymentMode,
    promoSuccess,
    errorMsg,
    isLoading,
    applyPromo
  } = usePaymentIntent(planKey);

  const options: StripeElementsOptions = useMemo(() => ({
    clientSecret,
    appearance: stripeAppearanceConfig,
  }), [clientSecret]);

  if (!planConfig) return null;

  const currencyInfo = getCurrencyInfo('EU');
  const displayPrice = finalAmount !== null 
    ? formatPrice(finalAmount, currencyInfo) 
    : t('payment.status.loading');

  return (
    <div className="min-h-[100dvh] pt-32 pb-12 px-4 md:px-8 bg-body flex justify-center items-start animate-fadeIn">
      <div className="w-full max-w-[1100px] flex flex-col items-center">
        
        <div className="w-full mb-8 relative flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-0 bg-surface/50 hover:bg-surface border border-borderClient p-3 rounded-full text-textSecondary cursor-pointer flex items-center justify-center transition-all hover:text-accent hover:-translate-x-1 hover:shadow-sm"
            title={t('payment.actions.back')}
          >
            <FaArrowLeft />
          </button>
          <h1 className="font-heading text-3xl md:text-4xl text-textMain font-bold tracking-wide text-center">
            {t('payment.page_title', { plan: planConfig.name })}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6 md:gap-8 w-full items-stretch">
          
          <PaymentSummary
            planConfig={planConfig}
            displayPrice={displayPrice}
            promoCode={promoCode}
            setPromoCode={setPromoCode}
            onApplyPromo={applyPromo}
            promoSuccess={promoSuccess}
            isPromoLoading={isLoading}
          />

          <div className="ui-glass-panel p-6 md:p-8 flex flex-col min-h-[500px]">
            {errorMsg && (
              <div className="text-danger bg-danger/10 p-4 rounded-xl border border-danger/20 text-sm text-center mb-6 font-medium">
                {errorMsg}
              </div>
            )}
            
            {clientSecret ? (
              <Elements key={clientSecret} options={options} stripe={stripePromise}>
                <CheckoutForm formattedPrice={displayPrice} mode={paymentMode} />
              </Elements>
            ) : (
              !errorMsg && (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-accent">
                  <Loader size="medium" />
                </div>
              )
            )}
          </div>

        </div>
      </div>
    </div>
  );
}