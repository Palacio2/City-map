import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaUndo, FaMoneyBillWave, FaPercentage, FaChartLine } from 'react-icons/fa';
import { useInvestmentCalculator } from '../../hooks/useInvestmentCalculator'; 
import styles from './InvestmentCalculator.module.css';

export default function InvestmentCalculator() {
  const { t } = useTranslation('stats');
  const { values, currency, results, handleChange, handleCurrencyChange, handleReset, currencies } = useInvestmentCalculator();

  const inputFields = [
    { name: 'propertyPrice', label: t('calculator.property_price'), suffix: `(${currency.symbol})` },
    { name: 'downPayment', label: t('calculator.down_payment'), suffix: `(${currency.symbol})` },
    { name: 'interestRate', label: t('calculator.interest_rate'), suffix: '(%)', step: '0.1' },
    { name: 'loanTerm', label: t('calculator.loan_term'), suffix: `(${t('calculator.years')})` },
    { name: 'rentalIncome', label: t('calculator.rental_income'), suffix: `(${currency.symbol}/mo)` },
    { name: 'expenses', label: t('calculator.expenses'), suffix: `(${currency.symbol}/mo)`, placeholder: 'Taxes, HOA...' }
  ];

  return (
    <div className={styles.calculatorContainer}>
      <div className={styles.inputsSection}>
        <div className={styles.headerRow}>
          <h4 className={styles.sectionTitle}>{t('calculator.inputs')}</h4>
          <select className={styles.currencySelect} value={currency.code} onChange={handleCurrencyChange}>
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.gridInputs}>
          {inputFields.map((field) => (
            <div key={field.name} className={styles.inputGroup}>
              <label>{field.label} {field.suffix}</label>
              <input 
                type="number" 
                name={field.name} 
                value={values[field.name]} 
                onChange={handleChange} 
                min="0" 
                step={field.step || "1"}
                placeholder={field.placeholder || ""}
              />
            </div>
          ))}
        </div>
        
        <button onClick={handleReset} className={styles.resetBtn}>
          <FaUndo /> {t('calculator.reset')}
        </button>
      </div>

      <div className={styles.resultsSection}>
        <h4 className={styles.sectionTitle}>{t('calculator.results')}</h4>
        
        <div className={styles.mainResult}>
          <span className={styles.mainLabel}>{t('calculator.cash_flow')}</span>
          <span className={`${styles.mainValue} ${results.cashFlow >= 0 ? styles.positive : styles.negative}`}>
            {currency.symbol}{results.cashFlow.toFixed(2)}
          </span>
          <span className={styles.subLabel}>{t('calculator.monthly')}</span>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricItem}>
            <div className={styles.metricIcon}><FaMoneyBillWave /></div>
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>{t('calculator.monthly_payment')}</span>
              <span className={styles.metricValue}>{currency.symbol}{results.monthlyPayment.toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.metricItem}>
            <div className={styles.metricIcon}><FaPercentage /></div>
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>{t('calculator.cap_rate')}</span>
              <span className={styles.metricValue}>{results.capRate.toFixed(2)}%</span>
            </div>
          </div>

          <div className={styles.metricItem}>
            <div className={styles.metricIcon}><FaChartLine /></div>
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>{t('calculator.cash_on_cash')}</span>
              <span className={styles.metricValue}>{results.cashOnCash.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className={styles.totalInfo}>
          <span>{t('calculator.total_interest')}: <b>{currency.symbol}{results.totalInterest.toLocaleString('uk-UA', {maximumFractionDigits: 0})}</b></span>
        </div>
      </div>
    </div>
  ); 
}