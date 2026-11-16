/** All game content is bundled from /content at build time, so the app works fully offline. */
import { buildContent } from '@engine/content.js';
import rewards from '@content/rewards.json';
import ranks from '@content/ranks.json';
import badges from '@content/badges.json';
import quests from '@content/quests.json';
import shop from '@content/shop.json';
import characters from '@content/characters.json';
import worldIndex from '@content/worlds/index.json';
import cities from '@content/cities.json';
import editions from '@content/editions.json';
import arcade from '@content/arcade.json';
import en from '@content/i18n/en.json';
import ar from '@content/i18n/ar.json';

const worldFiles = import.meta.glob('../../content/worlds/*.json', { eager: true, import: 'default' });
const worlds = Object.entries(worldFiles)
  .filter(([path]) => !path.endsWith('/index.json'))
  .map(([, w]) => w);

export const content = buildContent({ rewards, ranks, badges, quests, shop, characters, worldIndex, worlds, cities, editions, arcade, i18n: { en, ar } });
export const LANGUAGES = [
  { id: 'en', name: 'English', dir: 'ltr', speech: 'en-US' },
  { id: 'ar', name: 'العربية', dir: 'rtl', speech: 'ar-SA' },
];

/** Which partner edition this build is for (set VITE_EDITION when building for a bank or school). */
export const BUILD_EDITION = import.meta.env.VITE_EDITION || content.editions.defaultEdition;
/** Demo builds can show an edition picker on the welcome screen (VITE_EDITION_PICKER=1). */
export const EDITION_PICKER = import.meta.env.VITE_EDITION_PICKER === '1';
