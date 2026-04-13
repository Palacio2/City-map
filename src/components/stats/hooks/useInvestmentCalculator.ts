import { useState, useEffect, useCallback, ChangeEvent } from 'react';

export interface CalculatorValues {
  propertyPrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  rentalIncome: number;
  expenses: number;
}

export interface CalculatorResults {
  monthlyPayment: number;
  cashFlow: number;
  capRate: number;
  grossYield: number;
  totalInterest: number;
  totalPayment: number;
  cashOnCash: number;
}

export interface Currency {
  code: string;
  symbol: string;
  label: string;
}

const INITIAL_STATE: CalculatorValues = {
  propertyPrice: 100000,
  downPayment: 20000,
  interestRate: 5,
  loanTerm: 30,
  rentalIncome: 1000,
  expenses: 0
};

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'PLN', symbol: 'zł', label: 'PLN (zł)' },
  { code: 'UAH', symbol: '₴', label: 'UAH (₴)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' }
];

export function useInvestmentCalculator() {
  const [values, setValues] = useState<CalculatorValues>(INITIAL_STATE);
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0]); 
  
  const [results, setResults] = useState<CalculatorResults>({
    monthlyPayment: 0,
    cashFlow: 0,
    capRate: 0,
    grossYield: 0,
    totalInterest: 0,
    totalPayment: 0,
    cashOnCash: 0
  });

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  }, []);

  const handleCurrencyChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    const selected = CURRENCIES.find(c => c.code === selectedCode) || CURRENCIES[0];
    setCurrency(selected);
  }, []);

  const handleReset = useCallback(() => {
    setValues(INITIAL_STATE);
  }, []);

  useEffect(() => {
    const { propertyPrice, downPayment, interestRate, loanTerm, rentalIncome, expenses } = values;
    
    const principal = propertyPrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    let monthlyMortgage = 0;
    let totalPayment = 0;

    if (principal > 0) {
      if (interestRate > 0) {
        monthlyMortgage = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      } else {
        monthlyMortgage = principal / numberOfPayments;
      }
      totalPayment = monthlyMortgage * numberOfPayments;
    }

    const totalInterest = totalPayment - principal;
    const monthlyNOI = rentalIncome - expenses;
    const annualNOI = monthlyNOI * 12;
    const cashFlow = monthlyNOI - monthlyMortgage;
    const annualCashFlow = cashFlow * 12;
    const annualGrossIncome = rentalIncome * 12;

    const grossYield = propertyPrice > 0 ? (annualGrossIncome / propertyPrice) * 100 : 0;
    const capRate = propertyPrice > 0 ? (annualNOI / propertyPrice) * 100 : 0;
    const cashOnCash = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;

    setResults({
      monthlyPayment: monthlyMortgage,
      cashFlow,
      capRate,
      grossYield,
      totalInterest: totalInterest > 0 ? totalInterest : 0,
      totalPayment,
      cashOnCash
    });
  }, [values]);

  return {
    values,
    currency,
    results,
    handleChange,
    handleCurrencyChange,
    handleReset,
    currencies: CURRENCIES
  };
}