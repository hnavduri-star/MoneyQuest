import { useState } from 'react';
import { useT } from '../lib/i18n.js';
import { currencySymbol } from '../lib/money.js';
import { useGame } from '../store.jsx';

/** Estimate on a slider: close enough (within the tolerance) counts. Great for "about how much?" thinking. */
export default function EstimateStep({ step, solved, onCorrect, onWrong }) {
  const { t, tx, money, lang } = useT();
  const { currency } = useGame();
  const mid = Math.round((step.min + step.max) / 2 / (step.step || 1)) * (step.step || 1);
  const [v, setV] = useState(mid);
  const fmt = (n) => (step.money ? money(n) : `${n}${step.unitText ? ' ' + tx(step.unitText) : ''}`);
  const check = () => (Math.abs(v - step.answer) <= (step.tolerance || 0) ? onCorrect() : onWrong());
  return (
    <div>
      <h2 className="text-xl font-extrabold mb-4 leading-snug">{tx(step.prompt)}</h2>
      <div className="card p-4">
        <p className="text-center text-4xl font-extrabold tabular-nums mb-2" aria-live="polite">{fmt(v)}</p>
        <input type="range" className="w-full h-10 accent-[var(--theme)]" min={step.min} max={step.max} step={step.step || 1} value={v} disabled={solved} onChange={(e) => setV(Number(e.target.value))} aria-label={t('lesson.yourAnswer')} aria-valuetext={fmt(v)} />
        <div className="flex justify-between text-xs text-soft font-bold" dir="ltr">
          <span>{step.money ? money(step.min) : step.min}</span>
          <span>{step.money ? money(step.max) : step.max}</span>
        </div>
        {step.money && <span className="sr-only">{currencySymbol(currency, lang)}</span>}
      </div>
      {!solved && <button className="btn-primary w-full mt-4" onClick={check}>{t('lesson.check')}</button>}
    </div>
  );
}
