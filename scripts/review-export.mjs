#!/usr/bin/env node
// Writes review/city-facts.csv and review/lesson-text.csv for human reviewers (see docs/content-review.md).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const csv = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
const out = join(root, 'review');
mkdirSync(out, { recursive: true });

// Any object with an "en" key is a translatable text.
function walk(v, path, rows) {
  if (v && typeof v === 'object' && !Array.isArray(v) && typeof v.en === 'string') return rows.push([path, v.en, v.ar ?? '']);
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}/${i}`, rows));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!k.startsWith('$')) walk(x, `${path}/${k}`, rows);
}

const cities = JSON.parse(readFileSync(join(root, 'content/cities.json'), 'utf8'));
const cityRows = [];
cities.cities.forEach((c, i) => walk(c, `cities.json#/cities/${i}`, cityRows));
writeFileSync(join(out, 'city-facts.csv'), ['path,en,ar', ...cityRows.map((r) => r.map(csv).join(','))].join('\n'));

const lessonRows = [];
for (const f of readdirSync(join(root, 'content/worlds')).filter((x) => x.endsWith('.json'))) walk(JSON.parse(readFileSync(join(root, 'content/worlds', f), 'utf8')), `worlds/${f}#`, lessonRows);
for (const f of ['missions.json', 'badges.json', 'shop.json', 'quests.json', 'editions.json'].filter((x) => existsSync(join(root, 'content', x)))) walk(JSON.parse(readFileSync(join(root, 'content', f), 'utf8')), `${f}#`, lessonRows);
writeFileSync(join(out, 'lesson-text.csv'), ['path,en,ar', ...lessonRows.map((r) => r.map(csv).join(','))].join('\n'));
console.log(`✓ review/city-facts.csv (${cityRows.length} rows), review/lesson-text.csv (${lessonRows.length} rows)`);
