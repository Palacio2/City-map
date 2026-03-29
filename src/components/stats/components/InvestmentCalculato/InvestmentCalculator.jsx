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
    <div className="flex flex-col md:flex-row md:items-stretch gap-6 bg-surface rounded-2xl p-6 shadow-card border border-borderClient transition-all w-full">
      
      {/* Секція введення даних */}
      <div className="flex-1 p-2 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h4 className="m-0 text-[1.1rem] font-heading font-semibold text-textMain uppercase tracking-widest">
            {t('stats.calculator.inputs')}
          </h4>
          <select 
            className="px-3 py-2 rounded-md border border-borderClient bg-body font-semibold cursor-pointer text-textMain outline-none transition-all font-body text-sm focus:border-accent" 
            value={currency.code} 
            onChange={handleCurrencyChange}
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {inputFields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] text-textSecondary font-semibold uppercase tracking-widest">
                {field.label} {field.suffix}
              </label>
              <input 
                type="number" 
                name={field.name} 
                value={values[field.name]} 
                onChange={handleChange} 
                min="0" 
                step={field.step || "1"}
                placeholder={field.placeholder || ""}
                className="px-3.5 py-3 border border-borderClient rounded-md text-[0.95rem] bg-body text-textMain transition-all font-body outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          ))}
        </div>
        
        <button 
          onClick={handleReset} 
          className="mt-auto flex items-center justify-center gap-2 w-full p-3 bg-body border border-borderClient text-textSecondary rounded-md cursor-pointer text-[0.9rem] font-heading transition-all hover:border-accent hover:text-textMain hover:bg-hover"
        >
          <FaUndo /> {t('stats.calculator.reset')}
        </button>
      </div>

      {/* Секція результатів */}
      <div className="flex-[0.9] bg-body p-6 rounded-2xl border border-borderClient flex flex-col gap-5">
        <h4 className="m-0 text-[1.1rem] font-heading font-semibold text-textMain uppercase tracking-widest text-center md:text-left">
          {t('stats.calculator.results')}
        </h4>
        
        <div className="text-center py-6 border-b border-dashed border-borderClient">
          <span className="block text-[0.85rem] text-textSecondary mb-2 uppercase tracking-[0.1em] font-semibold">
            {t('stats.calculator.cash_flow')}
          </span>
          <span className={`block font-heading text-[2.5rem] font-bold leading-[1.2] ${results.cashFlow >= 0 ? 'text-success drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'text-danger drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]'}`}>
            {currency.symbol}{results.cashFlow.toFixed(2)}
          </span>
          <span className="text-[0.8rem] text-textSecondary mt-1 block">
            {t('stats.calculator.monthly')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-surface rounded-lg p-3 sm:p-4 flex flex-row sm:flex-col items-center sm:text-center text-left border border-borderClient gap-3 sm:gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm sm:text-base shrink-0">
              <FaMoneyBillWave />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.65rem] sm:text-[0.7rem] uppercase tracking-widest text-textSecondary font-semibold">
                {t('stats.calculator.monthly_payment')}
              </span>
              <span className="text-[0.9rem] sm:text-base font-bold text-textMain font-heading">
                {currency.symbol}{results.monthlyPayment.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-3 sm:p-4 flex flex-row sm:flex-col items-center sm:text-center text-left border border-borderClient gap-3 sm:gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm sm:text-base shrink-0">
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
            {t('stats.calculator.total_interest')}: <b className="text-textMain font-semibold ml-1">{currency.symbol}{results.totalInterest.toLocaleString('uk-UA', {maximumFractionDigits: 0})}</b>
          </span>
        </div>
      </div>

    </div>
  ); 
}