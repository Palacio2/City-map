import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { processPayment } from '../api/paymentApi';
import type { PaymentRequest, PaymentResponse } from '../types';

export const usePaymentIntent = (planKey: string | undefined) => {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  
  const [clientSecret, setClientSecret] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string>('');
  const [finalAmount, setFinalAmount] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<'payment' | 'setup'>('payment');
  const [promoSuccess, setPromoSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation<PaymentResponse, Error, PaymentRequest>({
    mutationFn: processPayment,
    onSuccess: (data, variables) => {
      setClientSecret(data.clientSecret);
      setFinalAmount(data.amount);
      setPaymentMode(data.mode);
      setErrorMsg(null);
      if (variables.promoCode) {
        setPromoSuccess(true);
      }
    },
    onError: (err, variables) => {
      if (err.message.includes('Unauthorized')) {
        navigate('/login');
      } else {
        setErrorMsg(err.message || t('payment.errors.create_failed'));
        setClientSecret('');
        if (variables.promoCode) {
          setPromoCode('');
          setPromoSuccess(false);
        }
      }
    }
  });

  const initializePayment = useCallback((code: string | null = null) => {
    if (!planKey) return;
    mutation.mutate({ planKey, promoCode: code });
  }, [planKey, mutation]);

  useEffect(() => {
    if (!planKey) {
      navigate('/subscription');
      return;
    }
    initializePayment();
  }, [planKey, navigate, initializePayment]);

  return {
    clientSecret,
    promoCode,
    setPromoCode,
    finalAmount,
    paymentMode,
    promoSuccess,
    errorMsg,
    isLoading: mutation.isPending,
    applyPromo: () => initializePayment(promoCode)
  };
};