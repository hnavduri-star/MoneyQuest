import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { pick, rnd, r2 } from './helpers.js';
import { play } from '../lib/sound.js';

/** Market Day: 10 days of changing fruit prices and news. Buy low, sell high; whatever you hold is sold on the last day. */
export default function MarketDay({ game, onFinish }) {
  const { content } = useGame();
  const { t, tx, money } = useT();
  const m = content.arcade.market;
  const [day, setDay] = useState(1);
  const [cash, setCash] = useState(m.startCash);
  const [hold, setHold] = useState(Object.fromEntries(m.products.map((p) => [p.id, 0])));
  const [prices, setPrices] = useState(Object.fromEntries(m.products.map((p) => [p.id, p.price])));
  const [history, setHistory] = useState(Object.fromEntries(m.products.map((p) => [p.id, [p.price]])));
  const [news, setNews] = useState(m.news[m.news.length - 1]);
  const trade = (id, qty) => {
    const price = prices[id];
    if (qty > 0 && cash < price * qty) return play('wrong');
    if (qty < 0 && hold[id] < -qty) return play('wrong');
    play(qty > 0 ? 'tap' : 'coin');
    setCash(r2(cash - price * qty));
    setHold({ ...hold, [id]: hold[id] + qty });
  };
  const nextDay = () => {
    if (day >= game.days) {
      const final = r2(cash + m.products.reduce((a, p) => a + hold[p.id] * prices[p.id], 0));
      const profit = r2(final - m.startCash);
      return onFinish({ score: Math.max(0, Math.round(profit)), stars: profit >= game.stars[2] ? 3 : profit >= game.stars[1] ? 2 : 1, summary: profit >= 0 ? t('arcade.profit', { n: money(profit) }) : t('arcade.loss', { n: money(-profit) }) });
    }
    const n = pick(m.news);
    const np = Object.fromEntries(m.products.map((p) => [p.id, r2(Math.max(1, prices[p.id] * rnd(0.85, 1.18) * (n.effect[p.id] || 1)))]));
    setNews(n);
    setPrices(np);
    setHistory(Object.fromEntries(m.products.map((p) => [p.id, [...history[p.id], np[p.id]]])));
    setDay(day + 1);
  };
  const worth = r2(cash + m.products.reduce((a, p) => a + hold[p.id] * prices[p.id], 0));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="card py-2"><div className="text-xs font-bold">{t('arcade.day')}</div><div className="text-xl font-extrabold">{day}/{game.days}</div></div>
        <div className="card py-2"><div className="text-xs font-bold">{t('arcade.cash')}</div><div className="text-lg font-extrabold">{money(cash)}</div></div>
        <div className="card py-2"><div className="text-xs font-bold">{t('arcade.worth')}</div><div className={`text-lg font-extrabold ${worth >= m.startCash ? 'text-leaf' : 'text-ember'}`}>{money(worth)}</div></div>
      </div>
      <motion.p key={day} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="card p-3 font-bold" role="status">{news.emoji} {tx(news.text)}</motion.p>
      {m.products.map((p) => {
        const h = history[p.id];
        const max = Math.max(...h);
        const up = h.length > 1 && h[h.length - 1] > h[h.length - 2];
        return (
          <section key={p.id} className="card p-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-lg">{p.emoji} {tx(p.name)}</span>
              <span className="font-extrabold">{money(prices[p.id])} {h.length > 1 ? (up ? '▲' : '▼') : ''}</span>
            </div>
            <div className="flex items-end gap-1 h-10 my-1" aria-hidden>
              {h.map((v, i) => <div key={i} className={`rounded-t ${i === h.length - 1 ? 'bg-sun' : 'bg-sky/50'}`} style={{ width: `${100 / (game.days + 1) - 1}%`, height: `${Math.max(15, (v / max) * 100)}%` }} />)}
            </div>
            <p className="text-sm">{t('arcade.youHave', { n: hold[p.id] })}</p>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <button className="btn-ghost min-h-[44px] text-sm" onClick={() => trade(p.id, 1)}>+1</button>
              <button className="btn-ghost min-h-[44px] text-sm" onClick={() => trade(p.id, 5)}>+5</button>
              <button className="btn-ghost min-h-[44px] text-sm" onClick={() => trade(p.id, -1)}>−1</button>
              <button className="btn-ghost min-h-[44px] text-sm" onClick={() => trade(p.id, -hold[p.id])} disabled={!hold[p.id]}>{t('arcade.sellAll')}</button>
            </div>
          </section>
        );
      })}
      <button className="btn-primary w-full" onClick={nextDay}>{day >= game.days ? t('arcade.closeMarket') : t('arcade.nextDay')} →</button>
      <p className="text-xs text-soft text-center">{t('arcade.marketTip')}</p>
    </div>
  );
}
