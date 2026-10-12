import { describe, it, expect } from 'vitest';
import {
  calculateLoanPayment,
  calculateAprInterestSavings,
} from '../components/screens/DealBuilder';

describe('Deal Builder Quote & Amortization Engine', () => {
  it('calculates zero interest principal division correctly', () => {
    const monthly = calculateLoanPayment(36000, 0, 36);
    expect(monthly).toBe(1000);
  });

  it('calculates monthly payments with standard APR compounding', () => {
    // $52,000 at 6.50% for 36 months
    const monthly = calculateLoanPayment(52000, 6.5, 36);
    // Formula check: ~1592.83
    expect(monthly).toBeGreaterThan(1590);
    expect(monthly).toBeLessThan(1595);
  });

  it('calculates promotional 1.9% subvention monthly payments', () => {
    // $52,000 at 1.90% for 36 months
    const monthly = calculateLoanPayment(52000, 1.9, 36);
    // Formula check: ~1487.05
    expect(monthly).toBeGreaterThan(1485);
    expect(monthly).toBeLessThan(1490);
  });

  it('accurately computes lifetime interest savings between standard and promo APR', () => {
    // Over 36 months on $54,000
    const savings = calculateAprInterestSavings(54000, 1.9, 6.5, 36);
    // Total std: ~57,381. Total promo: ~53,534. Delta: ~$3,847
    expect(savings).toBeGreaterThan(3700);
    expect(savings).toBeLessThan(4000);
  });

  it('demonstrates that higher loan term amplifies APR interest savings', () => {
    const savings36 = calculateAprInterestSavings(50000, 1.9, 6.5, 36);
    const savings60 = calculateAprInterestSavings(50000, 1.9, 6.5, 60);

    expect(savings60).toBeGreaterThan(savings36);
  });

  it('determines winning lane correctly based on vehicle valuation and terms', () => {
    // Scenario 1: High MSRP ($65,000) over 48 months -> APR subvention should decisively beat $2,500 cash
    const cashSavings = 2000 + 500; // $2,500
    const aprSavingsHighMsrp = calculateAprInterestSavings(65000, 1.9, 6.5, 48);

    expect(aprSavingsHighMsrp).toBeGreaterThan(cashSavings);

    // Scenario 2: Lower MSRP ($25,000) over 24 months with generous rebate ($3,000) -> Cash rebate should beat APR
    const highRebate = 3000;
    const aprSavingsLowMsrp = calculateAprInterestSavings(25000, 1.9, 6.5, 24);

    expect(highRebate).toBeGreaterThan(aprSavingsLowMsrp);
  });
});
