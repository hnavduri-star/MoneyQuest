import { isWorldComplete, nodeProgress } from './progress.js';
import { averageScore, masteryLevel } from './mastery.js';

/**
 * Building state for a world:
 *  0 = empty plot, 'construction' = started, 1 = built (world complete),
 *  2 = average mastery >= 60, 3 = every concept mastered.
 */
export function buildingTier(state, world, age) {
  if (!world) return 0;
  const started = world.nodes.some((n) => nodeProgress(state, world.id, n.id));
  if (!isWorldComplete(state, world, age)) return started ? 'construction' : 0;
  const ids = world.concepts;
  if (ids.length && ids.every((id) => masteryLevel(state.mastery?.[id]) === 'mastered')) return 3;
  if (averageScore(state.mastery, ids) >= 60) return 2;
  return 1;
}

/** "Liveliness" of the town 0..1, drives walkers, lights and sparkle. */
export function townLiveliness(state, content) {
  const playable = content.worldIndex.filter((w) => w.playable).length || 1;
  const tiers = Object.values(state.town?.buildings || {}).reduce((s, t) => s + (typeof t === 'number' ? t : 0.3), 0);
  return Math.min(1, 0.15 + (tiers / (playable * 3)) * 0.6 + Math.min(state.level, 50) / 200);
}
