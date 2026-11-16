import { useNavigate } from 'react-router-dom';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { journeyProgress } from '@engine/progress.js';
import { Progress } from './ui.jsx';

/** "My money journey": how far through the whole journey, which stop, how many lessons left, and a Continue button. */
export default function JourneyCard({ compact = false }) {
  const { state, content, age, city } = useGame();
  const { t, tx } = useT();
  const nav = useNavigate();
  const p = journeyProgress(state, content, age);
  const pct = Math.round(p.pct * 100);
  const cur = p.current;
  const world = cur && content.worlds[cur.worldId];
  const stop = cur && city.stops?.[cur.worldId];
  return (
    <section className="card p-4" aria-label={t('journey.myJourney')}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-extrabold">🧭 {t('journey.myJourney')}</h2>
        <span className="chip bg-leaf-pale text-leaf">{t('journey.pctDone', { n: pct })}</span>
      </div>
      <div className="my-2"><Progress value={p.pct} height={14} label={`${pct}%`} /></div>
      {/* one dot per stop: done, current, still to come */}
      <div className="flex gap-1 mb-2" aria-hidden>
        {content.worldIndex.filter((w) => w.playable).map((w, i) => (
          <span key={w.id} className={`h-2 flex-1 rounded-full ${i < p.worldsDone ? 'bg-leaf' : cur && w.id === cur.worldId ? 'bg-sun' : 'bg-soft/25'}`} />
        ))}
      </div>
      <p className="text-sm font-bold">{t('journey.stopsDone', { n: p.worldsDone, total: p.worldsTotal })}</p>
      {cur ? (
        <>
          <p className="text-sm mt-1">
            📍 {t('journey.nowAt', { n: cur.stopNumber, world: tx(world.name) })}{stop ? ` · ${tx(stop.location)}` : ''}
          </p>
          <p className="text-sm text-soft">{t('journey.lessonsLeft', { done: cur.nodesDone, total: cur.nodesTotal })}</p>
          {!compact && cur.next && (
            <button className="btn-primary w-full mt-3" onClick={() => nav(`/play/${cur.worldId}/${cur.next.id}`)}>
              ▶ {t('journey.next', { title: tx(cur.next.title) })}
            </button>
          )}
        </>
      ) : (
        <p className="text-sm mt-1 font-bold">🏆 {t('journey.allDone')}</p>
      )}
    </section>
  );
}
