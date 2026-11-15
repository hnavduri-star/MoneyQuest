import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { useVisibleNodes } from '../lib/hooks.js';
import { isNodeUnlocked } from '@engine/progress.js';
import { RewardRow } from './ui.jsx';
import Confetti from './Confetti.jsx';
import Mascot from './Mascot.jsx';
import BadgeIcon from './BadgeIcon.jsx';

const LEVEL_SOURCES = new Set(['level.completed', 'boss', 'perfect', 'combo', 'participation']);

export function sumRewards(effects) {
  return effects.filter((e) => e.type === 'reward' && LEVEL_SOURCES.has(e.source)).reduce((a, e) => ({ xp: a.xp + e.xp, coins: a.coins + e.coins, gems: a.gems + e.gems }), { xp: 0, coins: 0, gems: 0 });
}

export default function Results({ world, node, stars, effects, extra, onReplay, bonus, extras = [] }) {
  const { t } = useT(world.id);
  const { state, age, content, city } = useGame();
  const { tx } = useT(world.id);
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
      {extras.length > 0 && (
        <div className="w-full grid gap-2" aria-label={t('results.also')}>
          {extras.map((e, i) => (
            <motion.div key={i} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 + i * 0.15 }} className="card px-4 py-3 flex items-center gap-3 text-start">
              {e.type === 'levelUp' && (<><span className="text-3xl" aria-hidden>🚀</span><span className="font-bold">{t('levelUp.body', { level: e.level })}</span></>)}
              {e.type === 'badges' && (
                <>
                  <span className="flex -space-x-3 rtl:space-x-reverse">{e.ids.slice(0, 4).map((id) => content.badgeMap[id] && <BadgeIcon key={id} badge={content.badgeMap[id]} earned size={40} />)}</span>
                  <span className="font-bold">{t('badge.new')} ×{e.ids.length}: {e.ids.slice(0, 2).map((id) => tx(content.badgeMap[id]?.name)).join(', ')}{e.ids.length > 2 ? '…' : ''}</span>
                </>
              )}
              {(e.type === 'buildingUnlocked' || e.type === 'buildingUpgraded') && (<><span className="text-3xl" aria-hidden>🏗️</span><span className="font-bold">{e.type === 'buildingUnlocked' ? t('building.unlocked', { name: tx(content.worldIndex.find((w) => w.id === e.worldId)?.name) }) : t('building.upgraded', { name: tx(content.worldIndex.find((w) => w.id === e.worldId)?.name), tier: e.tier })}</span></>)}
              {e.type === 'stamp' && (<><span className="text-3xl" aria-hidden>🛂</span><span className="font-bold">{t('passport.stamped', { city: tx(city.name) })}</span></>)}
              {['questDone', 'streak', 'goalReached', 'missionApproved', 'bankInterest'].includes(e.type) && (<><span className="text-2xl" aria-hidden>✨</span><span className="font-bold">{e.type === 'questDone' ? t('quests.claim') + ' ✓' : e.type === 'goalReached' ? t('goal.reached') : t('results.bonus')}</span></>)}
            </motion.div>
          ))}
        </div>
      )}
      {node.kind === 'boss' && !state.checks?.[world.id]?.post && (
        <button className="btn-sun w-full" onClick={() => nav(`/check/${world.id}/post`)}>🧠 {t('check.afterCta')}</button>
      )}
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
