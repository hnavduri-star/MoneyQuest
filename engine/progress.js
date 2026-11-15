import { pickAge } from './text.js';

export function nodeProgress(state, worldId, nodeId) {
  return state.progress?.[worldId]?.[nodeId];
}

/** Nodes visible to this age tier. */
export function visibleNodes(world, age) {
  return world.nodes.filter((n) => !n.ages || n.ages.includes(age));
}

export function isWorldComplete(state, world, age) {
  return visibleNodes(world, age).filter((n) => n.required).every((n) => nodeProgress(state, world.id, n.id));
}

export function worldStars(state, world, age) {
  const nodes = visibleNodes(world, age);
  const got = nodes.reduce((s, n) => s + (nodeProgress(state, world.id, n.id)?.stars || 0), 0);
  return { got, max: nodes.length * 3 };
}

export function isWorldPerfect(state, world, age) {
  return visibleNodes(world, age).every((n) => (nodeProgress(state, world.id, n.id)?.stars || 0) >= 3);
}

/** A node is open when every earlier required node is done. Optional nodes never block. */
export function isNodeUnlocked(state, world, nodeId, age) {
  const nodes = visibleNodes(world, age);
  const idx = nodes.findIndex((n) => n.id === nodeId);
  if (idx < 0) return false;
  return nodes.slice(0, idx).filter((n) => n.required).every((n) => nodeProgress(state, world.id, n.id));
}

/** World availability: built, allowed for the age tier, and its prerequisite worlds are complete. */
export function worldStatus(state, meta, content, age) {
  if (!meta.playable) return 'coming-soon';
  if (meta.ages && !meta.ages.includes(age)) return 'age-locked';
  const req = (meta.requires || []).filter((id) => content.worlds[id]);
  const reqDone = req.every((id) => isWorldComplete(state, content.worlds[id], age));
  if (!reqDone) return 'locked';
  return isWorldComplete(state, content.worlds[meta.id], age) ? 'complete' : 'open';
}

/** Steps of a node visible to this age tier, with age-tiered values resolved. */
export function stepsForAge(node, age) {
  return (node.steps || []).filter((s) => !s.ages || s.ages.includes(age)).map((s) => resolveAgeDeep(s, age));
}

const LOCALISED_KEYS = new Set(['en', 'ar']);
function resolveAgeDeep(v, age) {
  v = pickAge(v, age);
  if (Array.isArray(v)) return v.map((x) => resolveAgeDeep(x, age));
  if (v && typeof v === 'object') {
    if (Object.keys(v).every((k) => LOCALISED_KEYS.has(k))) return v;
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolveAgeDeep(x, age)]));
  }
  return v;
}
