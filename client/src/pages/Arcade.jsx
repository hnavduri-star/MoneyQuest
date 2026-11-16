import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { worldStatus } from '@engine/progress.js';
import { dayKey } from '@engine/dates.js';
import { Header, Stars, RewardRow, Coin } from '../components/ui.jsx';
import Confetti from '../components/Confetti.jsx';
import Mascot from '../components/Mascot.jsx';
import CountCash from '../games/CountCash.jsx';
import Shopkeeper from '../games/Shopkeeper.jsx';
import BudgetBasket from '../games/BudgetBasket.jsx';
import MarketDay from '../games/MarketDay.jsx';
import MoneyMatch from '../games/MoneyMatch.jsx';

const GAMES = { 'count-cash': CountCash, shopkeeper: Shopkeeper, 'budget-basket': BudgetBasket, 'market-day': MarketDay, 'money-match': MoneyMatch };

function useUnlocked() {
  const { content, state, age } = useGame();
  return (g) => {
    const w = g.unlock?.world;
    if (!w) return true;
    const meta = content.worldIndex.find((x) => x.id === w);
    return !meta || worldStatus(state, meta, content, age) === 'complete';
  };
}

/** The Games tab: replayable money games. The first 3 plays of each game per day pay coins. */
export default function Arcade() {
  const { content, state } = useGame();
  const { t, tx } = useT();
  const nav = useNavigate();
  const unlocked = useUnlocked();
  const limit = content.rewards.arcadeRewardedPlaysPerDay ?? 3;
  return (
    <div>
      <Header title={`🎮 ${t('arcade.title')}`} />
      <p className="text-soft mb-4">{t('arcade.intro', { n: limit })}</p>
      <div className="grid gap-3">
        {content.arcade.games.map((g, i) => {
          const rec = state.arcade?.[g.id];
          const today = rec?.daily?.[dayKey()] || 0;
          const open = unlocked(g);
          const need = g.unlock?.world && content.worldIndex.find((w) => w.id === g.unlock.world);
          return (
            <motion.button key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} disabled={!open} onClick={() => nav(`/games/${g.id}`)} className={`card p-4 flex items-center gap-4 text-start ${open ? '' : 'opacity-60'}`}>
              <span className="w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center text-4xl" style={{ background: `${g.color}22`, border: `3px solid ${g.color}` }} aria-hidden>{open ? g.icon : '🔒'}</span>
              <span className="flex-1 min-w-0">
                <span className="font-extrabold text-lg block">{tx(g.name)}</span>
                <span className="text-sm text-soft block">{open ? tx(g.desc) : t('arcade.unlockAfter', { world: tx(need?.name) })}</span>
                {open && (
                  <span className="flex items-center gap-2 mt-1 text-xs font-bold">
                    <Stars n={rec?.bestStars || 0} size={14} />
                    {rec ? <span>{t('arcade.best', { n: rec.best })}</span> : <span className="chip bg-sun-pale">{t('arcade.new')}</span>}
                    <span className="flex items-center gap-1"><Coin size={12} /> {Math.max(0, limit - today)}/{limit}</span>
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function ArcadeGame() {
  const { gameId } = useParams();
  const { content, dispatch, state } = useGame();
  const { t, tx } = useT();
  const nav = useNavigate();
  const unlocked = useUnlocked();
  const game = content.arcade.games.find((g) => g.id === gameId);
  const [phase, setPhase] = useState('intro');
  const [run, setRun] = useState(0);
  const [res, setRes] = useState(null);
  if (!game || !unlocked(game)) return <Navigate to="/games" replace />;
  const Game = GAMES[game.id];
  const finish = ({ score, stars, summary }) => {
    const effects = dispatch({ type: 'arcade.played', gameId: game.id, score, stars });
    const r = effects.filter((e) => e.type === 'reward' && ['arcade.played', 'newBest'].includes(e.source)).reduce((a, e) => ({ xp: a.xp + e.xp, coins: a.coins + e.coins, gems: a.gems + e.gems }), { xp: 0, coins: 0, gems: 0 });
    const info = effects.find((e) => e.type === 'arcadeResult');
    setRes({ stars, summary, r, newBest: info?.newBest, capped: info?.capped });
    setPhase('done');
  };
  return (
    <div className="min-h-full max-w-app mx-auto px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <button className="tap rounded-2xl bg-surface border border-line font-bold" onClick={() => nav('/games')} aria-label={t('common.back')}>✕</button>
        <h1 className="title flex-1">{game.icon} {tx(game.name)}</h1>
      </div>
      {phase === 'intro' && (
        <div className="flex flex-col gap-4 text-center pt-2">
          <Mascot text={tx(game.desc)} mood="excited" />
          {state.arcade?.[game.id] && <p className="font-bold">🏆 {t('arcade.best', { n: state.arcade[game.id].best })}</p>}
          <button className="btn-primary w-full text-xl" style={{ '--btn': game.color }} onClick={() => setPhase('play')}>▶ {t('game.start')}</button>
        </div>
      )}
      {phase === 'play' && <Game key={run} game={game} onFinish={finish} />}
      {phase === 'done' && res && (
        <div className="flex flex-col items-center gap-4 text-center pt-4">
          <Confetti />
          <Stars n={res.stars} size={56} />
          <p className="text-xl font-extrabold">{res.summary}</p>
          {res.newBest && <p className="chip bg-leaf-pale text-leaf text-base">🏆 {t('results.newBest')}</p>}
          <RewardRow {...res.r} t={t} />
          {res.capped && <p className="text-sm text-soft">{t('arcade.capped')}</p>}
          <div className="grid gap-2 w-full">
            <button className="btn-primary w-full" style={{ '--btn': game.color }} onClick={() => { setRun(run + 1); setRes(null); setPhase('play'); }}>↻ {t('common.replay')}</button>
            <button className="btn-ghost w-full" onClick={() => nav('/games')}>🎮 {t('arcade.allGames')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
