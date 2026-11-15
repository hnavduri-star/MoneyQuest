import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useT } from '../lib/i18n.js';
import { play, buzz } from '../lib/sound.js';

/** Tap an item, then tap the bin it belongs in. Wrong bins just wiggle; you can always try again. */
export default function SortStep({ step, solved, onCorrect, onWrong }) {
  const { t, tx } = useT();
  const [left, setLeft] = useState(() => step.items.map((_, i) => i).sort(() => Math.random() - 0.5));
  const [placed, setPlaced] = useState({});
  const [sel, setSel] = useState(null);
  const [shake, setShake] = useState(null);
  const [hadMistake, setHadMistake] = useState(false);
  const current = sel ?? left[0];

  const drop = (binId) => {
    if (current == null) return;
    const item = step.items[current];
    if (item.bin === binId) {
      play('correct');
      const rest = left.filter((i) => i !== current);
      setPlaced((p) => ({ ...p, [binId]: [...(p[binId] || []), current] }));
      setLeft(rest);
      setSel(null);
      if (!rest.length) onCorrect({ mistakes: hadMistake });
    } else {
      play('wrong');
      buzz(15);
      setShake(binId);
      setTimeout(() => setShake(null), 400);
      if (!hadMistake) onWrong({ quiet: true });
      setHadMistake(true);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-extrabold mb-1 leading-snug">{tx(step.prompt)}</h2>
      <p className="text-sm text-soft mb-3">{t('lesson.sortTap')}</p>
      <div className="flex flex-wrap gap-2 justify-center min-h-[64px] mb-3">
        <AnimatePresence>
          {left.map((i) => (
            <motion.button
              key={i}
              layout
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => {
                play('tap');
                setSel(i);
              }}
              aria-pressed={current === i}
              className={`min-h-[56px] px-3 rounded-2xl border-4 font-bold flex items-center gap-2 bg-white ${current === i ? 'border-ink shadow-pop -translate-y-1' : 'border-line'}`}
            >
              <span className="text-2xl" aria-hidden>{step.items[i].emoji}</span>
              {tx(step.items[i].text)}
            </motion.button>
          ))}
        </AnimatePresence>
        {solved && <p className="font-extrabold text-leaf text-lg">✅ {t('lesson.sortDone')}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {step.bins.map((b) => (
          <motion.button key={b.id} type="button" disabled={solved} animate={shake === b.id ? { x: [0, -10, 10, -6, 0] } : {}} onClick={() => drop(b.id)} className="min-h-[150px] rounded-blob border-4 border-dashed border-ink/30 bg-white p-2 flex flex-col items-center">
            <span className="text-4xl" aria-hidden>{b.emoji}</span>
            <span className="font-extrabold text-lg">{tx(b.label)}</span>
            <span className="flex flex-wrap justify-center gap-1 mt-1">
              {(placed[b.id] || []).map((i) => (
                <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-2xl" title={tx(step.items[i].text)}>
                  {step.items[i].emoji}
                </motion.span>
              ))}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
