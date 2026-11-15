import { useState } from 'react';
import { motion } from 'framer-motion';
import { useT, PriceScale } from '../lib/i18n.js';
import { SIMS } from '../sims/index.jsx';

/**
 * Interactive explainer. A sim with params.target is a challenge: the child must reach the goal
 * (e.g. balance the budget, make the café profitable) before the level moves on.
 */
export default function SimStep({ step, solved, onCorrect }) {
  const { t, tx } = useT();
  const Sim = SIMS[step.sim];
  const goal = !!step.params?.target;
  const [met, setMet] = useState(false);
  const onGoal = (ok) => {
    setMet(ok);
    if (ok && goal && !solved) onCorrect?.();
  };
  return (
    <div>
      {step.text && <p className="text-lg font-bold mb-3">{tx(step.text)}</p>}
      {goal && (
        <motion.p layout className={`rounded-2xl p-3 mb-3 font-bold ${met || solved ? 'bg-leaf-pale' : 'bg-sun-pale'}`} role="status">
          {met || solved ? '✅' : '🎯'} {tx(step.goalText)}
        </motion.p>
      )}
      <PriceScale.Provider value={step.priceScale || 1}>
        <div className="card p-4">{Sim ? <Sim params={step.params || {}} onGoal={goal ? onGoal : undefined} /> : <p>Missing sim: {step.sim}</p>}</div>
      </PriceScale.Provider>
      <p className="text-sm text-soft mt-2">👆 {goal ? (met || solved ? t('sim.goalMet') : t('sim.goalTodo')) : t('lesson.explore')}</p>
    </div>
  );
}
