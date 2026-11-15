import { round2, assertNonNegative } from './money.js';

/** Simple interest earned: P * r * t. */
export function simpleInterest(principal, ratePct, years) {
  assertNonNegative({ principal, ratePct, years });
  return round2(principal * (ratePct / 100) * years);
}

/**
 * Compound growth with optional regular contribution added at the end of each period.
 * @returns final balance
 */
export function compound(principal, ratePct, years, { periodsPerYear = 1, contribution = 0 } = {}) {
  assertNonNegative({ principal, ratePct, years, periodsPerYear, contribution });
  const r = ratePct / 100 / periodsPerYear;
  let bal = principal;
  const n = Math.round(years * periodsPerYear);
  for (let i = 0; i < n; i++) bal = bal * (1 + r) + contribution;
  return round2(bal);
}

/** Year-by-year balances for charts. Returns [{ year, simple, compound, deposited }]. */
export function growthSeries(principal, ratePct, years, { contributionPerYear = 0 } = {}) {
  assertNonNegative({ principal, ratePct, years, contributionPerYear });
  const rows = [];
  let comp = principal;
  let deposited = principal;
  let simpleBal = principal;
  rows.push({ year: 0, simple: round2(principal), compound: round2(principal), deposited: round2(principal) });
  for (let y = 1; y <= years; y++) {
    simpleBal += deposited * (ratePct / 100);
    comp = comp * (1 + ratePct / 100) + contributionPerYear;
    simpleBal += contributionPerYear;
    deposited += contributionPerYear;
    rows.push({ year: y, simple: round2(simpleBal), compound: round2(comp), deposited: round2(deposited) });
  }
  return rows;
}

/** Exact years to double at a yearly compound rate, and the Rule of 72 estimate. */
export function yearsToDouble(ratePct) {
  if (ratePct <= 0) return { exact: Infinity, ruleOf72: Infinity };
  return {
    exact: round2(Math.log(2) / Math.log(1 + ratePct / 100)),
    ruleOf72: round2(72 / ratePct),
  };
}
