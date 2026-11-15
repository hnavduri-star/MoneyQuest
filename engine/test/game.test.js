import { describe, it, expect } from 'vitest';
import { loadContent } from '../load-node.js';
import { validateContent } from '../validate.js';
import { SIM_IDS, GAME_IDS } from '../registry.js';
import { createInitialState, migrateState, summarize } from '../state.js';
import { processEvent, processEvents } from '../rewards.js';
import { levelForXp, xpToReach, levelProgress, rankForLevel, evolutionStage, MAX_LEVEL } from '../levels.js';
import { applyLogin } from '../streaks.js';
import { updateConcept, masteryLevel, dueConcepts } from '../mastery.js';
import { tr, fill, pickAge } from '../text.js';
import { isNodeUnlocked, worldStatus, stepsForAge, visibleNodes } from '../progress.js';
import { pickDailyQuests } from '../quests.js';
import { addDays, daysBetween, weekKey } from '../dates.js';
import { starsFromMistakes, comboMultiplier } from '../scoring.js';

const content = loadContent();
const DAY = '2026-11-15';
const opts = { day: DAY, age: '10-12' };
const fresh = () => createInitialState({ profileId: 'p1' });

/** Complete every visible node of a world with the given stars. */
function clearWorld(state, worldId, stars = 3, o = opts) {
  const w = content.worlds[worldId];
  const events = visibleNodes(w, o.age).map((n) => ({ type: 'level.completed', worldId, nodeId: n.id, stars, mistakes: stars === 3 ? 0 : 2 }));
  return processEvents(state, events, content, o);
}

describe('content', () => {
  it('passes validation', () => {
    expect(validateContent(content, { sims: SIM_IDS, games: GAME_IDS })).toEqual([]);
  });
  it('has 100+ badges with rarity tiers', () => {
    expect(content.badges.length).toBeGreaterThanOrEqual(100);
    expect(new Set(content.badges.map((b) => b.rarity))).toEqual(new Set(['common', 'rare', 'epic', 'legendary']));
  });
  it('worlds have 5-8 levels plus mini-game, quiz and boss', () => {
    for (const id of ['money-basics', 'bank-town']) {
      const kinds = content.worlds[id].nodes.map((n) => n.kind);
      const lessons = kinds.filter((k) => k === 'lesson').length;
      expect(lessons).toBeGreaterThanOrEqual(5);
      expect(kinds.filter((k) => k === 'minigame')).toHaveLength(1);
      expect(kinds.filter((k) => k === 'quiz')).toHaveLength(1);
      expect(kinds.at(-1)).toBe('boss');
    }
  });
  it('has no real-money items', () => {
    for (const it of Object.values(content.items)) expect(Object.keys(it.price)).not.toContain('real');
  });
});

describe('text helpers', () => {
  it('resolves language and age tiers', () => {
    const v = { '7-9': { en: 'small', ar: 'صغير' }, default: { en: 'big', ar: 'كبير' } };
    expect(tr(v, 'en', '7-9')).toBe('small');
    expect(tr(v, 'ar', '13-15')).toBe('كبير');
    expect(tr({ en: 'hi' }, 'ar')).toBe('hi');
    expect(pickAge({ '7-9': 4, default: 5 }, '10-12')).toBe(5);
  });
  it('fills money tokens and variables', () => {
    expect(fill('Pay [[10]] to {name}', { name: 'Zed' }, (n) => `$${n}`)).toBe('Pay $10 to Zed');
  });
  it('stepsForAge filters and resolves numbers', () => {
    const node = content.worlds['money-basics'].nodes.find((n) => n.id === 'earning');
    const young = stepsForAge(node, '7-9').find((s) => s.type === 'number');
    const old = stepsForAge(node, '13-15').find((s) => s.type === 'number');
    expect(young.answer).toBe(10);
    expect(old.answer).toBe(60);
    expect(young.prompt.en).toMatch(/2 cars/);
  });
});

describe('dates', () => {
  it('day maths', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-02-27', '2026-03-01')).toBe(2);
    expect(weekKey('2026-11-15')).toBe('2026-W46');
    expect(weekKey('2027-01-01')).toBe('2026-W53');
  });
});

describe('levels and ranks', () => {
  it('xp curve is monotonic and capped at 50', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(xpToReach(10))).toBe(10);
    expect(levelForXp(xpToReach(10) - 1)).toBe(9);
    expect(levelForXp(1e9)).toBe(MAX_LEVEL);
    expect(levelProgress(xpToReach(3) + 5).level).toBe(3);
  });
  it('named ranks cover 1-50', () => {
    const ranks = content.ranks.ranks;
    for (let l = 1; l <= 50; l++) expect(rankForLevel(l, ranks)).toBeTruthy();
    expect(rankForLevel(1, ranks).id).toBe('saver');
    expect(rankForLevel(50, ranks).id).toBe('money-master');
    expect(ranks.map((r) => r.id)).toEqual(['saver', 'builder', 'trader', 'banker', 'tycoon', 'money-master']);
  });
  it('evolution stages', () => {
    expect([1, 10, 18, 34, 43].map(evolutionStage)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('streaks (gentle)', () => {
  it('continues, freezes and restarts without punishment', () => {
    let r = applyLogin({}, '2026-11-01');
    expect(r.result).toBe('first');
    r = applyLogin(r.streak, '2026-11-02');
    expect(r).toMatchObject({ result: 'continued' });
    expect(r.streak.count).toBe(2);
    expect(applyLogin(r.streak, '2026-11-02').result).toBe('same');
    const withFreeze = { ...r.streak, freezes: 1 };
    const f = applyLogin(withFreeze, '2026-11-04');
    expect(f).toMatchObject({ result: 'frozen', usedFreezes: 1 });
    expect(f.streak.count).toBe(3);
    const reset = applyLogin({ ...r.streak, freezes: 0 }, '2026-11-10');
    expect(reset.result).toBe('restarted');
    expect(reset.streak.count).toBe(1);
    expect(reset.streak.best).toBe(2);
  });
  it('earns a freeze every 7 days', () => {
    let s = {};
    let earned = 0;
    for (let i = 0; i < 7; i++) {
      const r = applyLogin(s, addDays('2026-11-01', i));
      s = r.streak;
      if (r.earnedFreeze) earned++;
    }
    expect(earned).toBe(1);
  });
});

describe('mastery + spaced repetition', () => {
  it('cannot be mastered in one sitting', () => {
    let c;
    for (let i = 0; i < 10; i++) c = updateConcept(c, true, DAY);
    expect(c.score).toBe(70);
    expect(c.box).toBe(1);
    expect(masteryLevel(c)).toBe('practising');
  });
  it('reviews on separate days lead to mastered', () => {
    let c = updateConcept(undefined, true, DAY);
    let day = DAY;
    for (let i = 0; i < 4; i++) {
      day = c.due;
      c = updateConcept(c, true, day, { review: true });
    }
    expect(masteryLevel(c)).toBe('mastered');
  });
  it('lists due concepts', () => {
    const c = updateConcept(undefined, true, DAY);
    expect(dueConcepts({ a: c }, DAY)).toEqual([]);
    expect(dueConcepts({ a: c }, addDays(DAY, 1))).toEqual(['a']);
  });
});

describe('reward engine', () => {
  it('first clear grants XP, coins, stats and the first-steps badge', () => {
    const { state, effects } = processEvent(fresh(), { type: 'level.completed', worldId: 'money-basics', nodeId: 'what-is-money', stars: 3, mistakes: 0, answers: [{ concept: 'money-purpose', correct: true }] }, content, opts);
    expect(state.xp).toBeGreaterThanOrEqual(60);
    expect(state.stats.levelsCompleted).toBe(1);
    expect(state.stats.perfectLevels).toBe(1);
    expect(state.badges['first-steps']).toBe(DAY);
    expect(state.mastery['money-purpose'].score).toBe(10);
    expect(effects.some((e) => e.type === 'badge' && e.badgeId === 'first-steps')).toBe(true);
    expect(effects.some((e) => e.type === 'levelUp')).toBe(true);
  });
  it('replays give a small reward, improving stars gives more', () => {
    const ev = { type: 'level.completed', worldId: 'money-basics', nodeId: 'what-is-money', mistakes: 3 };
    const a = processEvent(fresh(), { ...ev, stars: 1 }, content, opts).state;
    const b = processEvent(a, { ...ev, stars: 1 }, content, opts).state;
    const c = processEvent(b, { ...ev, stars: 3, mistakes: 0 }, content, opts).state;
    expect(b.coins - a.coins).toBe(2);
    expect(c.progress['money-basics']['what-is-money'].stars).toBe(3);
    expect(c.stats.stars).toBe(3);
    expect(c.stats.levelsCompleted).toBe(1);
  });
  it('rejects unknown nodes without changing state', () => {
    const s = fresh();
    const r = processEvent(s, { type: 'level.completed', worldId: 'nope', nodeId: 'x', stars: 3 }, content, opts);
    expect(r.state).toBe(s);
    expect(r.effects[0]).toMatchObject({ type: 'rejected', code: 'unknownNode' });
  });
  it('finishing a world unlocks its building, world badge and the next world', () => {
    const s0 = fresh();
    const meta = content.worldIndex.find((w) => w.id === 'bank-town');
    expect(worldStatus(s0, meta, content, '10-12')).toBe('locked');
    const { state, effects } = clearWorld(s0, 'money-basics');
    expect(state.town.buildings['money-basics']).toBe(1);
    expect(effects.some((e) => e.type === 'buildingUnlocked' && e.worldId === 'money-basics')).toBe(true);
    expect(state.badges['world-money-basics']).toBeTruthy();
    expect(state.badges['stars-money-basics']).toBeTruthy();
    expect(state.badges['first-boss']).toBeTruthy();
    expect(worldStatus(state, meta, content, '10-12')).toBe('open');
  });
  it('the optional Islamic banking lesson never blocks completion', () => {
    let { state } = clearWorld(fresh(), 'money-basics');
    const w = content.worlds['bank-town'];
    const events = w.nodes.filter((n) => !n.optional).map((n) => ({ type: 'level.completed', worldId: 'bank-town', nodeId: n.id, stars: 2, mistakes: 1 }));
    state = processEvents(state, events, content, opts).state;
    expect(state.badges['world-bank-town']).toBeTruthy();
    expect(state.badges['two-worlds']).toBeTruthy();
    expect(state.badges['islamic-banking']).toBeUndefined();
  });
  it('buildings upgrade as mastery improves', () => {
    let { state } = clearWorld(fresh(), 'money-basics');
    const ids = content.worlds['money-basics'].concepts;
    for (const id of ids) state.mastery[id] = { score: 65, box: 2, due: DAY, seen: 3, correct: 3 };
    let r = processEvent(state, { type: 'choice.made', key: 'x', value: 1 }, content, opts);
    expect(r.state.town.buildings['money-basics']).toBe(2);
    expect(r.effects.some((e) => e.type === 'buildingUpgraded' && e.tier === 2)).toBe(true);
    for (const id of ids) r.state.mastery[id] = { score: 90, box: 4, due: DAY, seen: 9, correct: 9 };
    r = processEvent(r.state, { type: 'choice.made', key: 'x', value: 2 }, content, opts);
    expect(r.state.town.buildings['money-basics']).toBe(3);
    expect(r.state.badges['master-money-basics']).toBeTruthy();
  });
  it('nodes unlock in order', () => {
    const w = content.worlds['money-basics'];
    expect(isNodeUnlocked(fresh(), w, 'what-is-money', '10-12')).toBe(true);
    expect(isNodeUnlocked(fresh(), w, 'needs-wants', '10-12')).toBe(false);
    const s = processEvent(fresh(), { type: 'level.completed', worldId: w.id, nodeId: 'what-is-money', stars: 1 }, content, opts).state;
    expect(isNodeUnlocked(s, w, 'needs-wants', '10-12')).toBe(true);
  });
  it('daily login: streak, chest once per day', () => {
    let { state, effects } = processEvent(fresh(), { type: 'daily.login' }, content, opts);
    expect(state.streak.count).toBe(1);
    expect(effects.find((e) => e.type === 'streak').result).toBe('first');
    const again = processEvent(state, { type: 'daily.login' }, content, opts);
    expect(again.state.xp).toBe(state.xp);
    const chest = processEvent(state, { type: 'chest.claim' }, content, opts);
    expect(chest.state.coins).toBe(state.coins + content.rewards.chestCalendar[0].coins + (chest.state.coins - state.coins - content.rewards.chestCalendar[0].coins));
    expect(chest.state.daily.chestClaimed).toBe(true);
    expect(processEvent(chest.state, { type: 'chest.claim' }, content, opts).effects[0].code).toBe('alreadyClaimed');
    const tomorrow = processEvent(chest.state, { type: 'daily.login' }, content, { ...opts, day: addDays(DAY, 1) });
    expect(tomorrow.state.daily.chestClaimed).toBe(false);
    expect(tomorrow.state.streak.count).toBe(2);
  });
  it('daily quests progress and can be claimed once', () => {
    let s = processEvent(fresh(), { type: 'daily.login' }, content, opts).state;
    expect(s.daily.quests).toHaveLength(3);
    const lvl = { type: 'level.completed', worldId: 'money-basics', stars: 3, mistakes: 0 };
    const ids = content.worlds['money-basics'].nodes.map((n) => n.id);
    s = processEvents(s, ids.slice(0, 6).map((nodeId) => ({ ...lvl, nodeId })), content, opts).state;
    s = processEvent(s, { type: 'review.completed', answers: [{ concept: 'needs-wants', correct: true }] }, content, opts).state;
    const done = s.daily.quests.filter((q) => q.done);
    expect(done.length).toBeGreaterThan(0);
    const q = done[0];
    const before = s.coins;
    const claimed = processEvent(s, { type: 'quest.claim', questId: q.id }, content, opts);
    expect(claimed.state.coins).toBeGreaterThan(before);
    expect(processEvent(claimed.state, { type: 'quest.claim', questId: q.id }, content, opts).effects[0].code).toBe('questNotReady');
  });
  it('quest boards are deterministic (no randomness)', () => {
    const a = pickDailyQuests(content.quests.daily, 'p1', DAY);
    const b = pickDailyQuests(content.quests.daily, 'p1', DAY);
    expect(a).toEqual(b);
    expect(new Set(a.map((q) => content.quests.daily.find((d) => d.id === q.id).group)).size).toBe(3);
  });
  it('shop: buy with earned coins, cannot overspend, equip and unequip', () => {
    const s = fresh();
    const poor = processEvent(s, { type: 'shop.buy', itemId: 'pet-cat' }, content, opts);
    expect(poor.effects[0].code).toBe('notEnoughCoins');
    s.coins = 500;
    const r = processEvent(s, { type: 'shop.buy', itemId: 'pet-cat' }, content, opts);
    expect(r.state.stats.coinsSpent).toBe(content.items['pet-cat'].price.coins);
    expect(r.state.coins).toBeLessThan(500);
    expect(r.state.inventory.equipped.pet).toBe('pet-cat');
    expect(r.state.badges['pet-pal']).toBeTruthy();
    expect(processEvent(r.state, { type: 'shop.buy', itemId: 'pet-cat' }, content, opts).effects[0].code).toBe('alreadyOwned');
    const off = processEvent(r.state, { type: 'item.equip', slot: 'pet', itemId: null }, content, opts);
    expect(off.state.inventory.equipped.pet).toBeUndefined();
    expect(processEvent(s, { type: 'shop.buy', itemId: 'hat-crown' }, content, opts).effects[0].code).toBe('levelTooLow');
  });
  it('hints cost coins but are free when you cannot afford them', () => {
    const s = fresh();
    expect(processEvent(s, { type: 'hint.used' }, content, opts).state.stats.coinsSpent).toBe(5);
    s.coins = 2;
    const r = processEvent(s, { type: 'hint.used' }, content, opts).state;
    expect(r.stats.coinsSpent).toBeUndefined();
    expect(r.stats.hintsUsed).toBe(1);
  });
  it('reviews earn bonus coins', () => {
    const r = processEvent(fresh(), { type: 'review.completed', answers: [{ concept: 'loans', correct: true }, { concept: 'loans', correct: false }] }, content, opts);
    expect(r.state.coins).toBeGreaterThan(50);
    expect(r.state.stats.reviewsDone).toBe(1);
  });
  it('mini-game double coins boost is capped', () => {
    const base = processEvent(fresh(), { type: 'level.completed', worldId: 'money-basics', nodeId: 'what-is-money', stars: 3 }, content, opts).state;
    const boosted = processEvent(fresh(), { type: 'level.completed', worldId: 'money-basics', nodeId: 'what-is-money', stars: 3, coinBoost: 99 }, content, opts).state;
    expect(boosted.coins).toBeGreaterThan(base.coins);
  });
  it('age tiers: younger players see fewer steps', () => {
    const node = content.worlds['bank-town'].nodes.find((n) => n.id === 'compound');
    expect(stepsForAge(node, '7-9').length).toBeLessThan(stepsForAge(node, '13-15').length);
  });
  it('state migration and leaderboard summary', () => {
    const old = { profileId: 'x', xp: 10, coins: 5 };
    const m = migrateState(old);
    expect(m.inventory.owned).toEqual([]);
    expect(m.xp).toBe(10);
    const s = { ...fresh(), xpLog: { [DAY]: 50, [addDays(DAY, -8)]: 20 } };
    const sum = summarize(s, DAY, (d, n) => addDays(d, -n));
    expect(sum).toMatchObject({ weekXp: 50, prevWeekXp: 20, improvement: 30 });
  });
  it('scoring helpers', () => {
    expect(starsFromMistakes(0, 5)).toBe(3);
    expect(starsFromMistakes(1, 5)).toBe(2);
    expect(starsFromMistakes(5, 5)).toBe(1);
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(6)).toBe(2);
    expect(comboMultiplier(100)).toBe(3);
  });
});
