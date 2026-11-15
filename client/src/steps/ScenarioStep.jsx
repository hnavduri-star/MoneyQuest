import { useState } from 'react';
import { motion } from 'framer-motion';
import { useT } from '../lib/i18n.js';
import { play } from '../lib/sound.js';

/** A short story choice. Every option is allowed; each one shows what happens next. Choices are remembered for Story Mode. */
export default function ScenarioStep({ step, onChoose }) {
  const { tx } = useT();
  const [pick, setPick] = useState(null);
  const o = pick !== null ? step.options[pick] : null;
  return (
    <div>
      <h2 className="text-xl font-extrabold mb-4 leading-snug">{tx(step.prompt)}</h2>
      <div className="grid gap-3">
        {step.options.map((opt, i) => (
          <button key={i} type="button" disabled={pick !== null} onClick={() => { play('tap'); setPick(i); onChoose(i, opt); }} className={`min-h-[60px] rounded-2xl border-2 px-4 py-3 text-start text-lg font-bold flex items-center gap-3 ${pick === i ? 'border-ink bg-sky-pale' : 'border-line bg-surface'} ${pick !== null && pick !== i ? 'opacity-50' : ''}`}>
            <span className="text-3xl" aria-hidden>{opt.emoji}</span>
            <span className="flex-1">{tx(opt.text)}</span>
          </button>
        ))}
      </div>
      {o && (
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`card p-4 mt-4 ${o.wise ? 'bg-leaf-pale' : 'bg-sun-pale'}`} role="status">
          <p className="font-bold">{o.wise ? '🌟 ' : '🤔 '}{tx(o.outcome)}</p>
        </motion.div>
      )}
    </div>
  );
}
