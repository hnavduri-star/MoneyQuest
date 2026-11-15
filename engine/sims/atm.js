import { round2, assertNonNegative } from './money.js';

/** UAE ATMs usually dispense AED 100, 200, 500 and 1000 notes. */
export const ATM_NOTES = [1000, 500, 200, 100];

/** Break an amount into the fewest notes (greedy works for these denominations). */
export function notesFor(amount, notes = ATM_NOTES) {
  const out = {};
  let left = amount;
  for (const n of [...notes].sort((a, b) => b - a)) {
    const k = Math.floor(left / n);
    if (k) out[n] = k;
    left -= k * n;
  }
  return left === 0 ? out : null;
}

/**
 * Simulate a withdrawal: the ATM asks your bank (through the ATM network) whether you have enough money
 * and haven't passed your daily limit. If approved, your balance goes down by the amount (+ any fee).
 */
export function withdraw({ balance, amount, dailyLimit = 5000, withdrawnToday = 0, fee = 0, notes = ATM_NOTES }) {
  assertNonNegative({ balance, amount, dailyLimit, withdrawnToday, fee });
  const smallest = Math.min(...notes);
  const steps = ['card', 'pin', 'network', 'bankCheck'];
  if (amount <= 0 || amount % smallest !== 0) return { ok: false, reason: 'notMultiple', balance, steps };
  if (amount + withdrawnToday > dailyLimit) return { ok: false, reason: 'overLimit', balance, steps };
  if (amount + fee > balance) return { ok: false, reason: 'insufficient', balance, steps };
  return { ok: true, balance: round2(balance - amount - fee), notes: notesFor(amount, notes), steps: [...steps, 'approved', 'cash'] };
}
