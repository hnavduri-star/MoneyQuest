import { describe, it, expect } from 'vitest';
import { simpleInterest, compound, growthSeries, yearsToDouble } from '../sims/interest.js';
import { monthlyPayment, amortize, loanSummary, payoffMonths } from '../sims/loans.js';
import { bankSpread, profitSharing, compareInterestVsProfitShare } from '../sims/bank.js';
import { weeksToGoal, savingsPlan, jarSplit } from '../sims/savings.js';

describe('interest engine', () => {
  it('simple interest', () => {
    expect(simpleInterest(200, 5, 1)).toBe(10);
    expect(simpleInterest(1000, 3.5, 2)).toBe(70);
  });
  it('compound interest matches the lesson answers', () => {
    expect(compound(1000, 10, 2)).toBe(1210);
    expect(compound(100, 10, 2)).toBe(121);
    expect(compound(100, 0, 10)).toBe(100);
  });
  it('compound with monthly periods and contributions', () => {
    expect(compound(1000, 12, 1, { periodsPerYear: 12 })).toBeCloseTo(1126.83, 2);
    expect(compound(0, 0, 1, { periodsPerYear: 12, contribution: 10 })).toBe(120);
  });
  it('growth series: compound always >= simple', () => {
    const rows = growthSeries(100, 6, 20);
    expect(rows).toHaveLength(21);
    expect(rows[20].compound).toBeCloseTo(320.71, 1);
    expect(rows[20].simple).toBe(220);
    rows.forEach((r) => expect(r.compound).toBeGreaterThanOrEqual(r.simple));
  });
  it('rule of 72', () => {
    expect(yearsToDouble(8).ruleOf72).toBe(9);
    expect(yearsToDouble(8).exact).toBeCloseTo(9.01, 1);
    expect(yearsToDouble(0).exact).toBe(Infinity);
  });
  it('rejects negative inputs', () => {
    expect(() => simpleInterest(-1, 5, 1)).toThrow(RangeError);
  });
});

describe('loan engine', () => {
  it('monthly payment', () => {
    expect(monthlyPayment(1200, 0, 12)).toBe(100);
    expect(monthlyPayment(1200, 12, 12)).toBeCloseTo(106.62, 2);
  });
  it('amortization ends at exactly zero and sums correctly', () => {
    const rows = amortize(5000, 9.5, 36);
    expect(rows).toHaveLength(36);
    expect(rows.at(-1).balance).toBe(0);
    const principalPaid = rows.reduce((s, r) => s + r.principal, 0);
    expect(principalPaid).toBeCloseTo(5000, 1);
  });
  it('longer loans cost more interest', () => {
    expect(loanSummary(1200, 12, 24).totalInterest).toBeGreaterThan(loanSummary(1200, 12, 12).totalInterest);
  });
  it('payoff months, and a payment too small never pays off', () => {
    expect(payoffMonths(1000, 0, 100).months).toBe(10);
    expect(payoffMonths(1000, 24, 15).months).toBe(Infinity);
  });
});

describe('bank engine', () => {
  it('spread profit', () => {
    const r = bankSpread({ deposits: 1000, depositRatePct: 2, loanRatePct: 8, reservePct: 10 });
    expect(r).toMatchObject({ lent: 900, reserve: 100, paidToSavers: 20, earnedFromBorrowers: 72, profit: 52, spreadPct: 6 });
  });
  it('profit sharing splits profit and passes losses to capital', () => {
    expect(profitSharing({ capital: 1000, result: 200, investorSharePct: 60 })).toMatchObject({ investor: 120, manager: 80, loss: false });
    expect(profitSharing({ capital: 1000, result: -100, investorSharePct: 60 })).toMatchObject({ investor: -100, manager: 0, investorTotal: 900, loss: true });
  });
  it('compare interest vs profit share', () => {
    expect(compareInterestVsProfitShare({ amount: 1000, interestPct: 5, businessReturnPct: 10, investorSharePct: 60 })).toEqual({ interest: 50, profitShare: 60 });
  });
});

describe('savings engine', () => {
  it('weeks to goal', () => {
    expect(weeksToGoal(90, 12, 30)).toBe(5);
    expect(weeksToGoal(20, 5)).toBe(4);
    expect(weeksToGoal(10, 5, 50)).toBe(0);
    expect(weeksToGoal(10, 0)).toBe(Infinity);
  });
  it('savings plan reaches the goal', () => {
    const p = savingsPlan(30, 5);
    expect(p.at(-1)).toEqual({ week: 6, saved: 30 });
  });
  it('jar split always sums to the amount', () => {
    const j = jarSplit(10.01, { save: 50, spend: 40, give: 10 });
    expect(j.save + j.spend + j.give).toBeCloseTo(10.01, 5);
    expect(() => jarSplit(10, { save: 50, spend: 40, give: 20 })).toThrow();
  });
});
