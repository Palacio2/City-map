import { useTranslation } from 'react-i18next';
import { PaymentElement } from '@stripe/react-stripe-js';
import { FaShieldAlt } from 'react-icons/fa';
import { usePaymentForm } from '../hooks/usePaymentForm';

interface CheckoutFormProps {
  readonly formattedPrice: string;
  readonly mode: 'payment' | 'setup';
}

export const CheckoutForm = ({ formattedPrice, mode }: CheckoutFormProps) => {
  const { t } = useTranslation('db');
  const { stripe, elements, message, isProcessing, handleSubmit } = usePaymentForm(mode);

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
          type="submit"
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