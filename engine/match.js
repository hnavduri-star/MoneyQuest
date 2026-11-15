/** Data-driven event matching used by reward rules and quests.
 *  when: { field: value | [values] | { gte, lte } } — every listed field must match. */
export function matches(ev, when) {
  if (!when) return true;
  return Object.entries(when).every(([k, want]) => {
    const got = ev[k];
    if (Array.isArray(want)) return want.includes(got);
    if (want && typeof want === 'object') {
      if (want.gte !== undefined && !(got >= want.gte)) return false;
      if (want.lte !== undefined && !(got <= want.lte)) return false;
      return true;
    }
    return got === want;
  });
}

/** Amount = number, or { base, per: { field: multiplier } }. */
export function amount(spec, ev) {
  if (spec == null) return 0;
  if (typeof spec === 'number') return spec;
  let total = spec.base || 0;
  for (const [field, mult] of Object.entries(spec.per || {})) total += (Number(ev[field]) || 0) * mult;
  return Math.max(0, Math.round(total));
}
