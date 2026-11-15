import { useMemo } from 'react';
import { useGame } from '../store.jsx';
import { worldStatus, worldStars, isNodeUnlocked, visibleNodes, nodeProgress } from '@engine/progress.js';
import { dueConcepts } from '@engine/mastery.js';
import { dayKey } from '@engine/dates.js';

/** Nodes this player can see (age tier + optional modules they've switched off). */
export function useVisibleNodes(world) {
  const { age, settings } = useGame();
  return useMemo(() => (world ? visibleNodes(world, age).filter((n) => !(n.module === 'islamic-banking' && !settings.islamic)) : []), [world, age, settings.islamic]);
}

export function useWorlds() {
  const { content, state, age } = useGame();
  return useMemo(
    () =>
      content.worldIndex.map((meta) => {
        const world = content.worlds[meta.id];
        const status = worldStatus(state, meta, content, age);
        const stars = world ? worldStars(state, world, age) : { got: 0, max: 0 };
        const next = world ? visibleNodes(world, age).find((n) => !nodeProgress(state, world.id, n.id) && isNodeUnlocked(state, world, n.id, age) && !n.optional) : null;
        return { meta, world, status, stars, next };
      }),
    [content, state, age],
  );
}

export function useDueReviews() {
  const { state } = useGame();
  return useMemo(() => dueConcepts(state.mastery, dayKey()), [state.mastery]);
}
