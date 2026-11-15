/**
 * Event-driven reward engine.
 *
 * Everything the player does is an event: { type: 'level.completed', worldId, nodeId, stars, ... }.
 * processEvent() is pure: (state, event) -> { state, effects }. Rewards, stats and quest progress
 * come from content/rewards.json and content/quests.json, and badges from content/badges.json,
 * so new missions, quests and badges plug in by editing data, not code.
 */
import { dayKey, weekKey } from './dates.js';
import { levelForXp, rankForLevel } from './levels.js';
import { applyLogin, chestDay } from './streaks.js';
import { updateConcept } from './mastery.js';
import { meetsCriteria } from './badges.js';
import { buildingTier } from './town.js';
import { pickDailyQuests, pickWeekly, advance } from './quests.js';
import { matches, amount } from './match.js';

const clone = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

class Rejected extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export function processEvent(state, event, content, opts = {}) {
  const day = opts.day || dayKey(opts.now || new Date());
  const ctx = { s: clone(state), effects: [], content, day, age: opts.age || '10-12' };
  try {
    rollBoards(ctx);
    const ev = { ...event };
    const handler = HANDLERS[ev.type];
    if (handler) handler(ctx, ev);
    if (!ev.skipRules) applyRules(ctx, ev);
    trackQuests(ctx, ev);
    settle(ctx);
    return { state: ctx.s, effects: ctx.effects };
  } catch (e) {
    if (e instanceof Rejected) return { state, effects: [{ type: 'rejected', code: e.code, event: event.type }] };
    throw e;
  }
}

/** Run several events in order (handy for tests and offline replays). */
export function processEvents(state, events, content, opts) {
  let s = state;
  const all = [];
  for (const ev of events) {
    const r = processEvent(s, ev, content, opts);
    s = r.state;
    all.push(...r.effects);
  }
  return { state: s, effects: all };
}

function bump(s, stat, by = 1) {
  s.stats[stat] = (s.stats[stat] || 0) + by;
}

export function grant(ctx, r, source, ev = {}) {
  const { s, day } = ctx;
  const boost = ev.coinBoost && ev.coinBoost > 1 ? Math.min(ev.coinBoost, 3) : 1;
  const xp = amount(r.xp, ev);
  const coins = amount(r.coins, ev) * boost;
  const gems = amount(r.gems, ev);
  const freezes = amount(r.freezes, ev);
  if (!xp && !coins && !gems && !freezes) return;
  s.xp += xp;
  s.coins += coins;
  s.gems += gems;
  if (freezes) s.streak.freezes = Math.min((ctx.content.rewards.streak?.maxFreezes ?? 3), s.streak.freezes + freezes);
  if (xp) {
    bump(s, 'xpEarned', xp);
    s.xpLog[day] = (s.xpLog[day] || 0) + xp;
  }
  if (coins) bump(s, 'coinsEarned', coins);
  s.stats.peakCoins = Math.max(s.stats.peakCoins || 0, s.coins);
  if (gems) bump(s, 'gemsEarned', gems);
  ctx.effects.push({ type: 'reward', source, xp, coins, gems, freezes });
  if (coins && source !== 'quest') trackQuests(ctx, { type: 'coins.earned', amount: coins });
}

function spend(ctx, { coins = 0, gems = 0 }) {
  const { s } = ctx;
  if (s.coins < coins) throw new Rejected('notEnoughCoins');
  if (s.gems < gems) throw new Rejected('notEnoughGems');
  s.coins -= coins;
  s.gems -= gems;
  if (coins) bump(s, 'coinsSpent', coins);
  if (gems) bump(s, 'gemsSpent', gems);
}

function applyRules(ctx, ev) {
  const rule = ctx.content.rewards.events?.[ev.type];
  if (!rule) return;
  const variant = (rule.variants || []).find((v) => matches(ev, v.when));
  if (variant) grant(ctx, variant, ev.type, ev);
  for (const b of rule.bonus || []) if (matches(ev, b.when)) grant(ctx, b, b.source || ev.type, ev);
  for (const st of rule.stats || []) {
    if (!matches(ev, st.when)) continue;
    if (st.add) bump(ctx.s, st.stat, st.add);
    if (st.addField) bump(ctx.s, st.stat, Number(ev[st.addField]) || 0);
    if (st.maxField) ctx.s.stats[st.stat] = Math.max(ctx.s.stats[st.stat] || 0, Number(ev[st.maxField]) || 0);
  }
}

function rollBoards(ctx) {
  const { s, day, content } = ctx;
  if (s.daily?.day !== day) {
    const pool = (content.quests.daily || []).filter((q) => !q.minLevel || s.level >= q.minLevel);
    s.daily = { day, quests: pickDailyQuests(pool, s.profileId || 'p', day, content.rewards.dailyQuestCount || 3), chestClaimed: false };
  }
  if ((content.quests.weekly || []).length && s.weekly?.week !== weekKey(day)) s.weekly = pickWeekly(content.quests.weekly, day);
  payBankInterest(ctx);
}

/** The in-game Town Bank pays compound interest once a week on coins the child has saved there. */
function payBankInterest(ctx) {
  const { s, day, content } = ctx;
  const cfg = content.rewards.bank || {};
  const wk = weekKey(day);
  s.bank ||= { balance: 0, lastInterestWeek: null, interestEarned: 0 };
  if (s.bank.lastInterestWeek === wk) return;
  const first = s.bank.lastInterestWeek === null;
  s.bank.lastInterestWeek = wk;
  if (first || s.bank.balance <= 0) return;
  const interest = Math.min(cfg.maxWeeklyInterest ?? 200, Math.max(1, Math.floor((s.bank.balance * (cfg.weeklyRatePct ?? 5)) / 100)));
  s.bank.balance += interest;
  s.bank.interestEarned += interest;
  bump(s, 'interestEarned', interest);
  ctx.effects.push({ type: 'bankInterest', amount: interest, balance: s.bank.balance });
}

function trackQuests(ctx, ev) {
  const { s, content } = ctx;
  for (const entry of s.daily?.quests || []) {
    const def = content.quests.daily.find((q) => q.id === entry.id);
    if (def && advance(entry, def, ev) && entry.done) ctx.effects.push({ type: 'questDone', questId: def.id, board: 'daily' });
  }
  if (s.weekly) {
    const def = (content.quests.weekly || []).find((q) => q.id === s.weekly.id);
    if (def && advance(s.weekly, def, ev) && s.weekly.done) ctx.effects.push({ type: 'questDone', questId: def.id, board: 'weekly' });
  }
}

/** Resolve level-ups, town buildings and badges until nothing new happens. */
function settle(ctx) {
  const { s, content, age } = ctx;
  for (let guard = 0; guard < 8; guard++) {
    let changed = false;
    const target = levelForXp(s.xp, content.rewards.levelCurve);
    while (s.level < target) {
      const before = rankForLevel(s.level, content.ranks.ranks);
      s.level += 1;
      const rank = rankForLevel(s.level, content.ranks.ranks);
      ctx.effects.push({ type: 'levelUp', level: s.level, rank: rank.id, rankChanged: rank.id !== before.id });
      const lu = content.rewards.levelUp || {};
      grant(ctx, { coins: lu.coins || 0, gems: s.level % (lu.gemEvery || 5) === 0 ? lu.gems || 1 : 0 }, 'levelUp', { level: s.level });
      changed = true;
    }
    for (const meta of content.worldIndex) {
      if (!meta.playable) continue;
      const tier = buildingTier(s, content.worlds[meta.id], age);
      const prev = s.town.buildings[meta.id] ?? 0;
      if (tier === prev) continue;
      s.town.buildings[meta.id] = tier;
      if (typeof tier === 'number' && tier > 0 && (typeof prev !== 'number' || prev === 0)) {
        ctx.effects.push({ type: 'worldComplete', worldId: meta.id });
        ctx.effects.push({ type: 'buildingUnlocked', worldId: meta.id, building: meta.building, tier });
        grant(ctx, content.rewards.worldComplete || {}, 'worldComplete');
      } else if (typeof tier === 'number' && typeof prev === 'number' && tier > prev) {
        ctx.effects.push({ type: 'buildingUpgraded', worldId: meta.id, building: meta.building, tier });
        grant(ctx, content.rewards.buildingUpgrade || {}, 'buildingUpgrade');
      }
      changed = true;
    }
    for (const b of content.badges) {
      if (s.badges[b.id]) continue;
      if (!meetsCriteria(b.criteria, s, content, age)) continue;
      s.badges[b.id] = ctx.day;
      ctx.effects.push({ type: 'badge', badgeId: b.id, rarity: b.rarity });
      grant(ctx, content.rewards.badgeRewards?.[b.rarity] || {}, 'badge');
      changed = true;
    }
    if (!changed) break;
  }
}

const HANDLERS = {
  'daily.login'(ctx, ev) {
    const r = applyLogin(ctx.s.streak, ctx.day, ctx.content.rewards.streak);
    ctx.s.streak = r.streak;
    if (r.result === 'same') {
      ev.skipRules = true;
      return;
    }
    ev.count = r.streak.count;
    ev.result = r.result;
    ctx.effects.push({ type: 'streak', ...r, count: r.streak.count });
  },

  'level.completed'(ctx, ev) {
    const { s, content, day } = ctx;
    const world = content.worlds[ev.worldId];
    const node = world?.nodes.find((n) => n.id === ev.nodeId);
    if (!node) throw new Rejected('unknownNode');
    ev.kind = node.kind;
    ev.stars = Math.max(1, Math.min(3, Math.round(ev.stars || 1)));
    ev.mistakes = Math.max(0, ev.mistakes || 0);
    const prev = s.progress[ev.worldId]?.[ev.nodeId];
    ev.firstClear = !prev;
    ev.starsGained = Math.max(0, ev.stars - (prev?.stars || 0));
    ev.improved = !ev.firstClear && ev.starsGained > 0;
    ev.perfect = ev.mistakes === 0;
    s.progress[ev.worldId] ||= {};
    s.progress[ev.worldId][ev.nodeId] = {
      stars: Math.max(ev.stars, prev?.stars || 0),
      best: Math.max(ev.score || 0, prev?.best || 0),
      attempts: (prev?.attempts || 0) + 1,
      firstDay: prev?.firstDay || day,
      lastDay: day,
    };
    for (const a of ev.answers || []) if (a.concept) s.mastery[a.concept] = updateConcept(s.mastery[a.concept], !!a.correct, day);
    ctx.effects.push({ type: 'levelResult', worldId: ev.worldId, nodeId: ev.nodeId, stars: ev.stars, firstClear: ev.firstClear, improved: ev.improved });
  },

  /** Every answered question pays out straight away, so earning feels immediate. Replays pay less. */
  'question.answered'(ctx, ev) {
    const { s, content } = ctx;
    const world = content.worlds[ev.worldId];
    if (!world?.nodes.some((n) => n.id === ev.nodeId)) throw new Rejected('unknownNode');
    ev.replay = !!s.progress[ev.worldId]?.[ev.nodeId];
    ev.firstTry = !!ev.firstTry;
    ev.correct = ev.correct !== false;
    ev.streakBonus = ev.firstTry ? Math.max(0, Math.min(5, ev.streak || 1) - 1) : 0;
  },

  'bank.deposit'(ctx, ev) {
    const n = Math.floor(ev.amount);
    if (!(n > 0)) throw new Rejected('badAmount');
    if (ctx.s.coins < n) throw new Rejected('notEnoughCoins');
    ctx.s.coins -= n;
    ctx.s.bank.balance += n;
    bump(ctx.s, 'depositsMade');
    ctx.s.stats.peakBank = Math.max(ctx.s.stats.peakBank || 0, ctx.s.bank.balance);
    ev.skipRules = true;
    ctx.effects.push({ type: 'deposited', amount: n });
  },

  'bank.withdraw'(ctx, ev) {
    const n = Math.floor(ev.amount);
    if (!(n > 0)) throw new Rejected('badAmount');
    if (ctx.s.bank.balance < n) throw new Rejected('notEnoughSaved');
    ctx.s.bank.balance -= n;
    ctx.s.coins += n;
    ev.skipRules = true;
    ctx.effects.push({ type: 'withdrew', amount: n });
  },

  /** Swap earned coins for gems (the "credits" of MoneyQuest). Never real money. */
  'gems.buy'(ctx, ev) {
    const count = Math.floor(ev.count || 1);
    if (!(count > 0)) throw new Rejected('badAmount');
    spend(ctx, { coins: count * (ctx.content.rewards.gemPriceCoins ?? 120) });
    ctx.s.gems += count;
    bump(ctx.s, 'gemsBought', count);
    ev.skipRules = true;
    ctx.effects.push({ type: 'gemsBought', count });
  },

  'review.completed'(ctx, ev) {
    const { s, day } = ctx;
    let correct = 0;
    for (const a of ev.answers || []) {
      if (!a.concept) continue;
      s.mastery[a.concept] = updateConcept(s.mastery[a.concept], !!a.correct, day, { review: true });
      if (a.correct) correct++;
    }
    ev.correct = correct;
    ev.total = (ev.answers || []).length;
  },

  'chest.claim'(ctx, ev) {
    const { s, content } = ctx;
    if (s.daily.chestClaimed) throw new Rejected('alreadyClaimed');
    const cal = content.rewards.chestCalendar;
    const idx = chestDay(s.streak.count);
    s.daily.chestClaimed = true;
    ev.skipRules = true;
    bump(s, 'chestsOpened');
    ctx.effects.push({ type: 'chest', day: idx });
    grant(ctx, cal[idx], 'chest');
  },

  'quest.claim'(ctx, ev) {
    const { s, content } = ctx;
    const isWeekly = ev.board === 'weekly';
    const entry = isWeekly ? s.weekly : s.daily.quests.find((q) => q.id === ev.questId);
    if (!entry || entry.id !== ev.questId || !entry.done || entry.claimed) throw new Rejected('questNotReady');
    const def = (isWeekly ? content.quests.weekly : content.quests.daily).find((q) => q.id === ev.questId);
    entry.claimed = true;
    ev.skipRules = true;
    bump(s, isWeekly ? 'weekliesDone' : 'questsDone');
    grant(ctx, def.reward, 'quest');
  },

  'shop.buy'(ctx, ev) {
    const { s, content } = ctx;
    const item = content.items[ev.itemId];
    if (!item) throw new Rejected('unknownItem');
    if (s.inventory.owned.includes(item.id)) throw new Rejected('alreadyOwned');
    if (item.unlock?.level && s.level < item.unlock.level) throw new Rejected('levelTooLow');
    if (item.unlock?.badge && !s.badges[item.unlock.badge]) throw new Rejected('badgeNeeded');
    if (item.notForSale) throw new Rejected('notForSale');
    spend(ctx, { coins: item.price?.coins || 0, gems: item.price?.gems || 0 });
    s.inventory.owned.push(item.id);
    bump(s, 'itemsBought');
    equip(s, item);
    ctx.effects.push({ type: 'purchased', itemId: item.id });
  },

  'item.equip'(ctx, ev) {
    const { s, content } = ctx;
    ev.skipRules = true;
    if (!ev.itemId) {
      delete s.inventory.equipped[ev.slot];
      return;
    }
    const item = content.items[ev.itemId];
    if (!item || !s.inventory.owned.includes(item.id)) throw new Rejected('notOwned');
    equip(s, item, true);
  },

  'hint.used'(ctx, ev) {
    const cost = ctx.content.rewards.hintCost ?? 5;
    if (!ev.free && ctx.s.coins >= cost) {
      spend(ctx, { coins: cost });
      ev.paid = cost;
    }
    bump(ctx.s, 'hintsUsed');
  },

  'powerup.used'(ctx, ev) {
    const p = ctx.content.rewards.powerups?.[ev.powerup];
    if (!p) throw new Rejected('unknownPowerup');
    spend(ctx, { coins: p.cost || 0 });
    bump(ctx.s, 'powerupsUsed');
  },

  'choice.made'(ctx, ev) {
    ctx.s.choices[ev.key] = ev.value;
  },
};

function equip(s, item, toggle = false) {
  if (item.type === 'decoration') {
    const list = s.inventory.decorations;
    const i = list.indexOf(item.id);
    if (i >= 0 && toggle) list.splice(i, 1);
    else if (i < 0) {
      list.push(item.id);
      if (list.length > 8) list.shift();
    }
    return;
  }
  if (toggle && s.inventory.equipped[item.type] === item.id) delete s.inventory.equipped[item.type];
  else s.inventory.equipped[item.type] = item.id;
}
