import { round2, assertNonNegative } from './money.js';

/** Weeks to reach a goal saving a fixed amount each week. */
export function weeksToGoal(goal, perWeek, alreadySaved = 0) {
  assertNonNegative({ goal, perWeek, alreadySaved });
  const left = goal - alreadySaved;
  if (left <= 0) return 0;
  if (perWeek === 0) return Infinity;
  return Math.ceil(round2(left / perWeek));
}

/** Week-by-week balances until the goal is reached (capped). */
export function savingsPlan(goal, perWeek, alreadySaved = 0, cap = 104) {
  const weeks = Math.min(weeksToGoal(goal, perWeek, alreadySaved), cap);
  const rows = [];
  for (let w = 0; w <= weeks; w++) rows.push({ week: w, saved: round2(Math.min(goal, alreadySaved + perWeek * w)) });
  return rows;
}

/** Split money into Save/Spend/Give jars by percent. Remainder pennies go to Save so the total always matches. */
export function jarSplit(amount, { save, spend, give }) {
  assertNonNegative({ amount, save, spend, give });
  const total = save + spend + give;
  if (Math.abs(total - 100) > 0.001) throw new RangeError('jar percentages must add up to 100');
  const s = round2(amount * (spend / 100));
  const g = round2(amount * (give / 100));
  return { save: round2(amount - s - g), spend: s, give: g };
}
