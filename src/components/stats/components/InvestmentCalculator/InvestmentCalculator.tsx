import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaUndo, FaMoneyBillWave, FaPercentage, FaChartLine } from 'react-icons/fa';
import { calculatorConstraints, useInvestmentCalculator, type CalculatorField } from '@stats/hooks/useInvestmentCalculator';

export default function InvestmentCalculator() {
  const { t } = useTranslation('db');
  const { values, currency, results, handleChange, handleCurrencyChange, handleReset, currencies } = useInvestmentCalculator();
  const inputs = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    // Native messages follow the browser language; constraints also describe
    // cross-field failures (e.g. a deposit greater than the property price).
    const next: Record<string, string> = {};
    inputs.current?.querySelectorAll('input').forEach(input => {
      if (!input.validity.valid) next[input.name] = input.validationMessage;
    });
    setErrors(next);
  }, [values]);

  const inputFields = [
    { name: 'propertyPrice', label: t('stats.calculator.property_price'), suffix: `(${currency.symbol})` },
    { name: 'downPayment', label: t('stats.calculator.down_payment'), suffix: `(${currency.symbol})` },
    { name: 'interestRate', label: t('stats.calculator.interest_rate'), suffix: '(%)', step: '0.1' },
    { name: 'loanTerm', label: t('stats.calculator.loan_term'), suffix: `(${t('stats.calculator.years')})` },
    { name: 'rentalIncome', label: t('stats.calculator.rental_income'), suffix: `(${currency.symbol}/mo)` },
    { name: 'expenses', label: t('stats.calculator.expenses'), suffix: `(${currency.symbol}/mo)`, placeholder: t('stats.calculator.placeholders.expenses') }
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-stretch gap-6">
      
      <div className="flex-1 flex flex-col gap-5">
        <div className="flex justify-between items-center pb-4 border-b border-borderClient dark:border-white/10">
          <h3 className="font-heading text-lg text-textMain m-0 font-bold uppercase tracking-wide">
            {t('stats.calculator.parameters')}
          </h3>
          <div className="flex items-center gap-3">
            <select 
              className="bg-body dark:bg-white/5 border border-borderClient dark:border-white/10 text-textMain text-sm rounded-lg px-3 py-1.5 cursor-pointer outline-hidden transition-colors hover:border-accent dark:hover:border-accent focus:border-accent"
              value={currency.code}
              onChange={handleCurrencyChange}
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
            <button 
              className="bg-transparent border border-borderClient dark:border-white/10 text-textSecondary w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:text-accent hover:border-accent dark:hover:border-accent hover:bg-accent/5" 
              onClick={handleReset} 
              title={t('stats.calculator.reset')}
            >
              <FaUndo className="text-sm" />
            </button>
          </div>
        </div>

        <div ref={inputs} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inputFields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label htmlFor={`${inputId}-${field.name}`} className="text-[0.65rem] sm:text-xs uppercase tracking-widest text-textSecondary font-semibold flex justify-between">
                <span>{field.label}</span>
                <span className="text-accent/70">{field.suffix}</span>
              </label>
              <input 
                type="number" 
                id={`${inputId}-${field.name}`}
                name={field.name}
                value={values[field.name as CalculatorField]}
                onChange={handleChange}
                required
                {...calculatorConstraints(values, field.name as CalculatorField)}
                aria-invalid={!!errors[field.name]}
                aria-describedby={errors[field.name] ? `${inputId}-${field.name}-error` : undefined}
                placeholder={field.placeholder}
                className="w-full bg-body dark:bg-white/5 border border-borderClient dark:border-white/10 text-textMain rounded-lg px-4 py-2.5 text-[0.95rem] font-medium transition-all outline-hidden hover:border-accent/50 dark:hover:border-accent focus:border-accent focus:ring-1 focus:ring-accent"
              />
              {errors[field.name] && <span id={`${inputId}-${field.name}-error`} className="text-xs text-danger" aria-live="polite">{errors[field.name]}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:block w-px bg-borderClient dark:bg-white/10 self-stretch" />

      <div className="flex-1 flex flex-col gap-5 bg-body dark:bg-transparent rounded-xl p-0 sm:p-2">
        <h3 className="font-heading text-lg text-textMain m-0 mb-2 font-bold uppercase tracking-wide text-center">
          {t('stats.calculator.results')}
        </h3>

        <div className="bg-gradient-to-br from-accent to-accent-hover rounded-xl p-5 text-white flex flex-col items-center justify-center gap-1 shadow-md">
          <span className="text-xs uppercase tracking-widest opacity-90 font-semibold text-center">
            {t('stats.calculator.monthly_mortgage')}
          </span>
          <span className="font-heading text-3xl font-bold tracking-tight">
            {results ? `${currency.symbol}${results.monthlyPayment.toFixed(0)}` : '—'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-2">
          <div className="bg-surface dark:bg-white/5 rounded-lg p-3 sm:p-4 flex flex-row sm:flex-col items-center sm:text-center text-left border border-borderClient dark:border-white/10 gap-3 sm:gap-2 transition-all hover:border-success/50">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-success/10 text-success flex items-center justify-center text-sm sm:text-base shrink-0">
              <FaMoneyBillWave />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.65rem] sm:text-[0.7rem] uppercase tracking-widest text-textSecondary font-semibold">
                {t('stats.calculator.monthly_cashflow')}
              </span>
              <span className={`text-[0.9rem] sm:text-base font-bold font-heading ${!results ? 'text-textMain' : results.cashFlow >= 0 ? 'text-success' : 'text-danger'}`}>
                {results ? `${results.cashFlow >= 0 ? '+' : ''}${currency.symbol}${results.cashFlow.toFixed(0)}` : '—'}
              </span>
            </div>
          </div>

          <div className="bg-surface dark:bg-white/5 rounded-lg p-3 sm:p-4 flex flex-row sm:flex-col items-center sm:text-center text-left border border-borderClient dark:border-white/10 gap-3 sm:gap-2 transition-all hover:border-warning/50">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center text-sm sm:text-base shrink-0">
              <FaPercentage />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.65rem] sm:text-[0.7rem] uppercase tracking-widest text-textSecondary font-semibold">
                {t('stats.calculator.cap_rate')}
              </span>
              <span className="text-[0.9rem] sm:text-base font-bold text-textMain font-heading">
                {results ? `${results.capRate.toFixed(2)}%` : '—'}
              </span>
            </div>
          </div>

          <div className="bg-surface dark:bg-white/5 rounded-lg p-3 sm:p-4 flex flex-row sm:flex-col items-center sm:text-center text-left border border-borderClient dark:border-white/10 gap-3 sm:gap-2 transition-all hover:border-accent/50">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm sm:text-base shrink-0">
              <FaChartLine />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.65rem] sm:text-[0.7rem] uppercase tracking-widest text-textSecondary font-semibold">
                {t('stats.calculator.cash_on_cash')}
              </span>
              <span className="text-[0.9rem] sm:text-base font-bold text-textMain font-heading">
                {results?.cashOnCash != null ? `${results.cashOnCash.toFixed(2)}%` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto text-[0.85rem] text-textSecondary text-center bg-surface dark:bg-white/5 p-3 rounded-md border border-borderClient dark:border-white/10">
          <span>
            {t('stats.calculator.total_interest')}: <b className="text-textMain">{results ? `${currency.symbol}${results.totalInterest.toFixed(0)}` : '—'}</b>
          </span>
        </div>
      </div>
    </div>
  );
}
