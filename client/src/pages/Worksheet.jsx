import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { stepsForAge } from '@engine/progress.js';
import { PartnerStrip } from '../components/Brand.jsx';

/**
 * Printable worksheet for a stop: the key ideas, then questions (multiple choice, numbers, ordering),
 * and an answer key on the last page. Uses the device's city, so amounts and currency match the class.
 */
export default function Worksheet() {
  const { worldId } = useParams();
  const { content, cityCtx, city } = useGame();
  const { t, tx, money } = useT(worldId);
  const nav = useNavigate();
  const world = content.worlds[worldId];
  if (!world) return <Navigate to="/" replace />;
  const lessons = world.nodes.filter((n) => n.kind === 'lesson');
  const ideas = lessons.map((n) => stepsForAge(n, '10-12', cityCtx).find((s) => s.type === 'story'));
  const qs = [...lessons, ...world.nodes.filter((n) => n.kind === 'quiz')].flatMap((n) => stepsForAge(n, '10-12', cityCtx).filter((s) => ['choice', 'number', 'order'].includes(s.type))).slice(0, 12);
  const key = (q) => (q.type === 'choice' ? String.fromCharCode(65 + q.options.findIndex((o) => o.correct)) : q.type === 'number' ? (q.money ? money(q.answer) : q.answer) : q.items.map((x) => tx(x.text)).join(' → '));
  return (
    <div className="max-w-3xl mx-auto p-6 bg-surface text-ink worksheet">
      <div className="no-print flex gap-2 mb-4">
        <button className="btn-ghost" onClick={() => nav(-1)}>{t('common.back')}</button>
        <button className="btn-primary flex-1" onClick={() => window.print()}>🖨️ {t('cert.print')}</button>
      </div>
      <PartnerStrip compact />
      <h1 className="title text-3xl mt-3">{world.icon} {tx(world.name)}</h1>
      <p className="text-soft">{tx(world.tagline)} · {city.flag} {tx(city.name)}</p>
      <p className="mt-2">{t('worksheet.name')}: ____________________ &nbsp; {t('worksheet.date')}: ___________</p>
      <h2 className="font-extrabold text-xl mt-5 mb-2">💡 {t('worksheet.ideas')}</h2>
      <ul className="list-disc ps-6 space-y-1">{ideas.filter(Boolean).map((s, i) => <li key={i}>{tx(s.text)}</li>)}</ul>
      <h2 className="font-extrabold text-xl mt-5 mb-2">✏️ {t('worksheet.questions')}</h2>
      <ol className="list-decimal ps-6 space-y-4">
        {qs.map((q, i) => (
          <li key={i} className="break-inside-avoid">
            <p className="font-bold">{tx(q.prompt)}</p>
            {q.type === 'choice' && <ul className="ps-2 mt-1">{q.options.map((o, k) => <li key={k}>{String.fromCharCode(65 + k)}) {tx(o.text)}</li>)}</ul>}
            {q.type === 'number' && <p className="mt-2">{t('worksheet.answer')}: ______________</p>}
            {q.type === 'order' && <p className="mt-1">{t('worksheet.order')}: {q.items.map((x) => tx(x.text)).sort().join(' · ')}</p>}
          </li>
        ))}
      </ol>
      <div className="page-break" />
      <h2 className="font-extrabold text-xl mt-8 mb-2">🔑 {t('worksheet.key')}</h2>
      <ol className="list-decimal ps-6 text-sm space-y-1">{qs.map((q, i) => <li key={i}>{key(q)}{q.explain ? ` · ${tx(q.explain)}` : ''}</li>)}</ol>
    </div>
  );
}
