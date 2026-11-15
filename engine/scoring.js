/** Stars from mistakes: 0 -> 3, <= threshold -> 2, else 1. Finishing always earns at least 1 star. */
export function starsFromMistakes(mistakes, total, { twoStarMax } = {}) {
  const allowed = twoStarMax ?? Math.max(1, Math.round(total * 0.34));
  if (mistakes <= 0) return 3;
  if (mistakes <= allowed) return 2;
  return 1;
}
/** Stars from score thresholds [one, two, three]. */
export function starsFromScore(score, thresholds = [1, 50, 100]) {
  if (score >= thresholds[2]) return 3;
  if (score >= thresholds[1]) return 2;
  return 1;
}
/** Combo multiplier for timed games: 1x, then +0.5x every 3 in a row, capped. */
export function comboMultiplier(combo, cap = 3) {
  return Math.min(cap, 1 + Math.floor(combo / 3) * 0.5);
}
