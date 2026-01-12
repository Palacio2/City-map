import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaCheckCircle, FaArrowLeft, FaShieldAlt, FaSync, FaTag } from 'react-icons/fa';
import { useTranslation } from 'react-i18next'; 
import { useSubscription } from '../subscription/SubscriptionContext';
import { subscriptionPlans } from '../subscription/subscriptionPlans';
import { supabase } from '../../supabaseClient';
import styles from './Payment.module.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ price, mode }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation('payment'); 
  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);

    let result;

    if (mode === 'setup') {
        result = await stripe.confirmSetup({
            elements,
            confirmParams: { return_url: `${window.location.origin}/payment-success` },
        });
    } else {
        result = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${window.location.origin}/payment-success` },
        });
    }

    if (result.error) {
        setMessage(result.error.message);
        setIsProcessing(false);
    }
  };

  const getButtonText = () => {
      if (isProcessing) return t('processing');
      if (mode === 'setup') return t('activate_btn');
      return t('pay_btn', { amount: price });
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

  const planKey = state?.planKey;
  const planConfig = subscriptionPlans[planKey];

  const fetchPaymentIntent = async (code = null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/auth');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ planKey, promoCode: code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('payment:errors.payment_create'));
      
      setClientSecret(data.clientSecret);
      setFinalAmount(data.amount);
      setPaymentMode(data.mode);
      
    } catch (error) {
      console.error(error);
      alert(error.message);
      if (code) setPromoCode(""); 
    }
  };

  useEffect(() => {
    if (!planKey || !planConfig) navigate('/subscription');
    else fetchPaymentIntent();
  }, [planKey]);

  const options = useMemo(() => ({
    clientSecret,
    appearance: { theme: 'stripe', variables: { colorPrimary: '#667eea' } },
  }), [clientSecret]);

  if (!planConfig) return null;

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
                {finalAmount !== null ? `${finalAmount} грн` : planConfig.price}
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
                    price={finalAmount !== null ? `${finalAmount} грн` : planConfig.price} 
                    mode={paymentMode} 
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