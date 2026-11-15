import { hash, weekKey } from './dates.js';
import { matches } from './match.js';

/** Pick N quests for a day, deterministically from the profile id + day (same board all day, no randomness). */
export function pickDailyQuests(pool, profileId, day, n = 3) {
  const order = [...pool].sort((a, b) => hash(`${profileId}|${day}|${a.id}`) - hash(`${profileId}|${day}|${b.id}`));
  const picked = [];
  const groups = new Set();
  for (const q of order) {
    if (picked.length >= n) break;
    if (q.group && groups.has(q.group)) continue;
    picked.push(q);
    if (q.group) groups.add(q.group);
  }
  return picked.map((q) => ({ id: q.id, progress: 0, done: false, claimed: false }));
}

export function pickWeekly(pool, day) {
  const wk = weekKey(day);
  const q = pool[hash(wk) % pool.length];
  return { week: wk, id: q.id, progress: 0, done: false, claimed: false };
}

/** How much an event advances a quest definition. */
export function questIncrement(def, ev) {
  if (ev.type !== def.event) return 0;
  if (!matches(ev, def.where)) return 0;
  if (def.measure && def.measure !== 'count') return Number(ev[def.measure]) || 0;
  return 1;
}

export function advance(entry, def, ev) {
  if (!entry || entry.done) return false;
  const inc = questIncrement(def, ev);
  if (!inc) return false;
  entry.progress = Math.min(def.target, entry.progress + inc);
  if (entry.progress >= def.target) entry.done = true;
  return true;
}
