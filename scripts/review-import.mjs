#!/usr/bin/env node
// Applies reviewers' edits from review/*.csv back into content/*.json (see docs/content-review.md).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const files = {};
let changed = 0;
for (const name of ['city-facts.csv', 'lesson-text.csv']) {
  const p = join(root, 'review', name);
  if (!existsSync(p)) continue;
  for (const [path, en, ar] of parseCsv(readFileSync(p, 'utf8')).slice(1)) {
    if (!path) continue;
    const [file, pointer] = path.split('#');
    const fp = join(root, 'content', file);
    files[fp] ||= JSON.parse(readFileSync(fp, 'utf8'));
    let node = files[fp];
    for (const k of pointer.split('/').filter(Boolean)) node = node?.[k];
    if (!node || typeof node.en !== 'string') { console.warn(`skipped unknown path ${path}`); continue; }
    if (node.en !== en || (node.ar ?? '') !== ar) { node.en = en; if (ar) node.ar = ar; changed++; }
  }
}
for (const [fp, data] of Object.entries(files)) writeFileSync(fp, JSON.stringify(data, null, 2) + '\n');
console.log(`✓ ${changed} text(s) updated. Now run: npm run content:check`);
