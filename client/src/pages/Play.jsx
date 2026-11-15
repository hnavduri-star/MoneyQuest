import { useParams, Navigate } from 'react-router-dom';
import { useGame } from '../store.jsx';
import { isNodeUnlocked } from '@engine/progress.js';
import LessonPlayer from '../components/LessonPlayer.jsx';
import SortGame from '../components/SortGame.jsx';

export default function Play() {
  const { worldId, nodeId } = useParams();
  const { content, state, age } = useGame();
  const world = content.worlds[worldId];
  const node = world?.nodes.find((n) => n.id === nodeId);
  if (!node || !isNodeUnlocked(state, world, nodeId, age)) return <Navigate to={world ? `/world/${worldId}` : '/worlds'} replace />;
  return node.kind === 'minigame' ? <SortGame key={nodeId} world={world} node={node} /> : <LessonPlayer key={nodeId} world={world} node={node} />;
}
