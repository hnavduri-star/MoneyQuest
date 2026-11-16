import { pickAge } from './text.js';

export function nodeProgress(state, worldId, nodeId) {
  return state.progress?.[worldId]?.[nodeId];
}

/** Nodes visible to this age tier. */
export function visibleNodes(world, age) {
  return world.nodes.filter((n) => !n.ages || n.ages.includes(age));
}

export function isWorldComplete(state, world, age) {
  return visibleNodes(world, age).filter((n) => n.required).every((n) => nodeProgress(state, world.id, n.id));
}

export function worldStars(state, world, age) {
  const nodes = visibleNodes(world, age);
  const got = nodes.reduce((s, n) => s + (nodeProgress(state, world.id, n.id)?.stars || 0), 0);
  return { got, max: nodes.length * 3 };
}

export function isWorldPerfect(state, world, age) {
  return visibleNodes(world, age).every((n) => (nodeProgress(state, world.id, n.id)?.stars || 0) >= 3);
}

/** A node is open when every earlier required node is done. Optional nodes never block. */
export function isNodeUnlocked(state, world, nodeId, age) {
  const nodes = visibleNodes(world, age);
  const idx = nodes.findIndex((n) => n.id === nodeId);
  if (idx < 0) return false;
  return nodes.slice(0, idx).filter((n) => n.required).every((n) => nodeProgress(state, world.id, n.id));
}

/** World availability: built, allowed for the age tier, and its prerequisite worlds are complete. */
export function worldStatus(state, meta, content, age) {
  if (!meta.playable) return 'coming-soon';
  if (meta.ages && !meta.ages.includes(age)) return 'age-locked';
  const world = content.worlds[meta.id];
  const started = world.nodes.some((n) => nodeProgress(state, meta.id, n.id));
  const req = (meta.requires || []).filter((id) => content.worlds[id]);
  const any = (meta.requiresAny || []).filter((id) => content.worlds[id]);
  // "requires": every listed world; "requiresAny": at least one of them (lets the journey branch).
  const reqDone = req.every((id) => isWorldComplete(state, content.worlds[id], age)) && (!any.length || any.some((id) => isWorldComplete(state, content.worlds[id], age)));
  // A world the child has already started never re-locks (e.g. if the journey order changes).
  if (!reqDone && !started) return 'locked';
  return isWorldComplete(state, world, age) ? 'complete' : 'open';
}

/**
 * Steps of a node visible to this age tier (and city region), with age-tiered values resolved.
 * City numbers fill answers written as "{fxTen}" so one lesson works in every currency.
 */
export function stepsForAge(node, age, ctx) {
  return (node.steps || [])
    .filter((s) => !s.ages || s.ages.includes(age))
    .filter((s) => !ctx || ((!s.regions || s.regions.includes(ctx.region)) && (!s.notRegions || !s.notRegions.includes(ctx.region))))
    .map((s) => resolveNums(resolveAgeDeep(s, age), ctx));
}

const MONEY = /\[\[(-?[\d.]+)\]\]/g;
const r2 = (n) => Math.round(n * 100) / 100;

/** The price factor for one step: "big" amounts (salaries, rent: anything ≥ 1000) use the city's big factor. */
export function stepPriceScale(step, prices) {
  if (!prices) return 1;
  const json = JSON.stringify(step);
  const amounts = [...json.matchAll(MONEY)].map((m) => Number(m[1]));
  if (step.money && typeof step.answer === 'number') amounts.push(step.answer);
  // Simulations: a money parameter of 1000+ (an income, a rent) marks the whole sim as "big".
  if (step.type === 'sim') for (const v of Object.values(step.params || {})) if (typeof v === 'number') amounts.push(v);
  return amounts.some((a) => Math.abs(a) >= 1000) ? prices.big : prices.small;
}

function scaleDeep(v, k) {
  if (typeof v === 'string') return v.replace(MONEY, (_, n) => `[[${r2(Number(n) * k)}]]`);
  if (Array.isArray(v)) return v.map((x) => scaleDeep(x, k));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([key, x]) => [key, scaleDeep(x, k)]));
  return v;
}

const AR = '٠١٢٣٤٥٦٧٨٩';
const toWestern = (str) => str.replace(/[٠-٩]/g, (d) => String(AR.indexOf(d))).replace(/٫/g, '.');
const toArabic = (str) => str.replace(/\d/g, (d) => AR[d]).replace(/\./g, '٫');
/** Scale standalone numbers (Western or Arabic digits) that equal one of the step's amounts; leave counts and percentages. */
export function scalePlainNumbers(v, amounts, k) {
  if (typeof v === 'string') {
    return v.replace(/(?<![\d.٫[])([\d٠-٩]+(?:[.٫][\d٠-٩]+)?)(?![\d٠-٩]|\s*[%٪]|\]\])/g, (raw) => {
      const arabic = /[٠-٩]/.test(raw);
      const n = Number(toWestern(raw));
      if (!amounts.has(n)) return raw;
      const scaled = String(r2(n * k));
      return arabic ? toArabic(scaled) : scaled;
    });
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) return Object.fromEntries(Object.entries(v).map(([key, x]) => [key, scalePlainNumbers(x, amounts, k)]));
  return v;
}

function resolveNums(step, ctx) {
  const fix = (v) => (typeof v === 'string' ? Number(v.replace(/\{(\w+)\}/g, (_, k) => ctx?.nums?.[k] ?? NaN)) : v);
  let out = step;
  if (typeof step.answer === 'string' || typeof step.tolerance === 'string') out = { ...step, answer: fix(step.answer), tolerance: fix(step.tolerance) };
  // Realistic local prices: every [[amount]] in the step and any money answer use the same factor,
  // so the arithmetic in the question still works (e.g. salaries ×0.25 in pounds, ×5 in rupees).
  const k = stepPriceScale(out, ctx?.prices);
  if (k === 1) return { ...out, priceScale: 1 };
  // Worked explanations and hints ("15 × 4 = 60") use plain numbers: scale the ones that are amounts
  // from this step (or its answer) so the explanation matches the prices the child sees.
  const amounts = new Set([...JSON.stringify(out).matchAll(MONEY)].map((m) => Number(m[1])));
  if (out.money && typeof out.answer === 'number') amounts.add(out.answer);
  // Intermediate steps like "10% of 50 is 5, so 50 − 5 = 45": a difference between two amounts is an amount too.
  for (const a of [...amounts]) for (const b of [...amounts]) if (a > b) amounts.add(r2(a - b));
  out = scaleDeep(out, k);
  for (const field of ['explain', 'hint']) if (out[field]) out = { ...out, [field]: scalePlainNumbers(out[field], amounts, k) };
  if (out.money && typeof out.answer === 'number') out = { ...out, answer: r2(out.answer * k), tolerance: (out.tolerance || 0) * k };
  if (out.type === 'estimate' && out.money) out = { ...out, min: r2(out.min * k), max: r2(out.max * k), step: r2((out.step || 1) * k) };
  return { ...out, priceScale: k };
}

/** Mini-games marked "cityItems" sort the chosen city's own places vs places abroad. */
export function minigameConfig(node, ctx) {
  const cfg = node.config;
  if (!cfg.cityItems || !ctx?.places) return cfg;
  const items = [...ctx.places.home.map((p) => ({ ...p, bin: 'home' })), ...ctx.places.abroad.map((p) => ({ ...p, bin: 'abroad' }))];
  return { ...cfg, items };
}

const LOCALISED_KEYS = new Set(['en', 'ar']);
function resolveAgeDeep(v, age) {
  v = pickAge(v, age);
  if (Array.isArray(v)) return v.map((x) => resolveAgeDeep(x, age));
  if (v && typeof v === 'object') {
    if (Object.keys(v).every((k) => LOCALISED_KEYS.has(k))) return v;
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolveAgeDeep(x, age)]));
  }
  return v;
}
