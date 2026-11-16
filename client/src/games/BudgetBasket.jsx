import { useState } from 'react';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { Progress } from '../components/ui.jsx';
import { shuffle } from './helpers.js';
import { play } from '../lib/sound.js';

/** Budget Basket: pick items to get as close to the budget as possible without going over, with at least 2 needs. */
export default function BudgetBasket({ game, onFinish }) {
  const { content } = useGame();
  const { t, tx, money } = useT();
  const make = () => ({ budget: 20 + Math.floor(Math.random() * 4) * 5, shelf: shuffle(content.arcade.shelf).slice(0, 10) });
  const [r, setR] = useState(make);
  const [basket, setBasket] = useState([]);
  const [n, setN] = useState(0);
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState(null);
  const sum = basket.reduce((a, i) => a + r.shelf[i].price, 0);
  const needs = basket.filter((i) => r.shelf[i].need).length;
  const over = sum > r.budget;
  const check = () => {
    const pts = over || needs < 2 ? 0 : Math.round((sum / r.budget) * 100);
    play(pts >= 90 ? 'coin' : pts ? 'correct' : 'wrong');
    setResult({ pts, reason: over ? 'over' : needs < 2 ? 'needs' : pts === 100 ? 'perfect' : 'ok' });
  };
  const next = () => {
    const tot = total + result.pts;
    if (n + 1 >= game.rounds) return onFinish({ score: tot, stars: tot >= game.stars[2] ? 3 : tot >= game.stars[1] ? 2 : 1, summary: t('arcade.basketScore', { n: tot, max: game.rounds * 100 }) });
    setTotal(tot);
    setN(n + 1);
    setR(make());
    setBasket([]);
    setResult(null);
  };
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-soft text-center">{t('arcade.round', { n: n + 1, total: game.rounds })}</p>
      <div className={`card p-4 ${over ? 'bg-ember-pale' : ''}`}>
        <div className="flex justify-between font-extrabold"><span>🧺 {money(sum)}</span><span>{t('arcade.budget')}: {money(r.budget)}</span></div>
        <Progress value={Math.min(1, sum / r.budget)} height={12} color={over ? '#D55E00' : '#009E73'} />
        <p className="text-sm mt-1">{over ? `⚠️ ${t('arcade.overBudget')}` : t('arcade.left', { n: money(r.budget - sum) })} · 🏠 {t('arcade.needsCount', { n: needs })}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {r.shelf.map((it, i) => {
          const inB = basket.includes(i);
          return (
            <button key={i} disabled={!!result} onClick={() => { play('tap'); setBasket(inB ? basket.filter((x) => x !== i) : [...basket, i]); }} className={`min-h-[64px] rounded-2xl border-2 px-3 flex items-center gap-2 text-start ${inB ? 'border-ink bg-sky-pale' : 'border-line bg-surface'}`}>
              <span className="text-3xl" aria-hidden>{it.emoji}</span>
              <span className="flex-1"><span className="font-bold block leading-tight">{tx(it.name)}</span><span className="text-sm">{money(it.price)}{it.need ? ' · 🏠' : ''}</span></span>
              {inB && <span aria-label="in basket">✓</span>}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-soft text-center">🏠 = {t('arcade.needLabel')}</p>
      {result ? (
        <div className={`card p-3 text-center ${result.pts ? 'bg-leaf-pale' : 'bg-sun-pale'}`} role="status">
          <p className="font-extrabold">{t(`arcade.basket.${result.reason}`)} +{result.pts}</p>
          <button className="btn-primary w-full mt-2" onClick={next}>{t('common.next')}</button>
        </div>
      ) : (
        <button className="btn-leaf w-full" disabled={!basket.length} onClick={check}>{t('arcade.checkout')}</button>
      )}
    </div>
  );
}
