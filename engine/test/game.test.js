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
import { contentVars, cityContext, editionCities, getEdition } from '../city.js';
import { minigameConfig, journeyProgress, nodePosition } from '../progress.js';
import { fill, tr as trText } from '../text.js';

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

describe('cities and partner editions', () => {
  const er = content.worlds['currency-bazaar'].nodes.find((n) => n.id === 'exchange-rate');
  it('every city localises answers: 10 foreign units in local money', () => {
    const want = { dubai: 36.7, 'abu-dhabi': 36.7, london: 8.5, paris: 9.2, mumbai: 850, 'new-york': 11 };
    for (const [id, v] of Object.entries(want)) {
      const step = stepsForAge(er, '10-12', cityContext(content, id)).find((s) => s.type === 'number');
      expect(step.answer).toBe(v);
    }
  });
  it('lesson text is filled with city facts in both languages', () => {
    const story = content.worlds['cash-cards'].nodes[0].steps[0].text;
    const london = fill(trText(story, 'en'), contentVars(content, { cityId: 'london', lang: 'en', worldId: 'cash-cards' }));
    expect(london).toContain('Bank of England');
    expect(london).toContain('Westfield');
    expect(london).not.toMatch(/\{\w+\}/);
    const mumbaiAr = fill(trText(story, 'ar'), contentVars(content, { cityId: 'mumbai', lang: 'ar', worldId: 'cash-cards' }));
    expect(mumbaiAr).toContain('بنك الاحتياطي الهندي');
  });
  it('rupee prices are scaled, so money answers scale too', () => {
    const node = content.worlds['money-basics'].nodes.find((n) => n.id === 'earning');
    const num = (city) => stepsForAge(node, '10-12', cityContext(content, city)).find((s) => s.type === 'number');
    expect(num('dubai').answer).toBe(60);
    expect(num('mumbai').answer).toBe(600);
    const weeks = content.worlds['money-basics'].nodes.find((n) => n.id === 'piggy-goals');
    expect(stepsForAge(weeks, '10-12', cityContext(content, 'mumbai')).find((s) => s.type === 'number').answer).toBe(5);
  });
  it('the currency mini-game sorts the chosen city\'s own places', () => {
    const node = content.worlds['currency-bazaar'].nodes.find((n) => n.kind === 'minigame');
    const cfg = minigameConfig(node, cityContext(content, 'paris'));
    expect(cfg.items.find((i) => i.text.en === 'Berlin').bin).toBe('home');
    expect(cfg.items.find((i) => i.text.en === 'London').bin).toBe('abroad');
  });
  it('a sponsor bank edition names its products and limits its cities', () => {
    const v = contentVars(content, { cityId: 'dubai', editionId: 'abc-bank', lang: 'en' });
    expect(v.bank).toBe('ABC Bank');
    expect(v.kidsAccount).toBe('ABC Junior Saver account');
    expect(editionCities(content, getEdition(content, 'abc-bank')).map((c) => c.id)).toEqual(['dubai', 'abu-dhabi']);
    const std = contentVars(content, { cityId: 'london', editionId: 'standard', lang: 'en' });
    expect(std.bank).toBe('Town Bank');
    expect(contentVars(content, { editionId: 'sunrise-school', lang: 'en' }).school).toBe('Sunrise International School');
  });
});

describe('games arcade and journey progress', () => {
  it('arcade games pay for the first 3 plays a day, then XP only; best score is kept', () => {
    let s = fresh();
    const coins = [];
    for (let i = 0; i < 4; i++) {
      const r = processEvent(s, { type: 'arcade.played', gameId: 'count-cash', score: 10 + i, stars: 3 }, content, opts);
      coins.push(r.effects.filter((e) => e.type === 'reward' && e.source === 'arcade.played').reduce((a, e) => a + e.coins, 0));
      s = r.state;
    }
    expect(coins).toEqual([15, 15, 15, 0]);
    expect(s.arcade['count-cash']).toMatchObject({ best: 13, plays: 4, bestStars: 3 });
    expect(s.badges['arcade-1']).toBeTruthy();
    const tomorrow = processEvent(s, { type: 'arcade.played', gameId: 'count-cash', score: 1, stars: 1 }, content, { ...opts, day: addDays(DAY, 1) });
    expect(tomorrow.effects.some((e) => e.type === 'reward' && e.coins === 5)).toBe(true);
    expect(processEvent(s, { type: 'arcade.played', gameId: 'nope', score: 1 }, content, opts).effects[0].code).toBe('unknownGame');
  });
  it('journey progress shows overall %, the current stop and lesson position', () => {
    const p0 = journeyProgress(fresh(), content, '10-12');
    expect(p0.pct).toBe(0);
    expect(p0.current).toMatchObject({ worldId: 'money-basics', stopNumber: 1, nodesDone: 0 });
    const s = clearWorld(fresh(), 'money-basics').state;
    const p1 = journeyProgress(s, content, '10-12');
    expect(p1.worldsDone).toBe(1);
    expect(p1.current.worldId).toBe('salary-street');
    expect(p1.pct).toBeGreaterThan(0);
    expect(nodePosition(content.worlds['money-basics'], 'needs-wants', '10-12')).toEqual({ index: 2, total: 8 });
  });
  it('every city has notes and coins for the cash games', () => {
    for (const c of content.cities.cities) {
      expect(c.cash.notes.length).toBeGreaterThan(2);
      expect(c.cash.coins.length).toBeGreaterThan(1);
    }
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
    const meta = content.worldIndex.find((w) => w.id === 'salary-street');
    expect(worldStatus(s0, meta, content, '10-12')).toBe('locked');
    const { state, effects } = clearWorld(s0, 'money-basics');
    expect(state.town.buildings['money-basics']).toBe(1);
    expect(effects.some((e) => e.type === 'buildingUnlocked' && e.worldId === 'money-basics')).toBe(true);
    expect(state.badges['world-money-basics']).toBeTruthy();
    expect(state.badges['stars-money-basics']).toBeTruthy();
    expect(state.badges['first-boss']).toBeTruthy();
    expect(worldStatus(state, meta, content, '10-12')).toBe('open');
  });
  it('the Dubai journey is a chain, and a started world never re-locks', () => {
    const journey = content.worldIndex.filter((w) => w.playable);
    expect(journey.map((w) => w.id)).toEqual(['money-basics', 'salary-street', 'household-budget', 'bank-town', 'bank-products', 'cash-cards', 'currency-bazaar', 'lemonade-empire', 'pl-factory', 'debt-dungeon', 'stock-market']);
    journey.slice(1).forEach((w, i) => expect(w.requires).toEqual([journey[i].id]));
    journey.forEach((w) => expect(w.location?.en).toBeTruthy());
    const bank = content.worldIndex.find((w) => w.id === 'bank-town');
    const s = processEvent(fresh(), { type: 'level.completed', worldId: 'bank-town', nodeId: 'what-is-a-bank', stars: 3 }, content, opts).state;
    expect(worldStatus(s, bank, content, '10-12')).toBe('open');
    expect(worldStatus(fresh(), bank, content, '10-12')).toBe('locked');
  });
  it('every playable world has lessons, a mini-game, a quiz and a boss, and every lesson starts by explaining', () => {
    for (const w of Object.values(content.worlds)) {
      const kinds = w.nodes.map((n) => n.kind);
      expect(kinds.filter((k) => k === 'lesson').length).toBeGreaterThanOrEqual(4);
      expect(kinds).toContain('minigame');
      expect(kinds).toContain('quiz');
      expect(kinds.at(-1)).toBe('boss');
      for (const n of w.nodes.filter((x) => x.kind === 'lesson')) expect(n.steps[0].type).toBe('story');
    }
  });
  it('every answered question pays coins straight away; streaks pay more; replays pay less', () => {
    const q = (o) => ({ type: 'question.answered', worldId: 'money-basics', nodeId: 'what-is-money', correct: true, ...o });
    const coinsOf = (r) => r.effects.filter((e) => e.type === 'reward' && e.source === 'question.answered').reduce((a, e) => a + e.coins, 0);
    expect(coinsOf(processEvent(fresh(), q({ firstTry: true, streak: 1 }), content, opts))).toBe(2);
    expect(coinsOf(processEvent(fresh(), q({ firstTry: true, streak: 4 }), content, opts))).toBe(4);
    expect(coinsOf(processEvent(fresh(), q({ firstTry: true, streak: 99 }), content, opts))).toBe(4);
    expect(coinsOf(processEvent(fresh(), q({ firstTry: false }), content, opts))).toBe(1);
    let s = processEvent(fresh(), { type: 'level.completed', worldId: 'money-basics', nodeId: 'what-is-money', stars: 3 }, content, opts).state;
    expect(coinsOf(processEvent(s, q({ firstTry: true, streak: 3 }), content, opts))).toBe(1);
    for (let i = 1; i <= 10; i++) s = processEvent(s, q({ firstTry: true, streak: i }), content, opts).state;
    expect(s.stats.questionsAnswered).toBe(10);
    expect(s.badges['answers-10']).toBeTruthy();
    expect(s.badges['streak-10']).toBeTruthy();
  });
  it('Town Bank: deposit, weekly compound interest, withdraw; gems bought with earned coins', () => {
    let s = processEvent(fresh(), { type: 'daily.login' }, content, opts).state;
    s.coins = 1000;
    expect(processEvent(s, { type: 'bank.deposit', amount: 5000 }, content, opts).effects[0].code).toBe('notEnoughCoins');
    s = processEvent(s, { type: 'bank.deposit', amount: 400 }, content, opts).state;
    expect(s.bank.balance).toBe(400);
    expect(s.badges['first-deposit']).toBeTruthy();
    const nextWeek = processEvent(s, { type: 'daily.login' }, content, { ...opts, day: addDays(DAY, 7) });
    expect(nextWeek.state.bank.balance).toBe(420);
    expect(nextWeek.effects.some((e) => e.type === 'bankInterest' && e.amount === 20)).toBe(true);
    const twoWeeks = processEvent(nextWeek.state, { type: 'daily.login' }, content, { ...opts, day: addDays(DAY, 14) }).state;
    expect(twoWeeks.bank.balance).toBe(441);
    const sameWeek = processEvent(twoWeeks, { type: 'daily.login' }, content, { ...opts, day: addDays(DAY, 14) }).state;
    expect(sameWeek.bank.balance).toBe(441);
    const w = processEvent(sameWeek, { type: 'bank.withdraw', amount: 41 }, content, { ...opts, day: addDays(DAY, 14) }).state;
    expect(w.bank.balance).toBe(400);
    expect(processEvent(w, { type: 'bank.withdraw', amount: 9999 }, content, opts).effects[0].code).toBe('notEnoughSaved');
    const g = processEvent({ ...w, coins: 500 }, { type: 'gems.buy', count: 2 }, content, opts).state;
    expect(g.gems).toBe(w.gems + 2 + (g.badges['gem-trader'] && content.rewards.badgeRewards.rare.gems ? content.rewards.badgeRewards.rare.gems : 0));
    expect(g.stats.gemsBought).toBe(2);
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

describe('stock market sims', () => {
  it('prices follow buyers and sellers, and shares beat savings only over the long run', async () => {
    const { sharePrice, savingsVsShares, worstYear, shareValue } = await import('../sims/stocks.js');
    expect(sharePrice(10, 10, 10)).toBe(10);
    expect(sharePrice(10, 16, 4)).toBe(20);
    expect(sharePrice(10, 4, 16)).toBe(5);
    expect(shareValue(10, 11, 8)).toEqual({ value: 110, gain: 30 });
    const short = savingsVsShares(1000, 1000, 5).at(-1);
    expect(short.total).toBeLessThan(short.allSavings);
    const long = savingsVsShares(1000, 1000, 15).at(-1);
    expect(long.total).toBeGreaterThan(long.allSavings);
    expect(savingsVsShares(1000, 0, 10).at(-1).total).toBe(savingsVsShares(1000, 0, 10).at(-1).allSavings);
    expect(worstYear(10)).toEqual({ year: 5, pct: -18 });
    expect(() => savingsVsShares(100, 200, 1)).toThrow();
  });
});
