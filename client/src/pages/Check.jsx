import { useMemo, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { stepsForAge } from '@engine/progress.js';
import ChoiceStep from '../steps/ChoiceStep.jsx';
import NumberStep from '../steps/NumberStep.jsx';
import Mascot from '../components/Mascot.jsx';
import Confetti from '../components/Confetti.jsx';
import { Progress, RewardRow } from '../components/ui.jsx';
import { play } from '../lib/sound.js';

/** The same 5 questions are used before and after a stop, so the improvement is a fair comparison. */
export function checkQuestions(world, age, ctx) {
  const lessons = world.nodes.filter((n) => n.kind === 'lesson' && n.required).map((n) => stepsForAge(n, age, ctx).filter((s) => (s.type === 'choice' || s.type === 'number') && s.concept));
  const out = [];
  for (let round = 0; out.length < 5 && round < 4; round++) for (const l of lessons) if (l[round] && out.length < 5) out.push(l[round]);
  return out;
}

export default function Check() {
  const { worldId, phase } = useParams();
  const { content, age, cityCtx, dispatch, state } = useGame();
  const { t, tx } = useT(worldId);
  const nav = useNavigate();
  const world = content.worlds[worldId];
  const qs = useMemo(() => (world ? checkQuestions(world, age, cityCtx) : []), [world, age, cityCtx]);
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [done, setDone] = useState(null);
  if (!world || !['pre', 'post'].includes(phase)) return <Navigate to="/worlds" replace />;
  const q = qs[i];
  const answer = (ok) => {
    if (answered !== null) return;
    play(ok ? 'correct' : 'tap');
    setAnswered(ok);
    if (ok) setRight((r) => r + 1);
  };
  const next = () => {
    if (i + 1 >= qs.length) {
      const effects = dispatch({ type: 'check.completed', worldId, phase, score: right, total: qs.length });
      const r = effects.filter((e) => e.type === 'reward').reduce((a, e) => ({ xp: a.xp + e.xp, coins: a.coins + e.coins, gems: a.gems + e.gems }), { xp: 0, coins: 0, gems: 0 });
      setDone(r);
      return;
    }
    setI(i + 1);
    setAnswered(null);
  };
  const pre = state.checks?.[worldId]?.pre;
  const back = () => nav(`/world/${worldId}`);

  if (!started)
    return (
      <div className="max-w-app mx-auto p-6 flex flex-col gap-4 text-center">
        <h1 className="title text-3xl">🧠 {phase === 'pre' ? t('check.beforeTitle') : t('check.afterTitle')}</h1>
        <p className="font-bold text-soft">{world.icon} {tx(world.name)}</p>
        <Mascot text={t('check.intro')} />
        <button className="btn-primary w-full" onClick={() => setStarted(true)}>{t('check.start')}</button>
        <button className="btn-ghost w-full" onClick={back}>{t('check.skip')}</button>
      </div>
    );
  if (done)
    return (
      <div className="max-w-app mx-auto p-6 flex flex-col gap-4 text-center items-center">
        <Confetti />
        <h1 className="title text-3xl">{t('check.score', { n: right, total: qs.length })}</h1>
        {phase === 'post' && pre && <p className="text-lg font-bold">{right > pre.score ? t('check.improved', { a: pre.score, b: right, d: right - pre.score }) : t('check.same', { a: pre.score, b: right })}</p>}
        <RewardRow {...done} t={t} />
        <button className="btn-primary w-full" onClick={back}>{t('check.done')}</button>
      </div>
    );
  return (
    <div className="min-h-full max-w-app mx-auto px-4 py-3 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button className="tap rounded-2xl bg-surface border border-line font-bold" onClick={back} aria-label={t('lesson.quit')}>✕</button>
        <Progress value={(i + (answered !== null ? 1 : 0)) / qs.length} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
          {q.type === 'number' ? <NumberStep step={q} solved={answered !== null} onCorrect={() => answer(true)} onWrong={() => answer(false)} /> : <ChoiceStep step={q} solved={answered !== null} onCorrect={() => answer(true)} onWrong={() => answer(false)} />}
        </motion.div>
      </AnimatePresence>
      <div className="mt-auto pt-4 pb-safe">
        {answered !== null && <button className="btn-primary w-full" onClick={next} autoFocus>{t('common.next')}</button>}
      </div>
    </div>
  );
}
