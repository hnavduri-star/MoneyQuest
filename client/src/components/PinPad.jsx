import { useState } from 'react';
import { play } from '../lib/sound.js';

/** Big-button 4-digit PIN entry. */
export default function PinPad({ onDone, error }) {
  const [pin, setPin] = useState('');
  const press = (d) => {
    if (pin.length >= 4) return;
    play('tap');
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        onDone(next);
        setPin('');
      }, 120);
    }
  };
  return (
    <div className="flex flex-col items-center gap-4" dir="ltr">
      <div className="flex gap-3" aria-live="polite" aria-label={`${pin.length} of 4`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`w-5 h-5 rounded-full border-2 border-ink ${i < pin.length ? 'bg-ink' : ''}`} />
        ))}
      </div>
      {error && <p className="text-ember font-bold text-center" role="alert">⚠️ {error}</p>}
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) =>
          d === '' ? (
            <span key={i} />
          ) : (
            <button key={i} type="button" className="w-[72px] h-[64px] rounded-2xl bg-surface border-2 border-line text-2xl font-extrabold shadow-pop active:translate-y-[2px]" onClick={() => (d === '⌫' ? setPin(pin.slice(0, -1)) : press(d))} aria-label={d === '⌫' ? 'delete' : d}>
              {d}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
