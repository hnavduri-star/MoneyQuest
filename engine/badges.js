import { isWorldComplete, isWorldPerfect } from './progress.js';
import { masteryLevel, countMastered } from './mastery.js';

/** Evaluate a badge's data-driven criteria against the player's state. */
export function meetsCriteria(criteria, state, content, age) {
  const c = criteria;
  if (c.allOf) return c.allOf.every((x) => meetsCriteria(x, state, content, age));
  if (c.anyOf) return c.anyOf.some((x) => meetsCriteria(x, state, content, age));
  if (c.stat) return (state.stats?.[c.stat] || 0) >= c.gte;
  if (c.level !== undefined) return state.level >= c.level;
  if (c.streak !== undefined) return (state.streak?.best || 0) >= c.streak;
  if (c.badges !== undefined) return Object.keys(state.badges || {}).length >= c.badges;
  if (c.owned !== undefined) return (state.inventory?.owned || []).filter((id) => !c.type || content.items[id]?.type === c.type).length >= c.owned;
  if (c.mastered !== undefined) return countMastered(state.mastery) >= c.mastered;
  if (c.nodeDone) return !!state.progress?.[c.nodeDone.worldId]?.[c.nodeDone.nodeId];
  const w = content.worlds[c.worldComplete || c.worldPerfect || c.masteredWorld || c.worldStars];
  if (c.worldComplete) return !!w && isWorldComplete(state, w, age);
  if (c.worldPerfect) return !!w && isWorldPerfect(state, w, age);
  if (c.masteredWorld) return !!w && w.concepts.length > 0 && w.concepts.every((id) => masteryLevel(state.mastery?.[id]) === 'mastered');
  return false;
}

/** Badge progress 0..1 for the trophy room ("3 / 10"). */
export function badgeProgress(badge, state) {
  const c = badge.criteria;
  if (c.stat) return { have: Math.min(state.stats?.[c.stat] || 0, c.gte), need: c.gte };
  if (c.level !== undefined) return { have: Math.min(state.level, c.level), need: c.level };
  if (c.streak !== undefined) return { have: Math.min(state.streak?.best || 0, c.streak), need: c.streak };
  if (c.mastered !== undefined) return { have: Math.min(countMastered(state.mastery), c.mastered), need: c.mastered };
  if (c.badges !== undefined) return { have: Math.min(Object.keys(state.badges || {}).length, c.badges), need: c.badges };
  return null;
}
