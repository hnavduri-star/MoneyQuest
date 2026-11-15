import { round2, assertNonNegative } from './money.js';

/**
 * A simple payslip. Gross = basic + allowances. Deductions are percentages of gross plus fixed amounts.
 * (In the UAE there is no personal income tax; pension contributions apply to UAE nationals. Other countries deduct tax.)
 */
export function payslip({ basic, allowances = 0, pensionPct = 0, taxPct = 0, otherDeductions = 0 }) {
  assertNonNegative({ basic, allowances, pensionPct, taxPct, otherDeductions });
  const gross = round2(basic + allowances);
  const pension = round2((gross * pensionPct) / 100);
  const tax = round2((gross * taxPct) / 100);
  const deductions = round2(pension + tax + otherDeductions);
  return { gross, pension, tax, other: round2(otherDeductions), deductions, net: round2(gross - deductions) };
}

export const annualToMonthly = (annual) => round2(annual / 12);
export const hourlyToMonthly = (rate, hoursPerWeek, weeksPerYear = 52) => round2((rate * hoursPerWeek * weeksPerYear) / 12);

/** "Pay yourself first": split a net salary into save / give / spend by percentages. */
export function payYourselfFirst(net, { savePct = 20, givePct = 2.5 } = {}) {
  assertNonNegative({ net, savePct, givePct });
  const save = round2((net * savePct) / 100);
  const give = round2((net * givePct) / 100);
  return { save, give, spend: round2(net - save - give) };
}

/** Zakat: 2.5% of savings held for a lunar year, if they are at or above the nisab threshold. */
export function zakat(savings, nisab = 0) {
  assertNonNegative({ savings, nisab });
  return savings >= nisab ? round2(savings * 0.025) : 0;
}
