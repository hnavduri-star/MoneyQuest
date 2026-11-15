import { round2, assertNonNegative } from './money.js';

/**
 * How a bank earns "the spread": it pays savers depositRate and charges borrowers loanRate.
 * Only the lent-out share of deposits earns loan interest (the rest is kept as a reserve).
 */
export function bankSpread({ deposits, depositRatePct, loanRatePct, reservePct = 10, costs = 0 }) {
  assertNonNegative({ deposits, depositRatePct, loanRatePct, reservePct, costs });
  const lent = round2(deposits * (1 - reservePct / 100));
  const paidToSavers = round2(deposits * (depositRatePct / 100));
  const earnedFromBorrowers = round2(lent * (loanRatePct / 100));
  const profit = round2(earnedFromBorrowers - paidToSavers - costs);
  return { lent, reserve: round2(deposits - lent), paidToSavers, earnedFromBorrowers, profit, spreadPct: round2(loanRatePct - depositRatePct) };
}

/**
 * Islamic profit-sharing (mudarabah): the investor provides capital, the manager provides work.
 * Profit is split by an agreed ratio; a loss is borne by the capital provider (the manager loses their effort).
 */
export function profitSharing({ capital, result, investorSharePct }) {
  assertNonNegative({ capital, investorSharePct });
  if (investorSharePct > 100) throw new RangeError('investorSharePct must be <= 100');
  if (result >= 0) {
    const investor = round2(result * (investorSharePct / 100));
    return { investor, manager: round2(result - investor), investorTotal: round2(capital + investor), loss: false };
  }
  return { investor: round2(result), manager: 0, investorTotal: round2(capital + result), loss: true };
}

/** Compare a fixed-interest deposit with a profit-share deposit over the same outcome. */
export function compareInterestVsProfitShare({ amount, interestPct, businessReturnPct, investorSharePct }) {
  const interest = round2(amount * (interestPct / 100));
  const share = profitSharing({ capital: amount, result: round2(amount * (businessReturnPct / 100)), investorSharePct });
  return { interest, profitShare: share.investor };
}
