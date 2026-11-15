export const STATE_VERSION = 1;

export function createInitialState({ profileId, start = {} } = {}) {
  return {
    version: STATE_VERSION,
    profileId,
    xp: 0,
    level: 1,
    coins: start.coins ?? 50,
    gems: start.gems ?? 0,
    stats: {},
    progress: {},
    mastery: {},
    badges: {},
    inventory: { owned: [], equipped: {}, decorations: [] },
    bank: { balance: 0, lastInterestWeek: null, interestEarned: 0 },
    town: { buildings: {} },
    streak: { count: 0, best: 0, lastDay: null, freezes: 1 },
    daily: { day: null, quests: [], chestClaimed: false },
    weekly: null,
    xpLog: {},
    choices: {},
    passport: {}, // cityId -> worldId -> day the stop was finished there
    missions: {}, // worldId -> { status: 'pending' | 'approved', day }
    checks: {}, // worldId -> { pre: { score, total }, post: { score, total } }
    familyClaims: {},
  };
}

/** Bring an older saved state up to date without losing anything. */
export function migrateState(s) {
  const base = createInitialState({ profileId: s.profileId });
  return { ...base, ...s, inventory: { ...base.inventory, ...s.inventory }, streak: { ...base.streak, ...s.streak }, bank: { ...base.bank, ...s.bank }, passport: s.passport || {}, missions: s.missions || {}, checks: s.checks || {}, familyClaims: s.familyClaims || {}, version: STATE_VERSION };
}

/** Summary used for family leaderboards (nickname-only, no other data leaves the profile). */
export function summarize(state, day, daysBack) {
  const sumRange = (from, to) => {
    let t = 0;
    for (const [d, xp] of Object.entries(state.xpLog || {})) if (d > from && d <= to) t += xp;
    return t;
  };
  const weekXp = sumRange(daysBack(day, 7), day);
  const prevWeekXp = sumRange(daysBack(day, 14), daysBack(day, 7));
  const stars = Object.values(state.progress || {}).reduce((s, w) => s + Object.values(w).reduce((a, n) => a + (n.stars || 0), 0), 0);
  return { level: state.level, xp: state.xp, weekXp, prevWeekXp, improvement: weekXp - prevWeekXp, stars, badges: Object.keys(state.badges || {}).length, streak: state.streak?.count || 0 };
}
