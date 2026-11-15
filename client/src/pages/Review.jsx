import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { useDueReviews } from '../lib/hooks.js';
import { stepsForAge } from '@engine/progress.js';
import { hash, dayKey } from '@engine/dates.js';
import { play, buzz } from '../lib/sound.js';
import ChoiceStep from '../steps/ChoiceStep.jsx';
import NumberStep from '../steps/NumberStep.jsx';
import Mascot from '../components/Mascot.jsx';
import Confetti from '../components/Confetti.jsx';
import { Progress, RewardRow } from '../components/ui.jsx';

/** Spaced-repetition review: one question for each skill that's due (max 5). */
export default function Review() {
  const { content, age, dispatch, cityCtx } = useGame();
  const { t, tx } = useT();
  const nav = useNavigate();
  const due = useDueReviews();
  const [questions] = useState(() =>
    due.slice(0, 5).map((concept) => {
      const pool = (content.conceptQuestions[concept] || []).filter((q) => (!q.ages || q.ages.includes(age)) && (!q.regions || q.regions.includes(cityCtx.region)));
      const q = pool[hash(`${concept}|${dayKey()}`) % Math.max(1, pool.length)];
      return q ? { ...stepsForAge({ steps: [q] }, age, cityCtx)[0], worldId: q.worldId } : null;
    }).filter(Boolean),
  );
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [solved, setSolved] = useState(false);
  const [wrongOnce, setWrongOnce] = useState(false);
  const [done, setDone] = useState(null);
  const q = questions[idx];

  const record = (correct) => {
    setAnswers((a) => (a.length > idx ? a : [...a, { concept: q.concept, correct }]));
  };
  const finish = (all) => {
    const effects = dispatch({ type: 'review.completed', answers: all });
    const r = effects.filter((e) => e.type === 'reward' && e.source === 'review.completed').reduce((a, e) => ({ xp: a.xp + e.xp, coins: a.coins + e.coins, gems: a.gems + e.gems }), { xp: 0, coins: 0, gems: 0 });
    setDone(r);
  };
  const next = () => {
    if (idx + 1 >= questions.length) return finish(answers);
    setIdx(idx + 1);
    setSolved(false);
    setWrongOnce(false);
  };

  if (!questions.length && !done)
    return (
      <div className="max-w-app mx-auto p-6 text-center">
        <Mascot text={t('quests.reviewNone')} />
        <button className="btn-primary w-full mt-4" onClick={() => nav('/town')}>{t('results.toTown')}</button>
      </div>
    );
  if (done)
    return (
      <div className="max-w-app mx-auto p-6 flex flex-col items-center text-center gap-4">
        <Confetti />
        <h1 className="title text-3xl">🔁 {t('review.done')}</h1>
        <RewardRow {...done} t={t} />
        <Mascot text={t('review.bonus')} mood="excited" />
        <button className="btn-primary w-full" onClick={() => nav('/town')}>{t('results.toTown')}</button>
      </div>
    );
  const world = content.worlds[q.worldId];
  return (
    <div className="min-h-full max-w-app mx-auto px-4 py-3 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button className="tap rounded-2xl bg-surface border-2 border-line font-bold" onClick={() => nav('/town')} aria-label={t('lesson.quit')}>✕</button>
        <Progress value={(idx + (solved ? 1 : 0)) / questions.length} />
      </div>
      <p className="chip bg-sky-pale mb-3 self-start">{world?.icon} {tx(content.conceptIndex[q.concept]?.name)}</p>
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
          {q.type === 'number' ? (
            <NumberStep step={q} solved={solved} onCorrect={() => { play('correct'); buzz(20); record(true); setSolved(true); }} onWrong={() => { play('wrong'); record(false); setWrongOnce(true); }} />
          ) : (
            <ChoiceStep step={q} solved={solved} onCorrect={() => { play('correct'); buzz(20); record(true); setSolved(true); }} onWrong={() => { play('wrong'); record(false); setWrongOnce(true); }} />
          )}
        </motion.div>
      </AnimatePresence>
      <div className="mt-auto pt-4 pb-safe">
        {wrongOnce && !solved && q.hint && <p className="card p-3 mb-2 bg-sun-pale font-semibold">💡 {tx(q.hint)}</p>}
        {solved && (
          <button className="btn-leaf w-full" onClick={next} autoFocus>
            {t('common.continue')}
          </button>
        )}
      </div>
    </div>
  );
}
