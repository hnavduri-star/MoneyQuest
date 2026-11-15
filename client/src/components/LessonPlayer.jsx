import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { stepsForAge } from '@engine/progress.js';
import { starsFromMistakes } from '@engine/scoring.js';
import { play, buzz } from '../lib/sound.js';
import PlayFrame from './PlayFrame.jsx';
import Mascot from './Mascot.jsx';
import Illustration from './Illustration.jsx';
import Results from './Results.jsx';
import { Progress, Coin } from './ui.jsx';
import CoinBurst from './CoinBurst.jsx';
import ChoiceStep from '../steps/ChoiceStep.jsx';
import NumberStep from '../steps/NumberStep.jsx';
import SortStep from '../steps/SortStep.jsx';
import SimStep from '../steps/SimStep.jsx';

const QUESTION = new Set(['choice', 'number', 'sort']);
const STEP_UI = { choice: ChoiceStep, number: NumberStep, sort: SortStep, sim: SimStep };
const PRAISE = ['lesson.correct', 'lesson.correct2', 'lesson.correct3'];

/**
 * Plays lessons, quizzes and bosses from JSON steps. Mistakes never end a level:
 * the child gets a hint and tries again; mistakes only lower the star rating.
 */
export default function LessonPlayer({ world, node }) {
  const { age, dispatch, content, state, cityCtx } = useGame();
  const { t, tx, money } = useT(world.id);
  const [run, setRun] = useState(0);
  const steps = useMemo(() => stepsForAge(node, age, cityCtx), [node, age, cityCtx]);
  const questions = steps.filter((s) => QUESTION.has(s.type)).length;
  const boss = node.kind === 'boss' ? node.boss : null;
  const [started, setStarted] = useState(!boss);
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState(null); // { ok, text }
  const [hintShown, setHintShown] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [firstTry, setFirstTry] = useState({}); // step index -> correct on first try
  const [hits, setHits] = useState(0);
  const [tries, setTries] = useState(0); // wrong tries on the current step
  const [streak, setStreak] = useState(0); // first-try correct answers in a row
  const [pop, setPop] = useState(null); // { n, key } coins just earned for an answer
  const [earned, setEarned] = useState({ xp: 0, coins: 0 }); // paid out question by question
  const [result, setResult] = useState(null);
  const step = steps[idx];
  const isQ = step && QUESTION.has(step.type);
  const meta = content.worldIndex.find((w) => w.id === world.id);

  const reset = () => {
    setRun((r) => r + 1);
    setStarted(!boss);
    setIdx(0);
    setSolved(false);
    setFeedback(null);
    setHintShown(false);
    setMistakes(0);
    setFirstTry({});
    setHits(0);
    setTries(0);
    setStreak(0);
    setEarned({ xp: 0, coins: 0 });
    setPop(null);
    setResult(null);
  };

  /** Each answer pays out immediately (more for first-try answers and streaks). */
  const payAnswer = (firstTryNow, st) => {
    const eff = dispatch({ type: 'question.answered', worldId: world.id, nodeId: node.id, correct: true, firstTry: firstTryNow, streak: st }, { defer: true });
    const r = eff.filter((e) => e.type === 'reward' && e.source === 'question.answered').reduce((a, e) => ({ xp: a.xp + e.xp, coins: a.coins + e.coins }), { xp: 0, coins: 0 });
    setEarned((x) => ({ xp: x.xp + r.xp, coins: x.coins + r.coins }));
    if (r.coins) {
      setPop({ n: r.coins, key: Date.now() });
      play('coin');
    }
  };

  const finish = (finalFirstTry, finalMistakes) => {
    const stars = starsFromMistakes(finalMistakes, questions);
    const answers = steps.map((s, i) => (QUESTION.has(s.type) && s.concept ? { concept: s.concept, correct: !!finalFirstTry[i] } : null)).filter(Boolean);
    const correct = Object.values(finalFirstTry).filter(Boolean).length;
    const effects = dispatch({ type: 'level.completed', worldId: world.id, nodeId: node.id, stars, mistakes: finalMistakes, score: questions ? Math.round((correct / questions) * 100) : 100, answers, answered: questions });
    setResult({ stars, effects });
  };

  const next = () => {
    play('tap');
    if (idx + 1 >= steps.length) return finish(firstTry, mistakes);
    setIdx(idx + 1);
    setSolved(false);
    setFeedback(null);
    setHintShown(false);
    setTries(0);
  };

  const onCorrect = () => {
    play('correct');
    buzz(25);
    const ft = firstTry[idx] === undefined ? { ...firstTry, [idx]: true } : firstTry;
    setFirstTry(ft);
    setSolved(true);
    const st = firstTry[idx] === undefined ? streak + 1 : 0;
    setStreak(st);
    payAnswer(firstTry[idx] === undefined, st);
    if (boss) setHits((h) => h + 1);
    setFeedback({ ok: true, text: st >= 3 && st % 2 === 1 ? `${t('lesson.onFire')} ${t('lesson.streak', { n: st })}` : t(PRAISE[(idx + run) % 3]) });
  };
  /** After two wrong tries the guide explains the answer, so a child is never stuck. */
  const revealAndContinue = () => {
    payAnswer(false, 0);
    setSolved(true);
    if (boss) setHits((h) => h + 1);
    next();
  };
  const onWrong = ({ quiet } = {}) => {
    play('wrong');
    if (firstTry[idx] === undefined) {
      setFirstTry((f) => ({ ...f, [idx]: false }));
      setMistakes((m) => m + 1);
    }
    setStreak(0);
    const n = tries + 1;
    setTries(n);
    if (!quiet) setFeedback({ ok: false, reveal: n >= 2 && step.type !== 'sort' });
    setHintShown(true); // after a wrong try, the hint is always free
  };

  const askHint = () => {
    if (hintShown) return;
    dispatch({ type: 'hint.used' });
    setHintShown(true);
  };

  if (result) return <Results world={world} node={node} stars={result.stars} effects={result.effects} onReplay={reset} bonus={earned} />;

  // ---- Boss intro ----
  if (boss && !started)
    return (
      <PlayFrame world={world} progress={0} color={boss.color}>
        <div className="flex flex-col items-center text-center gap-4 pt-6">
          <BossArt boss={boss} icon={node.icon} />
          <h1 className="title text-3xl">{tx(boss.name)}</h1>
          <div className="card p-4 text-lg font-semibold">{tx(boss.intro)}</div>
          <button className="btn-primary w-full text-xl" style={{ '--btn': boss.color }} onClick={() => setStarted(true)}>
            ⚔️ {t('boss.fight')}
          </button>
        </div>
      </PlayFrame>
    );

  const hint = step?.hint;
  const Body = STEP_UI[step.type];
  const footer = (
    <AnimatePresence mode="wait">
      {feedback ? (
        <motion.div key={feedback.ok ? 'ok' : feedback.reveal ? 'reveal' : 'no'} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className={`rounded-blob p-4 mb-1 border-4 ${feedback.ok ? 'bg-leaf-pale border-leaf' : feedback.reveal ? 'bg-sky-pale border-sky' : 'bg-sun-pale border-sun'}`} role="status">
          {feedback.reveal ? (
            <>
              <p className="font-extrabold text-xl">💡 {t('lesson.reveal')}</p>
              <p className="font-bold mt-1">{t('lesson.answerIs', { a: answerText(step, tx, t, money) })}</p>
              {step.explain && <p className="mt-1">{tx(step.explain)}</p>}
            </>
          ) : (
            <>
              <p className="font-extrabold text-xl">{feedback.ok ? `✅ ${feedback.text}` : `💡 ${hint ? t('lesson.tryAgainHint') : t('lesson.tryAgain')}`}</p>
              {!feedback.ok && hint && <p className="font-semibold mt-1">{tx(hint)}</p>}
              {feedback.ok && step.explain && <p className="mt-1">{tx(step.explain)}</p>}
            </>
          )}
          {feedback.reveal ? (
            <button className="btn-primary w-full mt-3" onClick={revealAndContinue} autoFocus>
              {t('lesson.gotIt')} <span className="inline-block rtl:rotate-180">→</span>
            </button>
          ) : feedback.ok ? (
            <button className="btn-leaf w-full mt-3" onClick={next} autoFocus>
              {t('common.continue')}
            </button>
          ) : (
            <button className="btn-sun w-full mt-3" onClick={() => setFeedback(null)} autoFocus>
              {t('lesson.tryAgain').split('.')[0]} ↻
            </button>
          )}
        </motion.div>
      ) : isQ ? (
        step.type === 'sort' && solved ? (
          <button className="btn-leaf w-full" onClick={next}>{t('common.continue')}</button>
        ) : hint ? (
          <button className="btn-ghost w-full" onClick={askHint} disabled={hintShown}>
            💡 {hintShown ? tx(hint) : state.coins >= content.rewards.hintCost ? t('lesson.hintCost', { cost: content.rewards.hintCost }) : t('lesson.hintFree')}
          </button>
        ) : null
      ) : (
        <button className="btn-primary w-full" onClick={next} style={{ '--btn': meta?.color }}>
          {t('common.continue')} <span className="inline-block rtl:rotate-180">→</span>
        </button>
      )}
    </AnimatePresence>
  );

  return (
    <PlayFrame world={world} progress={(idx + (solved || !isQ ? 1 : 0)) / steps.length} color={boss?.color || meta?.color} footer={footer}>
      <CoinBurst pop={pop} />
      {boss && (
        <div className="flex items-center gap-3 mb-3">
          <motion.div key={hits} animate={hits ? { x: [0, -12, 12, -6, 0], rotate: [0, -8, 8, 0] } : {}} transition={{ duration: 0.4 }}>
            <BossArt boss={boss} icon={node.icon} small />
          </motion.div>
          <div className="flex-1">
            <p className="text-xs font-bold">{t('boss.hp')}</p>
            <Progress value={1 - hits / Math.max(1, questions)} color={boss.color} height={16} label={t('boss.hp')} />
            <p className="text-sm font-bold mt-1" aria-live="polite">{feedback?.ok ? `💥 ${t('boss.hit')}` : feedback ? tx(boss.taunt) : ''}</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between min-h-[28px] mb-1" aria-live="polite">
        <span>{streak >= 2 && <motion.span key={streak} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="chip bg-ember-pale">🔥 {t('lesson.streak', { n: streak })}</motion.span>}</span>
        <span className="chip bg-sun-pale text-sm" aria-label={`${t('earn.thisLevel')}: ${earned.coins}`}>
          <Coin size={16} /> <span className="tabular-nums">+{earned.coins}</span>
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          {step.type === 'story' ? (
            <div className="pt-2">
              <Illustration art={step.art} />
              <Mascot text={tx(step.text)} mood={step.mascot || 'happy'} size={96} />
            </div>
          ) : (
            <Body key={`${run}-${idx}`} step={step} solved={solved} onCorrect={onCorrect} onWrong={onWrong} />
          )}
        </motion.div>
      </AnimatePresence>
    </PlayFrame>
  );
}

function answerText(step, tx, t, money) {
  if (step.type === 'choice') return tx(step.options.find((o) => o.correct)?.text);
  if (step.type === 'number' && step.money) return money(step.answer);
  if (step.type === 'number') return `${step.answer}${step.unitText ? ' ' + tx(step.unitText) : step.unit === 'percent' ? '%' : step.unit === 'weeks' ? ' ' + t('common.weeks') : ''}`;
  return '';
}

function BossArt({ boss, icon, small }) {
  const s = small ? 64 : 150;
  return (
    <div className="rounded-full flex items-center justify-center shadow-card border-4 border-white" style={{ width: s, height: s, background: `radial-gradient(circle at 35% 30%, #fff8, ${boss.color})`, fontSize: s * 0.55 }} aria-hidden>
      {icon}
    </div>
  );
}
