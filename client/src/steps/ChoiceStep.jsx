import { useState } from 'react';
import { motion } from 'framer-motion';
import { useT } from '../lib/i18n.js';
import { play } from '../lib/sound.js';

/** Multiple choice. Options are shuffled once per mount. Wrong picks are greyed out (never punished). */
export default function ChoiceStep({ step, solved, onCorrect, onWrong }) {
  const { tx } = useT();
  const [order] = useState(() => step.options.map((_, i) => i).sort(() => Math.random() - 0.5));
  const [tried, setTried] = useState([]);
  const [picked, setPicked] = useState(null);
  return (
    <div>
      <h2 className="text-xl font-extrabold mb-4 leading-snug">{tx(step.prompt)}</h2>
      <div className="grid gap-3">
        {order.map((i) => {
          const o = step.options[i];
          const wrong = tried.includes(i);
          const right = solved && picked === i;
          return (
            <motion.button
              key={i}
              type="button"
              disabled={solved || wrong}
              animate={wrong ? { x: [0, -8, 8, -4, 0] } : right ? { scale: [1, 1.04, 1] } : {}}
              onClick={() => {
                play('tap');
                setPicked(i);
                if (o.correct) onCorrect();
                else {
                  setTried((t) => [...t, i]);
                  onWrong();
                }
              }}
              className={`min-h-[60px] w-full rounded-2xl border-4 px-4 py-3 text-start text-lg font-bold flex items-center gap-3 transition ${right ? 'border-leaf bg-leaf-pale' : wrong ? 'border-line bg-black/5 line-through decoration-2' : 'border-line bg-white active:border-ink'}`}
            >
              {o.emoji && <span className="text-3xl" aria-hidden>{o.emoji}</span>}
              <span className="flex-1">{tx(o.text)}</span>
              {right && <span aria-label="correct">✅</span>}
              {wrong && <span aria-label="not this one">✖️</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
