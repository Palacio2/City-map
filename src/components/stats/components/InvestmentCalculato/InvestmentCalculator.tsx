import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaUndo, FaMoneyBillWave, FaPercentage, FaChartLine } from 'react-icons/fa';
import { useInvestmentCalculator } from '../../hooks/useInvestmentCalculator'; 

export default function InvestmentCalculator() {
  const { t } = useTranslation('db');
  const { values, currency, results, handleChange, handleCurrencyChange, handleReset, currencies } = useInvestmentCalculator();

  const inputFields = [
    { name: 'propertyPrice', label: t('stats.calculator.property_price'), suffix: `(${currency.symbol})` },
    { name: 'downPayment', label: t('stats.calculator.down_payment'), suffix: `(${currency.symbol})` },
    { name: 'interestRate', label: t('stats.calculator.interest_rate'), suffix: '(%)', step: '0.1' },
    { name: 'loanTerm', label: t('stats.calculator.loan_term'), suffix: `(${t('stats.calculator.years')})` },
    { name: 'rentalIncome', label: t('stats.calculator.rental_income'), suffix: `(${currency.symbol}/mo)` },
    { name: 'expenses', label: t('stats.calculator.expenses'), suffix: `(${currency.symbol}/mo)`, placeholder: 'Taxes, HOA...' }
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-stretch gap-6 bg-surface rounded-2xl p-6 shadow-card border border-borderClient">
      
      <div className="flex-1 flex flex-col gap-5">
        <div className="flex justify-between items-center pb-4 border-b border-borderClient">
          <h3 className="font-heading text-lg text-textMain m-0 font-bold uppercase tracking-wide">
            {t('stats.calculator.parameters')}
          </h3>
          <div className="flex items-center gap-3">
            <select 
              className="bg-body border border-borderClient text-textMain text-sm rounded-lg px-3 py-1.5 cursor-pointer outline-none transition-colors hover:border-accent focus:border-accent"
              value={currency.code}
              onChange={handleCurrencyChange}
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
            <button 
              className="bg-transparent border border-borderClient text-textSecondary w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:text-accent hover:border-accent hover:bg-accent/5" 
              onClick={handleReset} 
              title={t('stats.calculator.reset')}
            >
              <FaUndo className="text-sm" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inputFields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-textSecondary font-semibold flex justify-between">
                <span>{field.label}</span>
                <span className="text-accent/70">{field.suffix}</span>
              </label>
              <input 
                type="number" 
                name={field.name}
                value={values[field.name as keyof typeof values] || ''}
                onChange={handleChange}
                step={field.step || '1'}
                placeholder={field.placeholder}
                className="w-full bg-body border border-borderClient text-textMain rounded-lg px-4 py-2.5 text-[0.95rem] font-medium transition-all outline-none hover:border-accent/50 focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:block w-px bg-borderClient self-stretch" />

      <div className="flex-1 flex flex-col gap-5 bg-body rounded-xl p-5 sm:p-6 border border-borderClient">
        <h3 className="font-heading text-lg text-textMain m-0 mb-2 font-bold uppercase tracking-wide text-center">
          {t('stats.calculator.results')}
        </h3>

        <div className="bg-gradient-to-br from-accent to-accent-hover rounded-xl p-5 text-white flex flex-col items-center justify-center gap-1 shadow-md">
          <span className="text-xs uppercase tracking-widest opacity-90 font-semibold text-center">
            {t('stats.calculator.monthly_mortgage')}
          </span>
          <span className="font-heading text-3xl font-bold tracking-tight">
            {currency.symbol}{results.monthlyPayment.toFixed(0)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-2">
          <div className="bg-surface rounded-lg p-3 sm:p-4 flex flex-row sm:flex-col items-center sm:text-center text-left border border-borderClient gap-3 sm:gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-success/10 text-success flex items-center justify-center text-sm sm:text-base shrink-0">
              <FaMoneyBillWave />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.65rem] sm:text-[0.7rem] uppercase tracking-widest text-textSecondary font-semibold">
                {t('stats.calculator.monthly_cashflow')}
              </span>
              <span className={`text-[0.9rem] sm:text-base font-bold font-heading ${results.cashFlow >= 0 ? 'text-success' : 'text-danger'}`}>
                {results.cashFlow >= 0 ? '+' : ''}{currency.symbol}{results.cashFlow.toFixed(0)}
              </span>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-3 sm:p-4 flex flex-row sm:flex-col items-center sm:text-center text-left border border-borderClient gap-3 sm:gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center text-sm sm:text-base shrink-0">
              <FaPercentage />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.65rem] sm:text-[0.7rem] uppercase tracking-widest text-textSecondary font-semibold">
                {t('stats.calculator.cap_rate')}
              </span>
              <span className="text-[0.9rem] sm:text-base font-bold text-textMain font-heading">
                {results.capRate.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-3 sm:p-4 flex flex-row sm:flex-col items-center sm:text-center text-left border border-borderClient gap-3 sm:gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm sm:text-base shrink-0">
              <FaChartLine />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.65rem] sm:text-[0.7rem] uppercase tracking-widest text-textSecondary font-semibold">
                {t('stats.calculator.cash_on_cash')}
              </span>
              <span className="text-[0.9rem] sm:text-base font-bold text-textMain font-heading">
                {results.cashOnCash.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto text-[0.85rem] text-textSecondary text-center bg-surface p-3 rounded-md border border-borderClient">
          <span>
            {t('stats.calculator.total_interest')}: <b className="text-textMain">{currency.symbol}{results.totalInterest.toFixed(0)}</b>
          </span>
        </div>
      </div>
    </div>
  );
}