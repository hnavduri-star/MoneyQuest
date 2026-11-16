import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { levelProgress, rankForLevel } from '@engine/levels.js';
import Avatar from './Avatar.jsx';
import { Coin, Gem, Progress } from './ui.jsx';
import { play } from '../lib/sound.js';

export function HUD() {
  const { state, active, content, syncStatus, themeColor } = useGame();
  const { t, tx } = useT();
  const nav = useNavigate();
  const lp = levelProgress(state.xp, content.rewards.levelCurve);
  const rank = rankForLevel(state.level, content.ranks.ranks);
  const theme = themeColor(active.meta.theme);
  return (
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur border-b border-line">
      <div className="max-w-app mx-auto px-3 py-2 flex items-center gap-2">
        <button onClick={() => nav('/settings')} className="shrink-0 w-12 h-12 rounded-2xl bg-surface border-2 border-line overflow-hidden flex items-start justify-center" aria-label={t('settings.title')}>
          <Avatar avatar={active.meta.avatar} level={state.level} equipped={state.inventory.equipped} size={46} theme={theme} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-sm font-bold leading-none">
            <span className="truncate">{active.nickname}</span>
            <span className="text-soft">· {rank.icon} {tx(rank.name)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="chip bg-ink text-cream text-xs px-2 py-0.5">{t('common.level')} {state.level}</span>
            <Progress value={lp.pct} height={10} label={`${lp.into} / ${lp.needed} XP`} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm font-extrabold">
          <motion.span key={state.coins} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="flex items-center gap-1" aria-label={`${state.coins} ${t('common.coins')}`}>
            <Coin size={20} /> <span className="tabular-nums">{state.coins}</span>
          </motion.span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1" aria-label={`${state.gems} ${t('common.gems')}`}>
              <Gem size={16} /> {state.gems}
            </span>
            <span aria-label={t('hud.streak', { n: state.streak.count })}>🔥{state.streak.count}</span>
          </span>
        </div>
      </div>
      {syncStatus === 'offline' && <p className="text-center text-xs bg-sun-pale py-0.5">{t('offline.banner')}</p>}
    </header>
  );
}

const TABS = [
  { to: '/town', icon: '🏘️', key: 'nav.town' },
  { to: '/worlds', icon: '🗺️', key: 'nav.worlds' },
  { to: '/games', icon: '🎮', key: 'nav.games' },
  { to: '/quests', icon: '📜', key: 'nav.quests' },
  { to: '/trophies', icon: '🏆', key: 'nav.trophies' },
  { to: '/shop', icon: '🛍️', key: 'nav.shop' },
];

export function BottomNav() {
  const { t } = useT();
  const { state } = useGame();
  const claimable = (state.daily?.quests || []).some((q) => q.done && !q.claimed) || !state.daily?.chestClaimed || (state.weekly?.done && !state.weekly?.claimed);
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line pb-safe" aria-label="main">
      <div className="max-w-app mx-auto grid grid-cols-6">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} onClick={() => play('tap')} className={({ isActive }) => `relative flex flex-col items-center justify-center min-h-[60px] text-xs font-bold ${isActive ? 'text-ink' : 'text-soft'}`}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="navpill" className="absolute inset-x-2 inset-y-1 rounded-2xl bg-sun-pale" />}
                <span className="relative text-2xl" aria-hidden>
                  {tab.icon}
                </span>
                <span className="relative">{t(tab.key)}</span>
                {tab.to === '/quests' && claimable && <span className="absolute top-2 end-[25%] w-3 h-3 rounded-full bg-ember border-2 border-white" aria-label="!" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function Shell() {
  return (
    <div className="min-h-full pb-24">
      <HUD />
      <main className="max-w-app mx-auto px-4 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
