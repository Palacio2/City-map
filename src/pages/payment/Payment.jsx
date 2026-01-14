import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaCheckCircle, FaArrowLeft, FaShieldAlt, FaSync, FaTag } from 'react-icons/fa';
import { useTranslation } from 'react-i18next'; 
import { subscriptionPlans } from '../subscription/subscriptionPlans';
import { processPayment, activateSubscription } from '../../components/api/paymentApi'; // Імпортуємо activateSubscription
import styles from './Payment.module.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ formattedPrice, mode, subscriptionId }) => { // Отримуємо subscriptionId
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation('payment'); 
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setMessage(null); // Очищаємо старі помилки

    const returnUrl = `${window.location.origin}/payment-success`;

    try {
        // 1. Підтверджуємо Setup або Payment у Stripe
        let result;
        if (mode === 'setup') {
            result = await stripe.confirmSetup({
                elements,
                redirect: 'if_required', // Не перенаправляти автоматично, якщо не треба
                confirmParams: { return_url: returnUrl },
            });
        } else {
            result = await stripe.confirmPayment({
                elements,
                redirect: 'if_required',
                confirmParams: { return_url: returnUrl },
            });
        }

        if (result.error) {
            throw new Error(result.error.message);
        }

        // 2. Якщо Stripe дав добро -> Активуємо підписку в нашій БД
        if (subscriptionId) {
            await activateSubscription(subscriptionId);
        }

        // 3. Якщо все успішно -> Перенаправляємо вручну
        window.location.href = returnUrl;

    } catch (err) {
        console.error(err);
        setMessage(err.message || t('errors.payment_failed'));
        setIsProcessing(false);
    }
  };

  const getButtonText = () => {
      if (isProcessing) return t('processing');
      if (mode === 'setup') return t('activate_btn'); // "Активувати" для 0 ціни
      return t('pay_btn', { amount: formattedPrice });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      {message && <div className={styles.serverError}>{message}</div>}
      
      <button disabled={isProcessing || !stripe || !elements} className={styles.payBtn}>
        {getButtonText()}
      </button>
      
      <div className={styles.security}><FaShieldAlt /> {t('security')}</div>
    </form>
  );
};

export default function Payment() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { t } = useTranslation(['payment', 'subscription']);

  const [clientSecret, setClientSecret] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [finalAmount, setFinalAmount] = useState(null);
  const [paymentMode, setPaymentMode] = useState('payment');
  const [subscriptionId, setSubscriptionId] = useState(null); // ID для активації

  const planKey = state?.planKey;
  const planConfig = subscriptionPlans[planKey];

  const formatEuro = (amount) => {
    if (amount === null || amount === undefined) return '...';
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const fetchPaymentIntent = async (code = null) => {
    try {
      setClientSecret(""); // Скидаємо, щоб показати лоадер при зміні коду
      const data = await processPayment({
        planKey,
        promoCode: code
      });
      
      console.log("Payment Init Data:", data);

      if (data && data.clientSecret) {
          setClientSecret(data.clientSecret);
          setFinalAmount(data.amount);
          setPaymentMode(data.mode);
          setSubscriptionId(data.subscriptionId); // Зберігаємо ID
      } else {
          throw new Error("No client secret returned from server");
      }
      
    } catch (error) {
      console.error(error);
      if (error.message === 'Unauthorized' || error.message.includes('authorization')) {
          navigate('/auth');
      } else {
          alert(error.message || t('errors.payment_create'));
          if (code) setPromoCode(""); 
      }
    }
  };

  useEffect(() => {
    if (!planKey || !planConfig) navigate('/subscription');
    else fetchPaymentIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey]);

  const options = useMemo(() => ({
    clientSecret,
    appearance: { theme: 'stripe', variables: { colorPrimary: '#667eea' } },
  }), [clientSecret]);

  if (!planConfig) return null;

  const displayPrice = finalAmount !== null ? formatEuro(finalAmount) : t('loading');

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <button onClick={() => navigate(-1)} className={styles.backLink}>
            <FaArrowLeft /> {t('payment:back')}
        </button>
        <h1 className={styles.title}>{t('payment:title', { plan: planConfig.name })}</h1>

        <div className={styles.grid}>
          <div className={styles.infoCard}>
            <div className={styles.headerRow}><FaCheckCircle /> {t('payment:tariff_label')}</div>
            <div className={styles.priceTag}>
                {displayPrice}
            </div>
            
            <div className={styles.promoSection}>
                <label className={styles.promoLabel}><FaTag /> {t('payment:promo_label')}</label>
                <div className={styles.promoInputGroup}>
                    <input 
                        type="text" 
                        value={promoCode} 
                        onChange={(e) => setPromoCode(e.target.value)} 
                        placeholder={t('payment:promo_placeholder')}
                        className={styles.promoInput}
                    />
                    <button 
                        onClick={() => fetchPaymentIntent(promoCode)} 
                        disabled={!promoCode}
                        className={styles.promoButton}
                    >
                        {t('payment:promo_apply')}
                    </button>
                </div>
            </div>

            <div className={styles.featuresList}>
              {planConfig.features.map((f, i) => (
                <div key={i} className={styles.feature}>
                    <FaCheckCircle size={14} color="#48bb78"/> 
                    {t(`subscription:subscription.features.${f}`)}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.paymentCard}>
            {clientSecret ? (
              <Elements key={clientSecret} options={options} stripe={stripePromise}>
                <CheckoutForm 
                    formattedPrice={displayPrice} 
                    mode={paymentMode} 
                    subscriptionId={subscriptionId}
                />
              </Elements>
            ) : (
              <div className={styles.loadingState}><FaSync className={styles.spin} /></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}