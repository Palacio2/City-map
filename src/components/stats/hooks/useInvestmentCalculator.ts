import { useState, useCallback, ChangeEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const INITIAL_STATE = {
  propertyPrice: '100000', downPayment: '20000', interestRate: '5',
  loanTerm: '30', rentalIncome: '1000', expenses: '0'
};
export type CalculatorValues = typeof INITIAL_STATE;
export type CalculatorField = keyof CalculatorValues;
export interface Currency { code: string; symbol: string; label: string }

export function calculatorConstraints(values: CalculatorValues, field: CalculatorField) {
  const price = Number(values.propertyPrice);
  if (field === 'propertyPrice') return { min: 0.01, max: 1e12, step: 'any' };
  if (field === 'downPayment') return { min: 0, max: Number.isFinite(price) && price >= 0 ? price : 1e12, step: 'any' };
  if (field === 'interestRate') return { min: 0, max: 100, step: 'any' };
  if (field === 'loanTerm') return { min: price > Number(values.downPayment) ? 1 : 0, max: 100, step: '1' };
  return { min: 0, max: 1e12, step: 'any' };
}

export function calculateInvestment(values: CalculatorValues) {
  for (const field of Object.keys(INITIAL_STATE) as CalculatorField[]) {
    const value = Number(values[field]);
    const { min, max, step } = calculatorConstraints(values, field);
    if (!values[field].trim() || !Number.isFinite(value) || value < min || value > max || (step === '1' && !Number.isInteger(value))) return null;
  }
  const propertyPrice = Number(values.propertyPrice);
  const downPayment = Number(values.downPayment);
  const principal = propertyPrice - downPayment;
  const monthlyRate = Number(values.interestRate) / 1200;
  const payments = Number(values.loanTerm) * 12;
  // Stable for tiny rates, without the overflow of a positive power.
  const monthlyPayment = principal === 0 ? 0 : monthlyRate === 0 ? principal / payments
    : principal * monthlyRate / -Math.expm1(-payments * Math.log1p(monthlyRate));
  const totalPayment = monthlyPayment * payments;
  const monthlyNOI = Number(values.rentalIncome) - Number(values.expenses);
  const cashFlow = monthlyNOI - monthlyPayment;
  const results = {
    monthlyPayment, cashFlow, totalPayment,
    capRate: monthlyNOI * 12 / propertyPrice * 100,
    grossYield: Number(values.rentalIncome) * 12 / propertyPrice * 100,
    totalInterest: Math.max(0, totalPayment - principal),
    cashOnCash: downPayment === 0 ? null : cashFlow * 12 / downPayment * 100
  };
  return Object.values(results).every(value => value === null || Number.isFinite(value)) ? results : null;
}

export function useInvestmentCalculator() {
  const { t } = useTranslation('db');
  const currencies = useMemo<Currency[]>(() => [
    { code: 'USD', symbol: '$', label: t('stats.calculator.currencies.usd') },
    { code: 'EUR', symbol: '€', label: t('stats.calculator.currencies.eur') },
    { code: 'PLN', symbol: 'zł', label: t('stats.calculator.currencies.pln') },
    { code: 'UAH', symbol: '₴', label: t('stats.calculator.currencies.uah') },
    { code: 'GBP', symbol: '£', label: t('stats.calculator.currencies.gbp') }
  ], [t]);
  const [values, setValues] = useState<CalculatorValues>(INITIAL_STATE);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const currency = currencies.find(item => item.code === currencyCode) ?? currencies[0];
  const results = useMemo(() => calculateInvestment(values), [values]);
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (Object.hasOwn(INITIAL_STATE, name)) setValues(prev => ({ ...prev, [name]: value }));
  }, []);
  const handleCurrencyChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    if (currencies.some(item => item.code === e.target.value)) setCurrencyCode(e.target.value);
  }, [currencies]);
  const handleReset = useCallback(() => setValues({ ...INITIAL_STATE }), []);
  return { values, currency, results, handleChange, handleCurrencyChange, handleReset, currencies };
}
