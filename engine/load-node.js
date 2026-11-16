/** Node-only helper: read content/*.json from disk and build it (used by tests and the content checker). */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildContent } from './content.js';

export const CONTENT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'content');
const read = (...p) => JSON.parse(readFileSync(join(CONTENT_DIR, ...p), 'utf8'));

export function loadRawContent() {
  const worlds = readdirSync(join(CONTENT_DIR, 'worlds'))
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => read('worlds', f));
  return {
    rewards: read('rewards.json'),
    ranks: read('ranks.json'),
    badges: read('badges.json'),
    quests: read('quests.json'),
    shop: read('shop.json'),
    characters: read('characters.json'),
    cities: read('cities.json'),
    editions: read('editions.json'),
    arcade: read('arcade.json'),
    worldIndex: read('worlds', 'index.json'),
    worlds,
    i18n: { en: read('i18n', 'en.json'), ar: read('i18n', 'ar.json') },
  };
}
export const loadContent = () => buildContent(loadRawContent());
