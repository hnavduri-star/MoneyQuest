import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { useVisibleNodes } from '../lib/hooks.js';
import { isNodeUnlocked } from '@engine/progress.js';
import { RewardRow } from './ui.jsx';
import Confetti from './Confetti.jsx';
import Mascot from './Mascot.jsx';

const LEVEL_SOURCES = new Set(['level.completed', 'boss', 'perfect', 'combo', 'participation']);

export function sumRewards(effects) {
  return effects.filter((e) => e.type === 'reward' && LEVEL_SOURCES.has(e.source)).reduce((a, e) => ({ xp: a.xp + e.xp, coins: a.coins + e.coins, gems: a.gems + e.gems }), { xp: 0, coins: 0, gems: 0 });
}

export default function Results({ world, node, stars, effects, extra, onReplay, bonus }) {
  const { t } = useT(world.id);
  const { state, age } = useGame();
  const nav = useNavigate();
  const nodes = useVisibleNodes(world);
  const idx = nodes.findIndex((n) => n.id === node.id);
  const next = nodes.slice(idx + 1).find((n) => isNodeUnlocked(state, world, n.id, age));
  const base = sumRewards(effects);
  const r = { xp: base.xp + (bonus?.xp || 0), coins: base.coins + (bonus?.coins || 0), gems: base.gems };
  const res = effects.find((e) => e.type === 'levelResult');
  const boss = node.kind === 'boss';
  const lines = { 3: t('lesson.correct3'), 2: t('lesson.correct2'), 1: t('lesson.correct') };
  return (
    <div className="min-h-full max-w-app mx-auto px-5 py-8 flex flex-col items-center text-center gap-4">
      <Confetti />
      <h1 className="title text-3xl">{boss ? `🏆 ${t('results.boss')}` : t('results.title')}</h1>
      <div className="flex gap-2" role="img" aria-label={`${stars} / 3`}>
        {[1, 2, 3].map((i) => (
          <motion.svg key={i} width="72" height="72" viewBox="0 0 24 24" initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.25 * i, type: 'spring', stiffness: 260, damping: 12 }}>
            <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" fill={i <= stars ? '#F7C95C' : '#E7DCC8'} stroke={i <= stars ? '#B07400' : '#CDBFA6'} strokeWidth="1.2" />
          </motion.svg>
        ))}
      </div>
      {res?.improved && <p className="chip bg-leaf-pale text-leaf text-base">🎉 {t('results.newBest')}</p>}
      {extra}
      <p className="font-bold text-soft">{t('results.rewards')}</p>
      <RewardRow {...r} t={t} />
      <Mascot text={lines[stars]} mood="excited" size={80} />
      <div className="w-full grid gap-2 mt-auto">
        {next && (
          <button className="btn-primary w-full" onClick={() => nav(`/play/${world.id}/${next.id}`)}>
            {t('results.next')} <span className="inline-block rtl:rotate-180">→</span>
          </button>
        )}
        {stars < 3 && (
          <button className="btn-sun w-full" onClick={onReplay}>
            ⭐ {t('results.again')}
          </button>
        )}
        <button className="btn-ghost w-full" onClick={() => nav(next ? `/world/${world.id}` : '/town')}>
          {next ? `🗺️ ${t('worlds.title')}` : `🏘️ ${t('results.toTown')}`}
        </button>
      </div>
    </div>
  );
}
