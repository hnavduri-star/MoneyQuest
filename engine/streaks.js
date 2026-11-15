import { daysBetween } from './dates.js';

/**
 * Apply a daily login to a streak. Never punishing: a gap only restarts the count,
 * and freeze tokens automatically cover missed days.
 * @returns {{ streak, result: 'first'|'same'|'continued'|'frozen'|'restarted', usedFreezes, earnedFreeze }}
 */
export function applyLogin(streak, day, rules = {}) {
  const maxFreezes = rules.maxFreezes ?? 3;
  const freezeEvery = rules.freezeEvery ?? 7;
  const s = { count: 0, best: 0, lastDay: null, freezes: 0, ...streak };
  let result;
  let usedFreezes = 0;
  if (!s.lastDay) {
    s.count = 1;
    result = 'first';
  } else {
    const gap = daysBetween(s.lastDay, day);
    if (gap <= 0) return { streak: s, result: 'same', usedFreezes: 0, earnedFreeze: false };
    if (gap === 1) {
      s.count += 1;
      result = 'continued';
    } else if (gap - 1 <= s.freezes) {
      usedFreezes = gap - 1;
      s.freezes -= usedFreezes;
      s.count += 1;
      result = 'frozen';
    } else {
      s.count = 1;
      result = 'restarted';
    }
  }
  s.lastDay = day;
  s.best = Math.max(s.best, s.count);
  let earnedFreeze = false;
  if (s.count > 1 && s.count % freezeEvery === 0 && s.freezes < maxFreezes) {
    s.freezes += 1;
    earnedFreeze = true;
  }
  return { streak: s, result, usedFreezes, earnedFreeze };
}

/** Which day of the 7-day chest calendar a streak count maps to (0-6). */
export function chestDay(count) {
  return (Math.max(1, count) - 1) % 7;
}
