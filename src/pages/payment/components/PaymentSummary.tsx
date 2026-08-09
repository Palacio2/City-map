import { useTranslation } from 'react-i18next';
import { FaGem, FaTag, FaCheckCircle } from 'react-icons/fa';
import type { PlanConfig } from '@subscription/types';

interface PaymentSummaryProps {
  readonly planConfig: PlanConfig;
  readonly displayPrice: string;
  readonly promoCode: string;
  readonly setPromoCode: (val: string) => void;
  readonly onApplyPromo: () => void;
  readonly promoSuccess: boolean;
  readonly isPromoLoading: boolean;
}

export const PaymentSummary = ({
  planConfig,
  displayPrice,
  promoCode,
  setPromoCode,
  onApplyPromo,
  promoSuccess,
  isPromoLoading
}: PaymentSummaryProps) => {
  const { t } = useTranslation('db');

  return (
    <div className="ui-glass-panel p-6 md:p-8 flex flex-col h-full border-accent/20">
      <div className="flex items-center gap-4 border-b border-borderClient pb-6 mb-6">
        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xl shrink-0">
          <FaGem />
        </div>
        <div>
          <span className="text-xs text-textSecondary uppercase tracking-widest font-semibold block mb-1">
            {t('payment.labels.tariff')}
          </span>
          <span className="font-heading text-xl font-bold text-textMain">
            {planConfig.name}
          </span>
        </div>
      </div>

      <div className="bg-surface/50 border border-borderClient p-6 rounded-2xl text-center mb-8">
        <div className="font-heading text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-hover tracking-tight drop-shadow-sm">
          {displayPrice}
        </div>
      </div>

      <div className="mb-8">
        <label className="text-xs font-bold flex items-center gap-2 mb-3 text-textSecondary uppercase tracking-widest">
          <FaTag className="text-accent" /> {t('payment.labels.promo')}
        </label>
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder={t('payment.placeholders.promo')}
            className="flex-1 p-3.5 rounded-xl border border-borderClient bg-surface text-textMain font-medium text-sm transition-all focus:border-accent focus:ring-1 focus:ring-accent outline-none uppercase"
          />
          <button
            type="button"
            onClick={onApplyPromo}
            disabled={!promoCode || isPromoLoading}
            className="px-6 rounded-xl bg-surface border border-borderClient text-textMain font-heading font-bold text-xs uppercase tracking-widest transition-all hover:not(:disabled):border-accent hover:not(:disabled):text-accent hover:not(:disabled):bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('payment.actions.apply_promo')}
          </button>
        </div>
        {promoSuccess && (
          <div className="text-success text-xs font-medium mt-3 flex items-center gap-1.5">
            <FaCheckCircle /> {t('payment.status.promo_ok')}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3.5 mt-auto border-t border-borderClient pt-6">
        {planConfig.features.map((f, i) => (
          <div key={i} className="flex gap-3 text-sm text-textSecondary items-start leading-relaxed">
            <FaCheckCircle className="text-success min-w-[16px] mt-0.5" />
            <span>{t(`subscription.features.${f}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};