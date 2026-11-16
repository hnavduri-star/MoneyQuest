import { round2, assertNonNegative } from './money.js';

/**
 * A made-up but realistic run of yearly share-market returns (%), averaging about 7% a year,
 * with some bad years. Fixed (not random) so every child sees the same story and lessons can refer to it.
 */
export const MARKET_YEARS = [12, -8, 15, 6, -18, 20, 9, 11, -4, 14, 7, 10, -12, 17, 8];

/** Share price after buyers and sellers meet: more buyers than sellers pushes it up, more sellers pushes it down. */
export function sharePrice(start, buyers, sellers) {
  assertNonNegative({ start, buyers, sellers });
  if (!buyers || !sellers) return round2(start);
  return round2(start * Math.sqrt(buyers / sellers));
}

/** Value of `shares` of a company at `price` each, and the profit or loss against what you paid. */
export function shareValue(shares, price, paidEach) {
  assertNonNegative({ shares, price, paidEach });
  const value = round2(shares * price);
  return { value, gain: round2(value - shares * paidEach) };
}

/**
 * Split `total` between a savings account (steady rate) and shares (the MARKET_YEARS ride).
 * @returns year-by-year rows [{ year, savings, shares, total, allSavings, sharesReturn }]
 */
export function savingsVsShares(total, inShares, years, { savingsRate = 3, returns = MARKET_YEARS } = {}) {
  assertNonNegative({ total, inShares, years, savingsRate });
  if (inShares > total) throw new RangeError('inShares cannot be more than total');
  let sav = total - inShares;
  let sh = inShares;
  let all = total;
  const rows = [{ year: 0, savings: round2(sav), shares: round2(sh), total: round2(total), allSavings: round2(total), sharesReturn: 0 }];
  for (let y = 1; y <= years; y++) {
    const r = returns[(y - 1) % returns.length];
    sav *= 1 + savingsRate / 100;
    all *= 1 + savingsRate / 100;
    sh *= 1 + r / 100;
    rows.push({ year: y, savings: round2(sav), shares: round2(sh), total: round2(sav + sh), allSavings: round2(all), sharesReturn: r });
  }
  return rows;
}

/** The worst single year for shares within the first `years` years. */
export function worstYear(years, returns = MARKET_YEARS) {
  let worst = { year: 0, pct: 0 };
  for (let y = 1; y <= years; y++) if (returns[(y - 1) % returns.length] < worst.pct) worst = { year: y, pct: returns[(y - 1) % returns.length] };
  return worst;
}
