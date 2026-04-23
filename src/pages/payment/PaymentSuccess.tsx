import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaReceipt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@subscription/SubscriptionContext';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { updateSubscription } = useSubscription();
  const { t } = useTranslation('db');

  const paymentIntent = searchParams.get('payment_intent');
  const setupIntent = searchParams.get('setup_intent');
  const realTxId = paymentIntent || setupIntent;

  const formatEuro = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '';
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const [displayData] = useState(() => ({
    amount: (location.state as any)?.amount ?? (setupIntent ? 0 : undefined),
    txId: realTxId || `TX-${Date.now().toString().slice(-8)}`,
    date: new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }));

  useEffect(() => {
    updateSubscription(); 
  }, [updateSubscription]);

  return (
    <div className="min-h-[100dvh] bg-body px-4 py-24 flex flex-col items-center justify-center animate-fadeIn">
      <div className="w-full max-w-[540px] ui-glass-panel p-8 md:p-12 text-center relative overflow-hidden flex flex-col items-center shadow-2xl border-success/30">
        
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-success to-emerald-400" />

        <div className="mb-8">
           <div className="w-24 h-24 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success text-5xl mx-auto mb-6 shadow-[0_0_30px_rgba(46,204,113,0.15)] relative">
              <FaCheckCircle className="drop-shadow-lg" />
              <div className="absolute inset-0 rounded-full border border-success/40 animate-ping opacity-20" />
           </div>
           <h2 className="m-0 mb-3 text-textMain font-heading text-3xl font-bold tracking-wide">
             {t('payment.success.title')}
           </h2>
           <p className="m-0 text-textSecondary text-lg">
             {t('payment.success.subtitle')}
           </p>
        </div>

        <div className="w-full bg-surface/50 rounded-2xl border border-borderClient p-6 mb-10 text-left">
          <div className="flex items-center gap-3 border-b border-dashed border-borderClient pb-4 mb-5">
              <FaReceipt className="text-textSecondary" />
              <h3 className="text-textMain font-heading text-sm font-bold m-0 uppercase tracking-widest">
                {t('payment.success.details_title')}
              </h3>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm">
                <span className="text-textSecondary font-medium">{t('payment.success.labels.status')}</span>
                <span className="text-success font-bold uppercase tracking-wider bg-success/10 px-3 py-1 rounded-full text-xs border border-success/20">
                  {t('payment.success.status_ok')}
                </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
                <span className="text-textSecondary font-medium">{t('payment.success.labels.date')}</span>
                <span className="font-semibold text-textMain">{displayData.date}</span>
            </div>

            {displayData.amount !== undefined && (
                <div className="flex justify-between items-center text-sm">
                    <span className="text-textSecondary font-medium">{t('payment.success.labels.amount')}</span>
                    <span className="font-bold text-accent font-heading text-base">{formatEuro(displayData.amount)}</span>
                </div>
            )}
            
            <div className="flex justify-between items-center text-sm pt-4 border-t border-borderClient/50">
                <span className="text-textSecondary font-medium">{t('payment.success.labels.tx_id')}</span>
                <span className="font-mono text-textSecondary text-xs bg-body px-2 py-1 rounded border border-borderClient truncate max-w-[150px] sm:max-w-[200px]" title={displayData.txId}>
                  {displayData.txId}
                </span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/')} 
          className="w-full py-4 bg-gradient-to-br from-accent to-accent-hover text-white rounded-xl font-heading text-base font-bold uppercase tracking-widest cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-md"
        >
            {t('payment.success.actions.to_map')}
        </button>
      </div>
    </div>
  );
}