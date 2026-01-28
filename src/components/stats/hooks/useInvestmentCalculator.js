import { useState, useEffect, useCallback } from 'react';

const INITIAL_STATE = {
  propertyPrice: 100000,
  downPayment: 20000,
  interestRate: 5,
  loanTerm: 30,
  rentalIncome: 1000,
  expenses: 0 // 🆕 Додано поле витрат (податки, страхування, ремонт)
};

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'PLN', symbol: 'zł', label: 'PLN (zł)' },
  { code: 'UAH', symbol: '₴', label: 'UAH (₴)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' }
];

export function useInvestmentCalculator() {
  const [values, setValues] = useState(INITIAL_STATE);
  const [currency, setCurrency] = useState(CURRENCIES[0]); 
  
  const [results, setResults] = useState({
    monthlyPayment: 0,
    cashFlow: 0,
    capRate: 0, // Тепер це буде справжній Cap Rate (NOI / Price)
    grossYield: 0, // 🆕 Додано валову дохідність (те, що ви рахували як Cap Rate раніше)
    totalInterest: 0,
    totalPayment: 0,
    cashOnCash: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleCurrencyChange = (e) => {
    const selectedCode = e.target.value;
    const selected = CURRENCIES.find(c => c.code === selectedCode) || CURRENCIES[0];
    setCurrency(selected);
  };

  const handleReset = useCallback(() => {
    setValues(INITIAL_STATE);
  }, []);

  useEffect(() => {
    const { propertyPrice, downPayment, interestRate, loanTerm, rentalIncome, expenses } = values;
    
    // 1. Тіло кредиту
    const principal = propertyPrice - downPayment;
    
    // 2. Розрахунок іпотеки
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

    // 3. Фінансові показники
    
    // NOI (Net Operating Income) - Чистий дохід БЕЗ іпотеки (Оренда - Витрати)
    const monthlyNOI = rentalIncome - expenses;
    const annualNOI = monthlyNOI * 12;

    // Cash Flow - Чистий дохід З іпотекою (NOI - Mortgage)
    const cashFlow = monthlyNOI - monthlyMortgage;
    const annualCashFlow = cashFlow * 12;

    // Gross Yield (Валова дохідність) = (Річна оренда / Ціна)
    const annualGrossIncome = rentalIncome * 12;
    const grossYield = propertyPrice > 0 ? (annualGrossIncome / propertyPrice) * 100 : 0;

    // Cap Rate (Real) = (NOI / Price)
    const capRate = propertyPrice > 0 ? (annualNOI / propertyPrice) * 100 : 0;

    // Cash on Cash Return = (Annual Cash Flow / Invested Cash)
    const cashOnCash = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;

    setResults({
      monthlyPayment: monthlyMortgage,
      cashFlow: cashFlow,
      capRate: capRate,
      grossYield: grossYield,
      totalInterest: totalInterest > 0 ? totalInterest : 0,
      totalPayment: totalPayment,
      cashOnCash: cashOnCash
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