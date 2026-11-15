import { useT } from '../lib/i18n.js';
import { SIMS } from '../sims/index.jsx';

export default function SimStep({ step }) {
  const { t, tx } = useT();
  const Sim = SIMS[step.sim];
  return (
    <div>
      {step.text && <p className="text-lg font-bold mb-3">{tx(step.text)}</p>}
      <div className="card p-4">{Sim ? <Sim params={step.params || {}} /> : <p>Missing sim: {step.sim}</p>}</div>
      <p className="text-sm text-soft mt-2">👆 {t('lesson.explore')}</p>
    </div>
  );
}
