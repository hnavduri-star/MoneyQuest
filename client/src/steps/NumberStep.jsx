import { useState } from 'react';
import { useT } from '../lib/i18n.js';
import { parseNumber, currencySymbol } from '../lib/money.js';
import { useGame } from '../store.jsx';
import { play } from '../lib/sound.js';

/** Type-a-number question with a big on-screen keypad (works without the phone keyboard). */
export default function NumberStep({ step, solved, onCorrect, onWrong }) {
  const { t, tx, lang } = useT();
  const { currency } = useGame();
  const [val, setVal] = useState('');
  const unit = step.unitText ? tx(step.unitText) : step.money ? currencySymbol(currency, lang) : step.unit === 'percent' ? '%' : step.unit === 'weeks' ? t('common.weeks') : '';
  const check = () => {
    const n = parseNumber(val);
    if (Number.isNaN(n)) return;
    if (Math.abs(n - Number(step.answer)) <= (Number(step.tolerance) || 0)) onCorrect();
    else onWrong();
  };
  const press = (k) => {
    play('tap');
    if (k === '⌫') setVal((v) => v.slice(0, -1));
    else if (val.length < 9) setVal((v) => v + k);
  };
  return (
    <div>
      <h2 className="text-xl font-extrabold mb-4 leading-snug">{tx(step.prompt)}</h2>
      <div className="flex items-center justify-center gap-2 mb-4" dir="ltr">
        <input
          inputMode="decimal"
          aria-label={t('lesson.yourAnswer')}
          className={`w-44 min-h-[64px] rounded-2xl border-4 text-center text-3xl font-extrabold ${solved ? 'border-leaf bg-leaf-pale' : 'border-line bg-white'}`}
          value={val}
          disabled={solved}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
        />
        {unit && <span className="text-2xl font-extrabold">{unit}</span>}
      </div>
      {!solved && (
        <>
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto" dir="ltr">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => (
              <button key={k} type="button" onClick={() => press(k)} className="min-h-[56px] rounded-2xl bg-white border-2 border-line text-2xl font-extrabold shadow-pop active:translate-y-[2px]" aria-label={k === '⌫' ? 'delete' : k}>
                {k}
              </button>
            ))}
          </div>
          <button className="btn-primary w-full mt-4" disabled={val === ''} onClick={check}>
            {t('lesson.check')}
          </button>
        </>
      )}
    </div>
  );
}
