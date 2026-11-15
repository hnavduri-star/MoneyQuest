import { round2, assertNonNegative } from './money.js';

/** Fixed monthly payment for an amortising loan. */
export function monthlyPayment(principal, annualRatePct, months) {
  assertNonNegative({ principal, annualRatePct });
  if (!(months > 0)) throw new RangeError('months must be > 0');
  const r = annualRatePct / 100 / 12;
  if (r === 0) return round2(principal / months);
  return round2((principal * r) / (1 - Math.pow(1 + r, -months)));
}

/** Month-by-month schedule. The last payment absorbs rounding so the balance ends at exactly 0. */
export function amortize(principal, annualRatePct, months) {
  const payment = monthlyPayment(principal, annualRatePct, months);
  const r = annualRatePct / 100 / 12;
  const rows = [];
  let balance = principal;
  for (let m = 1; m <= months; m++) {
    const interest = round2(balance * r);
    let pay = payment;
    if (m === months || pay > balance + interest) pay = round2(balance + interest);
    const toPrincipal = round2(pay - interest);
    balance = round2(balance - toPrincipal);
    rows.push({ month: m, payment: pay, interest, principal: toPrincipal, balance });
  }
  return rows;
}

export function loanSummary(principal, annualRatePct, months) {
  const rows = amortize(principal, annualRatePct, months);
  const totalPaid = round2(rows.reduce((s, r) => s + r.payment, 0));
  return { monthly: rows[0].payment, totalPaid, totalInterest: round2(totalPaid - principal), months };
}

/** How many months to pay off a balance with a fixed payment. Infinity if the payment never beats the interest. */
export function payoffMonths(principal, annualRatePct, payment, maxMonths = 1200) {
  assertNonNegative({ principal, annualRatePct, payment });
  const r = annualRatePct / 100 / 12;
  let bal = principal;
  let months = 0;
  let interestPaid = 0;
  while (bal > 0.005) {
    const interest = round2(bal * r);
    if (payment <= interest) return { months: Infinity, interestPaid: Infinity };
    interestPaid += interest;
    bal = round2(bal + interest - payment);
    months++;
    if (months > maxMonths) return { months: Infinity, interestPaid: Infinity };
  }
  return { months, interestPaid: round2(interestPaid) };
}

/**
 * Paying only the minimum on a card: each month pay minPct of the balance (at least minFloor).
 * Shows how long it takes and how much interest piles up.
 */
export function minimumPaymentPayoff(balance, annualRatePct, { minPct = 3, minFloor = 25, maxMonths = 600 } = {}) {
  assertNonNegative({ balance, annualRatePct, minPct, minFloor });
  const r = annualRatePct / 100 / 12;
  let bal = balance;
  let months = 0;
  let interestPaid = 0;
  while (bal > 0.005 && months < maxMonths) {
    const interest = round2(bal * r);
    const pay = Math.min(round2(bal + interest), Math.max(minFloor, round2((bal * minPct) / 100)));
    interestPaid += interest;
    bal = round2(bal + interest - pay);
    months++;
  }
  return { months: bal > 0.005 ? Infinity : months, interestPaid: round2(interestPaid) };
}

/** Monthly payment needed to clear a debt in a target number of months. */
export const paymentToClearIn = (balance, annualRatePct, months) => monthlyPayment(balance, annualRatePct, months);

/** Order debts for the avalanche (highest rate first) or snowball (smallest balance first) method. */
export function payoffOrder(debts, method = 'avalanche') {
  const list = [...debts];
  return method === 'snowball' ? list.sort((a, b) => a.balance - b.balance) : list.sort((a, b) => b.ratePct - a.ratePct);
}
