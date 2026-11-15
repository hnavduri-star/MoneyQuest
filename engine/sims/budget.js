import { round2, assertNonNegative } from './money.js';

/** Family budget check: is everything paid for, and how much is saved? */
export function budgetSummary(income, allocations) {
  assertNonNegative({ income, ...allocations });
  const total = round2(Object.values(allocations).reduce((s, v) => s + v, 0));
  const left = round2(income - total);
  const saved = round2((allocations.savings || 0) + (allocations.emergency || 0));
  return { total, left, saved, savingsRate: income ? round2((saved / income) * 100) : 0, balanced: left >= 0 };
}

/** 50/30/20 rule: needs / wants / savings. */
export function fiftyThirtyTwenty(income) {
  assertNonNegative({ income });
  const needs = round2(income * 0.5);
  const wants = round2(income * 0.3);
  return { needs, wants, savings: round2(income - needs - wants) };
}

/** A surprise cost is paid from the emergency fund first, then savings; anything left is a shortfall. */
export function coverSurprise({ emergency = 0, savings = 0 }, cost) {
  assertNonNegative({ emergency, savings, cost });
  const fromEmergency = Math.min(emergency, cost);
  const fromSavings = Math.min(savings, cost - fromEmergency);
  const shortfall = round2(cost - fromEmergency - fromSavings);
  return { fromEmergency: round2(fromEmergency), fromSavings: round2(fromSavings), shortfall, covered: shortfall === 0, emergencyLeft: round2(emergency - fromEmergency), savingsLeft: round2(savings - fromSavings) };
}

/** Months an emergency fund lasts if income stopped. */
export const monthsCovered = (fund, monthlyNeeds) => (monthlyNeeds > 0 ? Math.floor(fund / monthlyNeeds) : Infinity);
