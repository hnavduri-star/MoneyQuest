export const MAX_LEVEL = 50;
const DEFAULT_CURVE = { base: 25, exponent: 1.1 };

/** XP needed to go from level l to l+1. */
export function xpForNext(level, curve = DEFAULT_CURVE) {
  return Math.round(curve.base * Math.pow(level, curve.exponent));
}
/** Total XP required to reach `level` (level 1 = 0). */
export function xpToReach(level, curve = DEFAULT_CURVE) {
  let total = 0;
  for (let l = 1; l < Math.min(level, MAX_LEVEL); l++) total += xpForNext(l, curve);
  return total;
}
export function levelForXp(xp, curve = DEFAULT_CURVE) {
  let level = 1;
  let need = 0;
  while (level < MAX_LEVEL) {
    need += xpForNext(level, curve);
    if (xp < need) break;
    level++;
  }
  return level;
}
export function levelProgress(xp, curve = DEFAULT_CURVE) {
  const level = levelForXp(xp, curve);
  if (level >= MAX_LEVEL) return { level, into: 0, needed: 0, pct: 1 };
  const start = xpToReach(level, curve);
  const needed = xpForNext(level, curve);
  const into = xp - start;
  return { level, into, needed, pct: into / needed };
}
export function rankForLevel(level, ranks) {
  return ranks.find((r) => level >= r.from && level <= r.to) || ranks[ranks.length - 1];
}
/** Avatar/companion evolution stage 1-5 from level. */
export function evolutionStage(level) {
  if (level >= 43) return 5;
  if (level >= 34) return 4;
  if (level >= 18) return 3;
  if (level >= 10) return 2;
  return 1;
}
