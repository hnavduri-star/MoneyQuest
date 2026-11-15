import { useState } from 'react';
import { motion } from 'framer-motion';
import { useT } from '../lib/i18n.js';
import { play } from '../lib/sound.js';

/** Put items in the right order: tap them one by one. A wrong tap resets gently. Items are listed correct-first in content. */
export default function OrderStep({ step, solved, onCorrect, onWrong }) {
  const { t, tx } = useT();
  const [shuffled] = useState(() => step.items.map((_, i) => i).sort(() => Math.random() - 0.5));
  const [picked, setPicked] = useState([]);
  const [shake, setShake] = useState(null);
  const tap = (i) => {
    if (solved || picked.includes(i)) return;
    if (i === picked.length) {
      play('tap');
      const next = [...picked, i];
      setPicked(next);
      if (next.length === step.items.length) onCorrect();
    } else {
      setShake(i);
      setTimeout(() => setShake(null), 400);
      setPicked([]);
      onWrong();
    }
  };
  return (
    <div>
      <h2 className="text-xl font-extrabold mb-1 leading-snug">{tx(step.prompt)}</h2>
      <p className="text-sm text-soft mb-3">{t('order.help')}</p>
      <ol className="space-y-2 mb-4" aria-label={t('order.yours')}>
        {picked.map((i, k) => (
          <motion.li key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3 rounded-2xl bg-leaf-pale p-3 font-bold">
            <span className="w-8 h-8 rounded-full bg-leaf text-white flex items-center justify-center">{k + 1}</span>
            <span aria-hidden>{step.items[i].emoji}</span> {tx(step.items[i].text)}
          </motion.li>
        ))}
      </ol>
      <div className="grid gap-2">
        {shuffled.filter((i) => !picked.includes(i)).map((i) => (
          <motion.button key={i} type="button" animate={shake === i ? { x: [0, -10, 10, -6, 0] } : {}} onClick={() => tap(i)} className="min-h-[56px] rounded-2xl border border-line bg-surface px-4 text-start font-bold flex items-center gap-3">
            <span className="text-2xl" aria-hidden>{step.items[i].emoji}</span> {tx(step.items[i].text)}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
