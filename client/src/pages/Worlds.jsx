import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useT } from '../lib/i18n.js';
import { useWorlds } from '../lib/hooks.js';
import { Progress, Header } from '../components/ui.jsx';
import { play } from '../lib/sound.js';

export default function Worlds() {
  const { t, tx } = useT();
  const nav = useNavigate();
  const worlds = useWorlds();
  return (
    <div>
      <Header title={t('worlds.title')} />
      <div className="space-y-3">
        {worlds.map(({ meta, world, status, stars }, i) => {
          const open = status === 'open' || status === 'complete';
          const reqName = (meta.requires || []).map((id) => tx(worlds.find((w) => w.meta.id === id)?.meta.name)).join(', ');
          return (
            <motion.button
              key={meta.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.03 }}
              disabled={!open}
              onClick={() => {
                play('tap');
                nav(`/world/${meta.id}`);
              }}
              className={`card w-full p-4 flex items-center gap-4 text-start ${open ? '' : 'opacity-60'}`}
            >
              <span className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-4xl" style={{ background: `${meta.color}22`, border: `3px solid ${meta.color}` }} aria-hidden>
                {meta.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="font-extrabold text-lg block leading-tight">{tx(meta.name)}</span>
                {world && <span className="text-sm text-soft block">{tx(world.tagline)}</span>}
                {open && (
                  <span className="flex items-center gap-2 mt-1">
                    <Progress value={stars.got / (stars.max || 1)} color={meta.color} height={8} />
                    <span className="text-xs font-bold whitespace-nowrap">⭐ {t('worlds.stars', stars)}</span>
                  </span>
                )}
                {status === 'locked' && <span className="text-sm font-bold">🔒 {t('worlds.requires', { world: reqName })}</span>}
                {status === 'age-locked' && <span className="text-sm font-bold">🔒 {t('worlds.ageLocked')}</span>}
                {status === 'coming-soon' && <span className="text-sm font-bold">🚧 {t('common.comingSoon')} · {t('worlds.phase')}</span>}
              </span>
              {status === 'complete' && <span className="text-2xl" aria-label="complete">✅</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
