export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
export const r2 = (n) => Math.round(n * 100) / 100;
/** Notes and coins a child of this age should handle (younger: whole amounts and smaller notes). */
export function denominations(city, age) {
  const young = age === '7-9';
  const notes = city.cash.notes.filter((n) => (young ? n <= 50 : n <= 500));
  const coins = city.cash.coins.filter((c) => (young ? Number.isInteger(c) : c >= 0.05 || city.cash.coins.length <= 4));
  return { notes, coins, unit: Math.min(...(coins.length ? coins : notes)) };
}
