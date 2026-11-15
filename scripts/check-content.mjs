#!/usr/bin/env node
// Validates every content file. Run: npm run content:check
import { loadContent } from '../engine/load-node.js';
import { validateContent } from '../engine/validate.js';
import { SIM_IDS, GAME_IDS, STEP_ART } from '../engine/registry.js';
import { contentVars } from '../engine/city.js';

let content;
try {
  content = loadContent();
} catch (e) {
  console.error('✗ Could not load content:', e.message);
  process.exit(1);
}
const errors = validateContent(content, { sims: SIM_IDS, games: GAME_IDS });
// UI strings: every key in en.json must exist in every other language.
const { en, ...others } = content.i18n;
for (const [lang, dict] of Object.entries(others))
  for (const k of Object.keys(en)) if (!(k in dict)) errors.push(`i18n/${lang}.json: missing key "${k}"`);
for (const w of Object.values(content.worlds))
  for (const n of w.nodes) for (const s of n.steps || []) if (s.art && !STEP_ART.includes(s.art)) errors.push(`world ${w.id} / ${n.id}: unknown art "${s.art}"`);

// Cities and editions: every {placeholder} used in lessons must be filled by every city and edition.
const tokens = new Set();
const collect = (v) => {
  if (typeof v === 'string') for (const m of v.matchAll(/\{(\w+)\}/g)) tokens.add(m[1]);
  else if (Array.isArray(v)) v.forEach(collect);
  else if (v && typeof v === 'object') Object.values(v).forEach(collect);
};
Object.values(content.worlds).forEach(collect);
content.worldIndex.forEach((w) => collect(w.name));
const numKeys = new Set(Object.keys(content.cities.cities[0]?.nums || {}));
const playable = content.worldIndex.filter((w) => w.playable).map((w) => w.id);
for (const city of content.cities.cities) {
  for (const w of playable) if (!city.stops?.[w]) errors.push(`cities.json ${city.id}: no journey stop for world "${w}"`);
  for (const k of numKeys) if (city.nums?.[k] === undefined) errors.push(`cities.json ${city.id}: missing number "${k}"`);
  for (const ed of content.editions.editions) {
    for (const lang of Object.keys(content.i18n)) {
      const vars = contentVars(content, { cityId: city.id, editionId: ed.id, lang, worldId: playable[0] });
      for (const t of tokens) if (!(t in vars) && !numKeys.has(t)) errors.push(`placeholder {${t}} is used in lessons but city "${city.id}" / edition "${ed.id}" (${lang}) has no value for it`);
    }
  }
}
for (const ed of content.editions.editions) {
  if (!content.editions.banks[ed.bank]) errors.push(`editions.json ${ed.id}: unknown bank "${ed.bank}"`);
  if (ed.school && !content.editions.schools[ed.school]) errors.push(`editions.json ${ed.id}: unknown school "${ed.school}"`);
  for (const c of ed.cities || []) if (!content.cityMap[c]) errors.push(`editions.json ${ed.id}: unknown city "${c}"`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} content problem(s):\n  - ` + errors.join('\n  - '));
  process.exit(1);
}
console.log(`✓ Content OK: ${playable.length} playable worlds, ${content.cities.cities.length} cities, ${content.editions.editions.length} editions, ${content.badges.length} badges, ${Object.keys(content.items).length} shop items, ${content.characters.presets.length} avatar presets.`);
