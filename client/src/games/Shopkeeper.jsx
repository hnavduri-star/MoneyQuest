import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { makeMoney } from '../lib/money.js';
import Cash from './Cash.jsx';
import { denominations, pick, r2, rnd } from './helpers.js';
import { play } from '../lib/sound.js';

const CUSTOMERS = ['🧕', '👨‍🦱', '👵', '🧑‍🦰', '👲', '👩‍🦳', '🧔', '👧'];
const ITEMS = ['🥤', '📒', '🍪', '🧃', '🖊️', '🍌', '🧁', '🎈'];

/** Shopkeeper: the customer pays with a note; build the right change from notes and coins. */
export default function Shopkeeper({ game, onFinish }) {
  const { city, age, lang } = useGame();
  const { t } = useT();
  const cur = useMemo(() => makeMoney(city.currency, lang), [city.currency, lang]);
  const d = useMemo(() => denominations(city, age), [city, age]);
  const make = () => {
    const payWith = pick(d.notes.filter((n) => n > d.unit * 4).slice(0, 4));
    const step = Math.max(d.unit, age === '7-9' ? 1 : d.unit);
    const price = r2(Math.max(step, Math.round(rnd(payWith * 0.2, payWith * 0.95) / step) * step));
    return { payWith, price, change: r2(payWith - price), who: pick(CUSTOMERS), item: pick(ITEMS) };
  };
  const [r, setR] = useState(make);
  const [tray, setTray] = useState([]);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState(null);
  const given = r2(tray.reduce((a, p) => a + p.v, 0));
  const pieces = [...d.notes.filter((x) => x < r.payWith).map((v) => ({ v, kind: 'note' })), ...d.coins.map((v) => ({ v, kind: 'coin' }))];
  const next = (ok) => {
    const s = score + (ok ? 1 : 0);
    if (n + 1 >= game.rounds) return onFinish({ score: s, stars: s >= game.stars[2] ? 3 : s >= game.stars[1] ? 2 : 1, summary: t('arcade.rightChange', { n: s, total: game.rounds }) });
    setScore(s);
    setN(n + 1);
    setR(make());
    setTray([]);
    setMsg(null);
  };
  const give = () => {
    if (Math.abs(given - r.change) < 0.001) {
      play('coin');
      setMsg({ ok: true });
      setTimeout(() => next(true), 700);
    } else {
      play('wrong');
      setMsg({ ok: false });
    }
  };
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-soft text-center">{t('arcade.round', { n: n + 1, total: game.rounds })}</p>
      <div className="card p-4 text-center">
        <div className="text-5xl" aria-hidden>{r.who} {r.item}</div>
        <p className="font-bold mt-2">{t('arcade.costs', { price: cur(r.price) })}</p>
        <div className="flex justify-center items-center gap-2 my-2"><span className="text-sm">{t('arcade.paysWith')}</span><Cash value={r.payWith} kind="note" label={cur(r.payWith)} /></div>
      </div>
      <div className="card p-3 min-h-[80px]">
        <p className="text-xs font-bold text-soft mb-1">{t('arcade.yourChange')}: <span className="text-ink text-base">{cur(given)}</span></p>
        <div className="flex flex-wrap gap-1">
          {tray.map((p, i) => <Cash key={i} value={p.v} kind={p.kind} label={cur(p.v)} size={0.8} onClick={() => setTray(tray.filter((_, k) => k !== i))} />)}
        </div>
      </div>
      <p className="text-xs text-soft text-center">{t('arcade.tapToAdd')}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {pieces.map((p) => <Cash key={p.kind + p.v} value={p.v} kind={p.kind} label={cur(p.v)} size={0.9} onClick={() => { play('tap'); setTray([...tray, p]); }} />)}
      </div>
      {msg && (
        <motion.p initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`card p-3 font-bold text-center ${msg.ok ? 'bg-leaf-pale' : 'bg-sun-pale'}`} role="status">
          {msg.ok ? `✅ ${t('arcade.correctChange')}` : `💡 ${t('arcade.changeHint', { pay: cur(r.payWith), price: cur(r.price), change: cur(r.change) })}`}
        </motion.p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {msg && !msg.ok ? <button className="btn-ghost" onClick={() => next(false)}>{t('arcade.nextCustomer')}</button> : <button className="btn-ghost" onClick={() => setTray([])}>{t('arcade.clear')}</button>}
        <button className="btn-leaf" disabled={!tray.length || msg?.ok} onClick={give}>{t('arcade.giveChange')}</button>
      </div>
    </div>
  );
}
