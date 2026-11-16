import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { makeMoney } from '../lib/money.js';
import Cash from './Cash.jsx';
import { denominations, pick, shuffle, r2 } from './helpers.js';
import { play, buzz } from '../lib/sound.js';

/** Count the Cash: add up notes and coins, pick the right total. 60 seconds, combos for streaks. */
export default function CountCash({ game, onFinish }) {
  const { city, age, lang } = useGame();
  const { t } = useT();
  const cur = useMemo(() => makeMoney(city.currency, lang), [city.currency, lang]);
  const d = useMemo(() => denominations(city, age), [city, age]);
  const make = () => {
    const n = age === '7-9' ? 2 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 3);
    const pieces = Array.from({ length: n }, () => (Math.random() < 0.6 || !d.coins.length ? { v: pick(d.notes), kind: 'note' } : { v: pick(d.coins), kind: 'coin' }));
    const total = r2(pieces.reduce((a, p) => a + p.v, 0));
    const wrong = new Set();
    while (wrong.size < 2) {
      const w = r2(total + (Math.random() < 0.5 ? -1 : 1) * pick([...d.notes.slice(0, 3), ...d.coins]));
      if (w > 0 && w !== total) wrong.add(w);
    }
    return { pieces, total, options: shuffle([total, ...wrong]) };
  };
  const [round, setRound] = useState(make);
  const [time, setTime] = useState(game.seconds);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState(null);
  const ended = useRef(false);
  useEffect(() => {
    const id = setInterval(() => setTime((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (time <= 0 && !ended.current) {
      ended.current = true;
      onFinish({ score, stars: score >= game.stars[2] ? 3 : score >= game.stars[1] ? 2 : 1, summary: t('arcade.counted', { n: score }) });
    }
  }, [time]); // eslint-disable-line react-hooks/exhaustive-deps
  const answer = (v) => {
    if (time <= 0) return;
    if (v === round.total) {
      play(combo >= 2 ? 'coin' : 'correct');
      buzz(15);
      setScore((s) => s + 1);
      setCombo((c) => c + 1);
      setFlash('ok');
    } else {
      play('wrong');
      setCombo(0);
      setFlash('no');
    }
    setTimeout(() => {
      setFlash(null);
      setRound(make());
    }, 350);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className={`card py-2 ${time <= 10 ? 'bg-ember-pale' : ''}`}><div className="text-xs font-bold">⏱</div><div className="text-2xl font-extrabold">{Math.max(0, time)}</div></div>
        <div className="card py-2"><div className="text-xs font-bold">{t('game.score')}</div><div className="text-2xl font-extrabold">{score}</div></div>
        <div className="card py-2"><div className="text-xs font-bold">⚡</div><div className="text-2xl font-extrabold">x{combo}</div></div>
      </div>
      <motion.div key={round.total + '-' + score + '-' + time} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1, x: flash === 'no' ? [0, -10, 10, 0] : 0 }} className={`card p-4 min-h-[150px] flex flex-wrap gap-2 justify-center items-center border-4 ${flash === 'ok' ? 'border-leaf' : flash === 'no' ? 'border-ember' : 'border-transparent'}`}>
        {round.pieces.map((p, i) => <Cash key={i} value={p.v} kind={p.kind} label={cur(p.v)} />)}
      </motion.div>
      <p className="text-center font-bold">{t('arcade.howMuch')}</p>
      <div className="grid grid-cols-3 gap-2">
        {round.options.map((o) => <button key={o} className="btn-ghost text-lg" onClick={() => answer(o)}>{cur(o)}</button>)}
      </div>
    </div>
  );
}
