#!/usr/bin/env node
// Validates every content file. Run: npm run content:check
import { loadContent } from '../engine/load-node.js';
import { validateContent } from '../engine/validate.js';
import { SIM_IDS, GAME_IDS, STEP_ART } from '../engine/registry.js';

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

if (errors.length) {
  console.error(`✗ ${errors.length} content problem(s):\n  - ` + errors.join('\n  - '));
  process.exit(1);
}
const playable = content.worldIndex.filter((w) => w.playable).length;
console.log(`✓ Content OK: ${playable} playable worlds, ${content.badges.length} badges, ${Object.keys(content.items).length} shop items, ${content.characters.presets.length} avatar presets.`);
