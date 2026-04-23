import { useState, useEffect, useMemo, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaCheckCircle, FaArrowLeft, FaShieldAlt, FaTag, FaGem } from 'react-icons/fa';
import { useTranslation } from 'react-i18next'; 
import { subscriptionPlans } from '@subscription/subscriptionPlans';
import { processPayment } from '@api/paymentApi';
import Loader from '@components/loader/Loader';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutFormProps {
  formattedPrice: string;
  mode: string;
}

const CheckoutForm = ({ formattedPrice, mode }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation('db'); 
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setMessage(null);

    const returnUrl = `${window.location.origin}/payment-success`;

    try {
        let result;
        if (mode === 'setup') {
            result = await stripe.confirmSetup({
                elements,
                redirect: 'if_required',
                confirmParams: { return_url: returnUrl },
            });
        } else {
            result = await stripe.confirmPayment({
                elements,
                redirect: 'if_required',
                confirmParams: { return_url: returnUrl },
            });
        }

        if (result.error) throw new Error(result.error.message);
        window.location.href = returnUrl;

    } catch (err: any) {
        setMessage(err.message || t('payment.errors.failed'));
        setIsProcessing(false);
    }
  };

  const getButtonText = () => {
      if (isProcessing) return t('payment.processing');
      if (mode === 'setup') return t('payment.activate_btn');
      return t('payment.pay_btn', { amount: formattedPrice });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 h-full">
      <div className="flex-1">
        <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      </div>

      {message && (
        <div className="mt-6 text-danger bg-danger/10 p-4 rounded-xl border border-danger/20 text-sm text-center font-medium">
          {message}
        </div>
      )}
      
      <div className="mt-8">
        <button 
          disabled={isProcessing || !stripe || !elements} 
          className="w-full py-4 px-6 bg-gradient-to-br from-accent to-accent-hover text-white rounded-xl font-heading text-base font-bold tracking-widest uppercase cursor-pointer transition-all shadow-md hover:not(:disabled):-translate-y-0.5 hover:not(:disabled):shadow-lg hover:not(:disabled):brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {isProcessing && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {getButtonText()}
        </button>
        
        <div className="mt-6 text-center text-xs text-textSecondary flex items-center justify-center gap-2 font-medium tracking-wide">
          <FaShieldAlt className="text-success text-sm" /> 
          {t('payment.security_note')}
        </div>
      </div>
    </form>
  );
};

export default function Payment() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { t } = useTranslation('db');

  const [clientSecret, setClientSecret] = useState<string>("");
  const [promoCode, setPromoCode] = useState<string>("");
  const [finalAmount, setFinalAmount] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<string>('payment');
  const [error, setError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<boolean>(false);

  const planKey = (state as any)?.planKey;
  const planConfig = subscriptionPlans[planKey];

  const formatEuro = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '...';
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const fetchPaymentIntent = async (code: string | null = null) => {
    try {
      setClientSecret("");
      setError(null);
      setPromoSuccess(false);
      const data = await processPayment({ planKey, promoCode: code });
      
      if (data && data.clientSecret) {
          setClientSecret(data.clientSecret);
          setFinalAmount(data.amount);
          setPaymentMode(data.mode);
          if (code) setPromoSuccess(true);
      } else {
          throw new Error("No client secret returned");
      }
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) {
          navigate('/auth');
      } else {
          setError(err.message || t('payment.errors.create_failed'));
          if (code) setPromoCode(""); 
      }
    }
  };

  useEffect(() => {
    if (!planKey || !planConfig) navigate('/subscription');
    else fetchPaymentIntent();
  }, [planKey, planConfig, navigate]);

  const options: StripeElementsOptions = useMemo(() => ({
    clientSecret,
    appearance: { 
        theme: 'night', 
        variables: { 
          colorPrimary: '#c5a47e', 
          colorBackground: '#111318', 
          colorText: '#ffffff', 
          fontFamily: 'Manrope, sans-serif',
          borderRadius: '12px',
          colorDanger: '#ef4444',
          spacingUnit: '4px'
        },
        rules: {
          '.Input': {
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'none',
          },
          '.Input:focus': {
            border: '1px solid #c5a47e',
          }
        }
    },
  }), [clientSecret]);

  if (!planConfig) return null;

  const displayPrice = finalAmount !== null ? formatEuro(finalAmount) : t('payment.status.loading');

  return (
    <div className="min-h-[100dvh] pt-32 pb-12 px-4 md:px-8 bg-body flex justify-center items-start animate-fadeIn">
      <div className="w-full max-w-[1100px] flex flex-col items-center">
        
        <div className="w-full mb-8 relative flex items-center justify-center">
          <button 
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
          
          <div className="ui-glass-panel p-6 md:p-8 flex flex-col h-full border-accent/20">
            <div className="flex items-center gap-4 border-b border-borderClient pb-6 mb-6">
              <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xl shrink-0">
                <FaGem />
              </div>
              <div>
                <span className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-1">{t('payment.labels.tariff')}</span>
                <span className="font-heading text-xl font-bold text-textMain">{planConfig.name}</span>
              </div>
            </div>

            <div className="bg-surface/50 border border-borderClient p-6 rounded-2xl text-center mb-8">
              <div className="font-heading text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-hover tracking-tight drop-shadow-sm">
                {displayPrice}
              </div>
            </div>
            
            <div className="mb-8">
              <label className="text-xs font-bold flex items-center gap-2 mb-3 text-textSecondary uppercase tracking-widest"><FaTag className="text-accent" /> {t('payment.labels.promo')}</label>
              <div className="flex gap-2 relative">
                  <input 
                      type="text" 
                      value={promoCode} 
                      onChange={(e) => setPromoCode(e.target.value)} 
                      placeholder={t('payment.placeholders.promo')}
                      className="flex-1 p-3.5 rounded-xl border border-borderClient bg-surface text-textMain font-medium text-sm transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none uppercase"
                  />
                  <button 
                    onClick={() => fetchPaymentIntent(promoCode)} 
                    disabled={!promoCode} 
                    className="px-6 rounded-xl bg-surface border border-borderClient text-textMain font-heading font-bold text-xs uppercase tracking-widest transition-all hover:not(:disabled):border-accent hover:not(:disabled):text-accent hover:not(:disabled):bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {t('payment.actions.apply_promo')}
                  </button>
              </div>
              {promoSuccess && <div className="text-success text-xs font-medium mt-3 flex items-center gap-1.5"><FaCheckCircle /> {t('payment.status.promo_ok')}</div>}
            </div>

            <div className="flex flex-col gap-3.5 mt-auto border-t border-borderClient pt-6">
              {planConfig.features.map((f, i) => (
                <div key={i} className="flex gap-3 text-sm text-textSecondary items-start leading-relaxed">
                    <FaCheckCircle className="text-success min-w-[16px] mt-0.5"/> 
                    <span>{t(`subscription.features.${f}`)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ui-glass-panel p-6 md:p-8 flex flex-col min-h-[500px]">
            {error && <div className="text-danger bg-danger/10 p-4 rounded-xl border border-danger/20 text-sm text-center mb-6 font-medium">{error}</div>}
            {clientSecret ? (
              <Elements key={clientSecret} options={options} stripe={stripePromise}>
                <CheckoutForm formattedPrice={displayPrice} mode={paymentMode} />
              </Elements>
            ) : (
              !error && <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-accent"><Loader size="medium" /></div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}