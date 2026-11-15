import { round2, assertNonNegative } from './money.js';

/**
 * Example rates: dirhams (AED) for 1 unit of each currency. The dirham is pegged to the US dollar at 3.6725;
 * the others are illustrative and move every day in real life.
 */
export const EXAMPLE_RATES = { AED: 1, USD: 3.6725, EUR: 4.0, GBP: 4.7, SAR: 0.98, INR: 0.044, PKR: 0.013, PHP: 0.065, EGP: 0.075 };

export function convert(amount, from, to, rates = EXAMPLE_RATES) {
  assertNonNegative({ amount });
  if (!rates[from] || !rates[to]) throw new RangeError('unknown currency');
  return round2((amount * rates[from]) / rates[to]);
}

/** An exchange house buys at a lower rate and sells at a higher one; the gap (margin) is how it earns. */
export function exchangeQuote(amount, from, to, { rates = EXAMPLE_RATES, marginPct = 2 } = {}) {
  const fair = convert(amount, from, to, rates);
  const received = round2(fair * (1 - marginPct / 100));
  return { fair, received, cost: round2(fair - received) };
}

/** Change money and straight back again: you lose the margin twice. */
export function roundTrip(amount, from, to, opts) {
  const there = exchangeQuote(amount, from, to, opts).received;
  const back = exchangeQuote(there, to, from, opts).received;
  return { back, lost: round2(amount - back) };
}

/** Percent change in a rate, e.g. how much stronger/weaker a currency got. */
export const pctChange = (oldRate, newRate) => round2(((newRate - oldRate) / oldRate) * 100);
