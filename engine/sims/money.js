/** Round to 2 decimal places, avoiding float drift (0.1 + 0.2 style issues). */
export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export function assertNonNegative(obj) {
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v !== 'number' || Number.isNaN(v) || v < 0) throw new RangeError(`${k} must be a non-negative number`);
  }
}
