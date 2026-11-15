import { describe, it, expect } from 'vitest';
import { payslip, payYourselfFirst, zakat, hourlyToMonthly, annualToMonthly } from '../sims/salary.js';
import { budgetSummary, fiftyThirtyTwenty, coverSurprise, monthsCovered } from '../sims/budget.js';
import { withdraw, notesFor } from '../sims/atm.js';
import { convert, exchangeQuote, roundTrip, pctChange } from '../sims/fx.js';
import { demand, pnl, breakEvenUnits, bestPrice } from '../sims/business.js';

describe('salary engine', () => {
  it('payslip: gross, deductions, net', () => {
    expect(payslip({ basic: 8000, allowances: 2000, pensionPct: 5 })).toMatchObject({ gross: 10000, pension: 500, deductions: 500, net: 9500 });
    expect(payslip({ basic: 3000, taxPct: 20, otherDeductions: 100 })).toMatchObject({ tax: 600, net: 2300 });
  });
  it('conversions and pay-yourself-first', () => {
    expect(annualToMonthly(120000)).toBe(10000);
    expect(hourlyToMonthly(30, 40)).toBe(5200);
    expect(payYourselfFirst(10000, { savePct: 20, givePct: 2.5 })).toEqual({ save: 2000, give: 250, spend: 7750 });
  });
  it('zakat is 2.5% above the nisab only', () => {
    expect(zakat(4000)).toBe(100);
    expect(zakat(1000, 2000)).toBe(0);
  });
});

describe('budget engine', () => {
  it('summary and balance', () => {
    const b = budgetSummary(15000, { rent: 6000, food: 2500, bills: 1000, school: 2500, savings: 1500, fun: 1000 });
    expect(b).toMatchObject({ total: 14500, left: 500, saved: 1500, savingsRate: 10, balanced: true });
    expect(budgetSummary(1000, { rent: 1200 }).balanced).toBe(false);
  });
  it('50/30/20', () => expect(fiftyThirtyTwenty(10000)).toEqual({ needs: 5000, wants: 3000, savings: 2000 }));
  it('surprises use the emergency fund first', () => {
    expect(coverSurprise({ emergency: 1000, savings: 500 }, 1200)).toMatchObject({ fromEmergency: 1000, fromSavings: 200, covered: true });
    expect(coverSurprise({ emergency: 100 }, 300)).toMatchObject({ shortfall: 200, covered: false });
    expect(monthsCovered(30000, 10000)).toBe(3);
  });
});

describe('ATM engine', () => {
  it('approves and breaks into notes', () => {
    const r = withdraw({ balance: 2000, amount: 800 });
    expect(r).toMatchObject({ ok: true, balance: 1200, notes: { 500: 1, 200: 1, 100: 1 } });
    expect(r.steps).toEqual(['card', 'pin', 'network', 'bankCheck', 'approved', 'cash']);
  });
  it('declines politely', () => {
    expect(withdraw({ balance: 200, amount: 300 }).reason).toBe('insufficient');
    expect(withdraw({ balance: 2000, amount: 150 }).reason).toBe('notMultiple');
    expect(withdraw({ balance: 9000, amount: 600, dailyLimit: 1000, withdrawnToday: 500 }).reason).toBe('overLimit');
    expect(withdraw({ balance: 300, amount: 300, fee: 2 }).reason).toBe('insufficient');
  });
  it('notes', () => expect(notesFor(1700)).toEqual({ 1000: 1, 500: 1, 200: 1 }));
});

describe('currency engine', () => {
  it('converts with the dollar peg', () => {
    expect(convert(10, 'USD', 'AED')).toBe(36.73);
    expect(convert(367.25, 'AED', 'USD')).toBe(100);
  });
  it('exchange margin and round trips lose money', () => {
    expect(exchangeQuote(100, 'USD', 'AED', { marginPct: 2 })).toMatchObject({ fair: 367.25, received: 359.91 });
    expect(roundTrip(1000, 'AED', 'EUR').lost).toBeGreaterThan(0);
    expect(pctChange(4, 4.4)).toBe(10);
  });
});

describe('business engine', () => {
  it('demand falls as price rises', () => {
    expect(demand({ price: 5, base: 100, sensitivity: 8 })).toBe(60);
    expect(demand({ price: 20, base: 100, sensitivity: 8 })).toBe(0);
  });
  it('P&L and break-even', () => {
    expect(pnl({ price: 5, unitCost: 2, unitsSold: 40, fixedCosts: 50 })).toMatchObject({ revenue: 200, variableCosts: 80, grossProfit: 120, profit: 70, margin: 35 });
    expect(pnl({ price: 2, unitCost: 2, unitsSold: 10, fixedCosts: 30 }).profit).toBe(-30);
    expect(breakEvenUnits(5, 2, 60)).toBe(20);
    expect(breakEvenUnits(2, 3, 60)).toBe(Infinity);
  });
  it('best price beats extremes', () => {
    const b = bestPrice({ unitCost: 2, fixedCosts: 50, base: 100, sensitivity: 8 });
    expect(b.price).toBeGreaterThan(2);
    expect(b.price).toBeLessThan(12.5);
  });
});

import { cafePnl, cafeBreakEvenCustomers } from '../sims/business.js';
import { minimumPaymentPayoff, paymentToClearIn, payoffOrder, payoffMonths } from '../sims/loans.js';

describe('café / restaurant P&L engine', () => {
  it('builds a monthly P&L', () => {
    const r = cafePnl({ customersPerDay: 80, avgSpend: 25, daysOpen: 26, foodCostPct: 30, staff: 18000, rent: 12000, utilities: 3000 });
    expect(r).toMatchObject({ revenue: 52000, cogs: 15600, grossProfit: 36400, grossMargin: 70, expenses: 33000, netProfit: 3400 });
  });
  it('shows a loss and the break-even customers', () => {
    expect(cafePnl({ customersPerDay: 40, avgSpend: 25, foodCostPct: 30, staff: 18000, rent: 12000, utilities: 3000 }).netProfit).toBeLessThan(0);
    expect(cafeBreakEvenCustomers({ avgSpend: 25, foodCostPct: 30, staff: 18000, rent: 12000, utilities: 3000 })).toBe(73);
    expect(cafeBreakEvenCustomers({ avgSpend: 10, foodCostPct: 100, rent: 1 })).toBe(Infinity);
  });
});

describe('debt engine', () => {
  it('minimum payments take far longer and cost far more', () => {
    const min = minimumPaymentPayoff(1000, 36, { minPct: 3, minFloor: 25 });
    const fixed = payoffMonths(1000, 36, 100);
    expect(min.months).toBeGreaterThan(fixed.months * 3);
    expect(min.interestPaid).toBeGreaterThan(fixed.interestPaid * 3);
  });
  it('payment to clear in 12 months, and payoff order', () => {
    expect(paymentToClearIn(1200, 0, 12)).toBe(100);
    const debts = [{ id: 'card', balance: 900, ratePct: 36 }, { id: 'phone', balance: 200, ratePct: 10 }];
    expect(payoffOrder(debts, 'avalanche')[0].id).toBe('card');
    expect(payoffOrder(debts, 'snowball')[0].id).toBe('phone');
  });
});
