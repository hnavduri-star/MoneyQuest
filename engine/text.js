/** Localised, age-aware text helpers. Content strings may be:
 *  - a plain string
 *  - { en, ar, ... } keyed by language
 *  - { "7-9": ..., "10-12": ..., "13-15": ..., default: ... } keyed by age tier (values recurse)
 */
export const AGE_TIERS = ['7-9', '10-12', '13-15'];
export const LANGS = ['en', 'ar'];

const hasAgeKey = (v) => AGE_TIERS.some((a) => a in v) || 'default' in v;

/** Resolve an age-tiered value (works for numbers, arrays, objects). */
export function pickAge(v, age) {
  if (v && typeof v === 'object' && !Array.isArray(v) && hasAgeKey(v)) {
    const hit = v[age] !== undefined ? v[age] : v.default !== undefined ? v.default : v[AGE_TIERS.find((a) => v[a] !== undefined)];
    return pickAge(hit, age);
  }
  return v;
}

export function tr(v, lang = 'en', age) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map((x) => tr(x, lang, age)).join(' ');
  if (hasAgeKey(v)) return tr(pickAge(v, age), lang, age);
  if (v[lang] !== undefined) return tr(v[lang], lang, age);
  if (v.en !== undefined) return tr(v.en, lang, age);
  return '';
}

/** Replace {name} with vars and [[123]] with formatted money. */
export function fill(str, vars = {}, money = (n) => String(n)) {
  return String(str)
    .replace(/\[\[(-?[\d.]+)\]\]/g, (_, n) => money(Number(n)))
    .replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}
