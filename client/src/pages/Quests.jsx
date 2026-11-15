import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { useDueReviews } from '../lib/hooks.js';
import { chestDay } from '@engine/streaks.js';
import { Header, Progress, RewardRow, Segmented, Coin, Gem } from '../components/ui.jsx';
import Avatar from '../components/Avatar.jsx';
import Confetti from '../components/Confetti.jsx';
import { play } from '../lib/sound.js';

function QuestCard({ def, entry, onClaim, t, tx }) {
  return (
    <div className={`card p-4 ${entry.claimed ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl" aria-hidden>{entry.claimed ? '✅' : entry.done ? '🎁' : '🎯'}</span>
        <div className="flex-1">
          <p className="font-extrabold">{tx(def.text)}</p>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={entry.progress / def.target} height={8} />
            <span className="text-xs font-bold whitespace-nowrap">{entry.progress}/{def.target}</span>
          </div>
        </div>
        {entry.done && !entry.claimed ? (
          <button className="btn-sun min-h-[44px] px-3 text-base" onClick={onClaim}>{t('quests.claim')}</button>
        ) : entry.claimed ? (
          <span className="text-sm font-bold">{t('quests.claimed')}</span>
        ) : null}
      </div>
      {!entry.claimed && <div className="mt-2"><RewardRow {...{ xp: def.reward.xp || 0, coins: def.reward.coins || 0, gems: def.reward.gems || 0 }} t={t} /></div>}
    </div>
  );
}

export default function Quests() {
  const { state, content, dispatch, leaderboard, active } = useGame();
  const { t, tx } = useT();
  const nav = useNavigate();
  const due = useDueReviews();
  const [party, setParty] = useState(0);
  const [lb, setLb] = useState(null);
  const [lbMode, setLbMode] = useState('top');
  useEffect(() => {
    leaderboard().then(setLb);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const claim = (ev) => {
    const eff = dispatch(ev);
    if (eff.some((e) => e.type === 'reward')) {
      play('coin');
      setParty((p) => p + 1);
    }
  };
  const today = chestDay(state.streak.count || 1);
  const cal = content.rewards.chestCalendar;
  const weeklyDef = state.weekly && content.quests.weekly.find((q) => q.id === state.weekly.id);

  return (
    <div className="space-y-5">
      {party > 0 && <Confetti key={party} count={24} />}
      <Header title={t('quests.title')} />

      {/* Daily chest: contents shown up front (no loot boxes) */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-extrabold text-lg">🎁 {t('quests.chest')}</h2>
          <span className="chip bg-ember-pale">🔥 {t('hud.streak', { n: state.streak.count })}</span>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-3">
          {cal.map((r, i) => (
            <div key={i} className={`rounded-xl p-1 text-center text-[11px] font-bold border-2 ${i === today ? 'border-ink bg-sun-pale' : i < today ? 'border-transparent bg-leaf-pale' : 'border-line bg-surface'}`}>
              <div aria-hidden>{i < today || (i === today && state.daily.chestClaimed) ? '✅' : i === 6 ? '💎' : '🎁'}</div>
              <div className="flex items-center justify-center gap-0.5"><Coin size={10} />{r.coins}</div>
              {r.gems ? <div className="flex items-center justify-center gap-0.5"><Gem size={10} />{r.gems}</div> : null}
            </div>
          ))}
        </div>
        <p className="text-xs text-soft mb-2">{t('quests.chestCalendar')}</p>
        {state.daily.chestClaimed ? (
          <p className="font-bold text-center">{t('quests.chestDone')}</p>
        ) : (
          <motion.button className="btn-sun w-full" animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} onClick={() => claim({ type: 'chest.claim' })}>
            🎁 {t('quests.chestOpen')}
          </motion.button>
        )}
        <p className="text-sm mt-3">🧊 {t('quests.freezes', { n: state.streak.freezes })} <span className="text-soft">· {t('quests.freezesHelp')}</span></p>
      </section>

      <section className="space-y-2">
        <h2 className="font-extrabold text-lg">📜 {t('quests.daily')}</h2>
        {state.daily.quests.map((q) => {
          const def = content.quests.daily.find((d) => d.id === q.id);
          return def ? <QuestCard key={q.id} def={def} entry={q} t={t} tx={tx} onClaim={() => claim({ type: 'quest.claim', questId: q.id })} /> : null;
        })}
      </section>

      {weeklyDef && (
        <section className="space-y-2">
          <h2 className="font-extrabold text-lg">🗓️ {t('quests.weekly')}</h2>
          <QuestCard def={weeklyDef} entry={state.weekly} t={t} tx={tx} onClaim={() => claim({ type: 'quest.claim', questId: weeklyDef.id, board: 'weekly' })} />
        </section>
      )}

      <section className="card p-4">
        <h2 className="font-extrabold text-lg mb-1">🔁 {t('quests.review')}</h2>
        {due.length ? (
          <button className="btn-primary w-full" onClick={() => nav('/review')}>{t('quests.reviewStart', { n: Math.min(5, due.length) })}</button>
        ) : (
          <p className="text-soft">{t('quests.reviewNone')}</p>
        )}
      </section>

      <section className="card p-4">
        <h2 className="font-extrabold text-lg mb-2">👨‍👩‍👧 {t('quests.leaderboard')}</h2>
        <Segmented label={t('quests.leaderboard')} value={lbMode} onChange={setLbMode} options={[{ value: 'top', label: t('quests.lbTop'), icon: '🏅' }, { value: 'improved', label: t('quests.lbImproved'), icon: '📈' }]} />
        {lb && (lb.top.length < 2 ? <p className="text-soft mt-3">{t('quests.lbEmpty')}</p> : (
          <ol className="mt-3 space-y-2">
            {lb[lbMode].map((r, i) => (
              <li key={r.id} className={`flex items-center gap-3 rounded-2xl p-2 ${r.id === active.id ? 'bg-sun-pale' : ''}`}>
                <span className="w-6 text-center font-extrabold">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
                <span className="w-10 h-10 overflow-hidden rounded-xl bg-surface flex justify-center"><Avatar avatar={r.avatar || {}} size={38} /></span>
                <span className="flex-1 font-bold">{r.nickname}{r.id === active.id && ` (${t('quests.you')})`}</span>
                <span className="font-extrabold">{lbMode === 'top' ? `${r.summary.weekXp} XP` : `${r.summary.improvement >= 0 ? '+' : ''}${r.summary.improvement}`}</span>
              </li>
            ))}
          </ol>
        ))}
      </section>
    </div>
  );
}
