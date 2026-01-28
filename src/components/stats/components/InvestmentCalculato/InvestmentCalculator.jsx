import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaUndo, FaMoneyBillWave, FaPercentage, FaChartLine } from 'react-icons/fa';
import { useInvestmentCalculator } from '../../hooks/useInvestmentCalculator'; // Шлях до вашого хука
import styles from './InvestmentCalculator.module.css';

export default function InvestmentCalculator() {
  const { t } = useTranslation('stats');
  const { 
    values, 
    currency, 
    results, 
    handleChange, 
    handleCurrencyChange, 
    handleReset, 
    currencies 
  } = useInvestmentCalculator();

  return (
    <div className={styles.calculatorContainer}>
      <div className={styles.inputsSection}>
        <div className={styles.headerRow}>
          <h4 className={styles.sectionTitle}>{t('calculator.inputs')}</h4>
          <select 
            className={styles.currencySelect} 
            value={currency.code} 
            onChange={handleCurrencyChange}
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.gridInputs}>
          <div className={styles.inputGroup}>
            <label>{t('calculator.property_price')} ({currency.symbol})</label>
            <input type="number" name="propertyPrice" value={values.propertyPrice} onChange={handleChange} min="0" />
          </div>
          <div className={styles.inputGroup}>
            <label>{t('calculator.down_payment')} ({currency.symbol})</label>
            <input type="number" name="downPayment" value={values.downPayment} onChange={handleChange} min="0" />
          </div>
          <div className={styles.inputGroup}>
            <label>{t('calculator.interest_rate')} (%)</label>
            <input type="number" name="interestRate" value={values.interestRate} onChange={handleChange} step="0.1" min="0" />
          </div>
          <div className={styles.inputGroup}>
            <label>{t('calculator.loan_term')} ({t('calculator.years')})</label>
            <input type="number" name="loanTerm" value={values.loanTerm} onChange={handleChange} min="1" />
          </div>
          <div className={styles.inputGroup}>
            <label>{t('calculator.rental_income')} ({currency.symbol}/mo)</label>
            <input type="number" name="rentalIncome" value={values.rentalIncome} onChange={handleChange} min="0" />
          </div>
          {/* 🆕 Нове поле витрат */}
          <div className={styles.inputGroup}>
            <label>{t('calculator.expenses')} ({currency.symbol}/mo)</label>
            <input type="number" name="expenses" value={values.expenses} onChange={handleChange} min="0" placeholder="Taxes, HOA..." />
          </div>
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
              <span className={styles.metricLabel}>Cap Rate (Net)</span>
              <span className={styles.metricValue}>{results.capRate.toFixed(2)}%</span>
            </div>
          </div>

          <div className={styles.metricItem}>
            <div className={styles.metricIcon}><FaChartLine /></div>
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>Cash on Cash</span>
              <span className={styles.metricValue}>{results.cashOnCash.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className={styles.totalInfo}>
          <span>{t('calculator.total_interest')}: <b>{currency.symbol}{results.totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</b></span>
        </div>
      </div>
    </div>
  );
}