import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { useVisibleNodes } from '../lib/hooks.js';
import { isNodeUnlocked, nodeProgress, worldStatus } from '@engine/progress.js';
import { Stars, Header } from '../components/ui.jsx';
import Building from '../components/Building.jsx';
import { play } from '../lib/sound.js';

export default function WorldMap() {
  const { worldId } = useParams();
  const { content, state, age } = useGame();
  const { t, tx } = useT();
  const nav = useNavigate();
  const world = content.worlds[worldId];
  const meta = content.worldIndex.find((w) => w.id === worldId);
  const nodes = useVisibleNodes(world);
  if (!world || !meta) return <Navigate to="/worlds" replace />;
  const status = worldStatus(state, meta, content, age);
  if (status === 'locked' || status === 'coming-soon') return <Navigate to="/worlds" replace />;
  const tier = state.town.buildings[worldId] ?? 0;

  return (
    <div>
      <Header title={tx(world.name)} onBack={() => nav('/worlds')} />
      <div className="card p-3 flex items-center gap-3 mb-5" style={{ borderColor: meta.color }}>
        <Building type={meta.building} tier={tier} color={meta.color} icon={meta.icon} size={84} />
        <p className="flex-1 text-soft">{tx(world.tagline)}</p>
      </div>

      <ol className="relative flex flex-col gap-3">
        {nodes.map((n, i) => {
          const done = nodeProgress(state, worldId, n.id);
          const open = isNodeUnlocked(state, world, n.id, age);
          const offset = [0, 40, 70, 40][i % 4];
          return (
            <motion.li key={n.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} style={{ marginInlineStart: offset }}>
              <button
                disabled={!open}
                onClick={() => {
                  play('tap');
                  nav(`/play/${worldId}/${n.id}`);
                }}
                className={`flex items-center gap-3 text-start ${open ? '' : 'opacity-50'}`}
              >
                <span className={`relative w-[72px] h-[72px] shrink-0 rounded-full flex items-center justify-center text-3xl border-4 shadow-pop ${n.kind === 'boss' ? 'w-[84px] h-[84px] text-4xl' : ''}`} style={{ background: done ? meta.color : open ? '#FFFFFF' : '#E7DCC8', borderColor: meta.color }}>
                  <span aria-hidden>{open ? n.icon : '🔒'}</span>
                  {open && !done && <motion.span className="absolute inset-0 rounded-full border-4" style={{ borderColor: meta.color }} animate={{ scale: [1, 1.25], opacity: [0.8, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />}
                </span>
                <span>
                  <span className="text-xs font-bold uppercase text-soft block">
                    {t(`node.${n.kind}`)}
                    {n.optional && ` · ${t('worlds.optional')}`}
                  </span>
                  <span className="font-extrabold block leading-tight">{tx(n.title)}</span>
                  {done && <Stars n={done.stars} size={18} />}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ol>

      {world.realLife && (
        <div className="card p-4 mt-6 bg-leaf-pale">
          <p className="font-extrabold">🏡 {t('worlds.realLife')}</p>
          <p>{tx(world.realLife)}</p>
        </div>
      )}
    </div>
  );
}
