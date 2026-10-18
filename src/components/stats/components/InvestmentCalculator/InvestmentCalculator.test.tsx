import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import InvestmentCalculator from './InvestmentCalculator';
import { calculateInvestment } from '../../hooks/useInvestmentCalculator';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
afterEach(cleanup);
const field = (name: string) => screen.getByRole('spinbutton', { name: new RegExp(`stats.calculator.${name}`) }) as HTMLInputElement;
const defaults = { propertyPrice: '100000', downPayment: '20000', interestRate: '5', loanTerm: '30', rentalIncome: '1000', expenses: '0' };

it('preserves an empty term, explains the error and removes misleading results', () => {
  render(<InvestmentCalculator />);
  expect(screen.getByText('$429')).toBeTruthy();
  const term = field('loan_term');
  fireEvent.change(term, { target: { value: '' } });
  expect(term.value).toBe('');
  expect(term.getAttribute('aria-invalid')).toBe('true');
  expect(document.getElementById(term.getAttribute('aria-describedby')!)?.textContent).toBeTruthy();
  expect(screen.queryByText('$429')).toBeNull();
  expect(screen.getAllByText('—')).toHaveLength(5);
  fireEvent.change(term, { target: { value: '30' } });
  expect(term.getAttribute('aria-invalid')).toBe('false');
  expect(screen.getByText('$429')).toBeTruthy();
});

it('revalidates deposit when the property price changes and reset clears errors', () => {
  render(<InvestmentCalculator />);
  fireEvent.change(field('property_price'), { target: { value: '10000' } });
  expect(field('down_payment').getAttribute('aria-invalid')).toBe('true');
  expect(screen.getAllByText('—')).toHaveLength(5);
  fireEvent.click(screen.getByTitle('stats.calculator.reset'));
  expect(field('down_payment').getAttribute('aria-invalid')).toBe('false');
  expect(field('expenses').value).toBe('0');
  expect(screen.getByText('$429')).toBeTruthy();
});

it('keeps negative values visible for correction instead of silently clamping them', () => {
  render(<InvestmentCalculator />);
  fireEvent.change(field('rental_income'), { target: { value: '-50' } });
  expect(field('rental_income').value).toBe('-50');
  expect(field('rental_income').getAttribute('aria-invalid')).toBe('true');
  expect(screen.getAllByText('—')).toHaveLength(5);
});

it('rejects missing, nonfinite, out-of-range and fractional-year inputs', () => {
  for (const invalid of [{ loanTerm: '0' }, { loanTerm: '1.5' }, { loanTerm: '101' }, { propertyPrice: '0' },
    { downPayment: '100001' }, { expenses: '' }, { rentalIncome: '-1' }, { interestRate: 'Infinity' }, { propertyPrice: '1e309' }]) {
    expect(calculateInvestment({ ...defaults, ...invalid })).toBeNull();
  }
});

it('calculates zero-interest loans, cash purchases and undefined zero-deposit returns honestly', () => {
  const zeroInterest = calculateInvestment({ ...defaults, interestRate: '0' })!;
  expect(zeroInterest.monthlyPayment).toBeCloseTo(80000 / 360, 8);
  expect(zeroInterest.totalInterest).toBeCloseTo(0, 8);
  const cash = calculateInvestment({ ...defaults, downPayment: '100000', loanTerm: '0' })!;
  expect(cash.monthlyPayment).toBe(0);
  expect(cash.cashFlow).toBe(1000);
  expect(cash.cashOnCash).toBe(12);
  expect(calculateInvestment({ ...defaults, downPayment: '0' })?.cashOnCash).toBeNull();
});

it('keeps tiny-rate and high-rate amortization finite without fabricating zero mortgage', () => {
  const tiny = calculateInvestment({ ...defaults, interestRate: '0.00000000000001' })!;
  expect(tiny.monthlyPayment).toBeCloseTo(80000 / 360, 8);
  const high = calculateInvestment({ ...defaults, interestRate: '100', loanTerm: '100' })!;
  expect(high.monthlyPayment).toBeGreaterThan(6000);
  expect(Object.values(high).every(Number.isFinite)).toBe(true);
});
