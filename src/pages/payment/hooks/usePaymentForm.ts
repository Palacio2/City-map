import { useState } from 'react';
import type { FormEvent } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslation } from 'react-i18next';

export const usePaymentForm = (mode: 'payment' | 'setup') => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation('db');
  
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    
    setIsProcessing(true);
    setMessage(null);
    
    const returnUrl = `${window.location.origin}/payment-success`;
    
    try {
      const confirmMethod = mode === 'setup' ? stripe.confirmSetup : stripe.confirmPayment;
      const result = await confirmMethod({
        elements,
        redirect: 'if_required',
        confirmParams: { return_url: returnUrl },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
      
      window.location.href = returnUrl;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('payment.errors.failed');
      setMessage(errorMessage);
      setIsProcessing(false);
    }
  };

  return {
    stripe,
    elements,
    message,
    isProcessing,
    handleSubmit
  };
};