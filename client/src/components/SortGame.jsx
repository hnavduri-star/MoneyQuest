import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { pickAge } from '@engine/text.js';
import { starsFromScore, comboMultiplier } from '@engine/scoring.js';
import { play, buzz } from '../lib/sound.js';
import PlayFrame from './PlayFrame.jsx';
import Results from './Results.jsx';
import Mascot from './Mascot.jsx';
import { Coin } from './ui.jsx';

const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

/** Timed sorting mini-game: combos, power-ups (paid with earned coins) and no penalties for mistakes. */
export default function SortGame({ world, node }) {
  const { age, dispatch, content, state } = useGame();
  const { t, tx } = useT();
  const cfg = node.config;
  const total = pickAge(cfg.seconds, age) || 40;
  const [phase, setPhase] = useState('ready');
  const [time, setTime] = useState(total);
  const [queue, setQueue] = useState(() => shuffle(cfg.items.map((_, i) => i)));
  const [correct, setCorrect] = useState(0);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [boost, setBoost] = useState(false);
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState(null);
  const [run, setRun] = useState(0);
  const meta = content.worldIndex.find((w) => w.id === world.id);
  const timer = useRef(null);
  const current = cfg.items[queue[0]];
  const p = content.rewards.powerups;

  useEffect(() => {
    if (phase !== 'play') return;
    timer.current = setInterval(() => setTime((s) => s - 1), 1000);
    return () => clearInterval(timer.current);
  }, [phase]);
  useEffect(() => {
    if (phase === 'play' && time <= 5 && time > 0) play('tick');
    if (phase === 'play' && time <= 0) end();
  }, [time]); // eslint-disable-line react-hooks/exhaustive-deps

  const end = () => {
    clearInterval(timer.current);
    setPhase('over');
    const stars = starsFromScore(correct, cfg.stars);
    const accuracy = correct / Math.max(1, correct + mistakes);
    const answers = (node.concepts || []).map((c) => ({ concept: c, correct: accuracy >= 0.7 }));
    const effects = dispatch({ type: 'level.completed', worldId: world.id, nodeId: node.id, stars, mistakes, score: points, combo: best, comboBonus: Math.min(15, Math.floor(best / 3) * 3), coinBoost: boost ? 2 : 1, answers });
    setTimeout(() => setResult({ stars, effects }), 900);
  };

  const sort = (bin) => {
    if (phase !== 'play' || !current) return;
    setReveal(false);
    if (current.bin === bin) {
      const c = combo + 1;
      play(c % 3 === 0 ? 'coin' : 'correct');
      buzz(15);
      setCombo(c);
      setBest((b) => Math.max(b, c));
      setCorrect((n) => n + 1);
      setPoints((n) => n + Math.round(10 * comboMultiplier(c)));
      setFlash('ok');
      setQueue((q) => (q.length > 1 ? q.slice(1) : shuffle(cfg.items.map((_, i) => i))));
    } else {
      play('wrong');
      setCombo(0);
      setMistakes((m) => m + 1);
      setFlash('no');
      setMsg(`${current.emoji} → ${tx(cfg.bins.find((b) => b.id === current.bin).label)}`);
      setQueue((q) => [...q.slice(1), q[0]]);
    }
    setTimeout(() => setFlash(null), 350);
  };

  const usePower = (id) => {
    const eff = dispatch({ type: 'powerup.used', powerup: id });
    if (eff[0]?.type === 'rejected') {
      setMsg(t('shop.notEnough'));
      return;
    }
    play('coin');
    if (id === 'slowTime') setTime((s) => s + (p.slowTime.seconds || 8));
    if (id === 'doubleCoins') setBoost(true);
    if (id === 'reveal') setReveal(true);
  };

  const restart = () => {
    setRun((r) => r + 1);
    setPhase('ready');
    setTime(total);
    setQueue(shuffle(cfg.items.map((_, i) => i)));
    setCorrect(0);
    setPoints(0);
    setCombo(0);
    setBest(0);
    setMistakes(0);
    setBoost(false);
    setMsg('');
    setResult(null);
  };

  const extra = useMemo(() => result && <p className="font-bold">{t('game.sorted', { n: correct })} · ⚡ {t('game.combo', { n: best })}</p>, [result]); // eslint-disable-line react-hooks/exhaustive-deps
  if (result) return <Results key={run} world={world} node={node} stars={result.stars} effects={result.effects} onReplay={restart} extra={extra} />;

  return (
    <PlayFrame world={world} progress={phase === 'ready' ? 0 : 1 - time / total} color={meta.color}>
      {phase === 'ready' ? (
        <div className="flex flex-col items-center text-center gap-4 pt-4">
          <h1 className="title text-3xl">{tx(node.title)}</h1>
          {cfg.prompt && <p className="text-lg font-bold">{tx(cfg.prompt)}</p>}
          <Mascot text={t('game.ready')} mood="excited" size={90} />
          <p className="text-soft font-bold">⭐⭐ {cfg.stars[1]}+ · ⭐⭐⭐ {cfg.stars[2]}+</p>
          <button className="btn-primary w-full text-xl" style={{ background: meta.color }} onClick={() => setPhase('play')}>
            ▶ {t('game.start')} ({total}s)
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className={`card py-2 ${time <= 5 ? 'bg-ember-pale' : ''}`}>
              <div className="text-xs font-bold">⏱ {t('game.time')}</div>
              <div className="text-2xl font-extrabold" aria-live="off">{Math.max(0, time)}</div>
            </div>
            <div className="card py-2">
              <div className="text-xs font-bold">{t('game.score')}</div>
              <div className="text-2xl font-extrabold">{points}</div>
            </div>
            <div className="card py-2">
              <div className="text-xs font-bold">⚡</div>
              <motion.div key={combo} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="text-2xl font-extrabold">
                x{comboMultiplier(combo)}
              </motion.div>
            </div>
          </div>
          <div className="relative h-44 flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              {phase === 'play' && current && (
                <motion.div key={`${queue[0]}-${correct}-${mistakes}`} initial={{ y: -60, opacity: 0, scale: 0.7 }} animate={{ y: 0, opacity: 1, scale: 1, x: flash === 'no' ? [0, -12, 12, 0] : 0 }} exit={{ scale: 0.4, opacity: 0 }} className={`card px-6 py-4 flex flex-col items-center border-4 ${flash === 'ok' ? 'border-leaf' : flash === 'no' ? 'border-sun' : 'border-line'}`}>
                  <span className="text-6xl" aria-hidden>{current.emoji}</span>
                  <span className="text-xl font-extrabold">{tx(current.text)}</span>
                </motion.div>
              )}
              {phase === 'over' && <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} className="title text-3xl">⏰ {t('game.over')}</motion.p>}
            </AnimatePresence>
          </div>
          <p className="text-center font-bold min-h-[1.5rem]" aria-live="polite">{msg}</p>
          <div className="grid grid-cols-2 gap-3">
            {cfg.bins.map((b) => (
              <button key={b.id} onClick={() => sort(b.id)} disabled={phase !== 'play'} className={`min-h-[110px] rounded-blob border-4 bg-white flex flex-col items-center justify-center font-extrabold text-xl shadow-pop active:translate-y-[2px] ${reveal && current?.bin === b.id ? 'border-leaf ring-4 ring-leaf/40' : 'border-line'}`}>
                <span className="text-4xl" aria-hidden>{b.emoji}</span>
                {tx(b.label)}
                {reveal && current?.bin === b.id && <span className="text-sm">👀</span>}
              </button>
            ))}
          </div>
          <div>
            <p className="text-xs font-bold text-soft mb-1">{t('game.powerups')}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['slowTime', '⏳', t('game.slowTime')],
                ['doubleCoins', '💰', t('game.doubleCoins')],
                ['reveal', '👀', t('game.reveal')],
              ].map(([id, icon, label]) => (
                <button key={id} disabled={phase !== 'play' || (id === 'doubleCoins' && boost) || state.coins < p[id].cost} onClick={() => usePower(id)} className="min-h-[56px] rounded-2xl bg-white border-2 border-line font-bold text-sm flex flex-col items-center justify-center">
                  <span>{icon} {label}</span>
                  <span className="flex items-center gap-1 text-xs">
                    <Coin size={12} /> {p[id].cost}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </PlayFrame>
  );
}
