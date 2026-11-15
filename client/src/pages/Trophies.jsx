import { useState } from 'react';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { badgeProgress } from '@engine/badges.js';
import { masteryLevel } from '@engine/mastery.js';
import { Header, Modal, Progress, Segmented } from '../components/ui.jsx';
import BadgeIcon from '../components/BadgeIcon.jsx';

const CATS = ['all', 'worlds', 'progress', 'skill', 'habits', 'collect', 'special'];
const CAT_ICON = { all: '🏆', worlds: '🗺️', progress: '🚀', skill: '🎯', habits: '🔥', collect: '🎒', special: '✨' };
const LEVEL_UI = { new: ['○', 'bg-soft/20', 0], learning: ['◔', 'bg-sun', 0.33], practising: ['◑', 'bg-sky-light', 0.66], mastered: ['●', 'bg-leaf', 1] };

export default function Trophies() {
  const { content, state } = useGame();
  const { t, tx } = useT();
  const [tab, setTab] = useState('badges');
  const [cat, setCat] = useState('all');
  const [open, setOpen] = useState(null);
  const earned = Object.keys(state.badges).length;
  const list = content.badges.filter((b) => cat === 'all' || b.category === cat).sort((a, b) => (state.badges[b.id] ? 1 : 0) - (state.badges[a.id] ? 1 : 0));
  return (
    <div>
      <Header title={t('trophies.title')} />
      <Segmented label="tab" value={tab} onChange={setTab} options={[{ value: 'badges', label: t('trophies.count', { got: earned, total: content.badges.length }), icon: '🏅' }, { value: 'skills', label: t('trophies.mastery'), icon: '🎓' }, { value: 'passport', label: t('passport.title'), icon: '🛂' }]} />
      {tab === 'passport' ? (
        <div className="space-y-3 mt-4">
          <p className="text-soft">{t('passport.help')}</p>
          <p className="font-extrabold">{t('passport.count', { n: Object.values(state.passport || {}).reduce((a, w) => a + Object.keys(w).length, 0), c: Object.keys(state.passport || {}).length })}</p>
          {content.cities.cities.map((c) => {
            const got = state.passport?.[c.id] || {};
            const playable = content.worldIndex.filter((w) => w.playable);
            return (
              <section key={c.id} className="card p-4">
                <h2 className="font-extrabold mb-2">{c.flag} {tx(c.name)} <span className="text-soft text-sm">· {Object.keys(got).length}/{playable.length}</span></h2>
                <div className="grid grid-cols-7 gap-1">
                  {playable.map((w) => (
                    <span key={w.id} title={tx(w.name)} className={`aspect-square rounded-full flex items-center justify-center text-lg border-2 ${got[w.id] ? 'border-leaf bg-leaf-pale rotate-[-8deg]' : 'border-dashed border-line opacity-40'}`} aria-label={`${tx(w.name)} ${got[w.id] ? '✓' : ''}`}>
                      {got[w.id] ? c.stops[w.id]?.landmark || w.icon : '·'}
                    </span>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : tab === 'badges' ? (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar my-3">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`shrink-0 min-h-[44px] px-3 rounded-2xl text-xl border-2 ${cat === c ? 'border-ink bg-surface' : 'border-transparent'}`} aria-label={c}>
                {CAT_ICON[c]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {list.map((b) => {
              const got = !!state.badges[b.id];
              return (
                <button key={b.id} onClick={() => setOpen(b)} className="flex flex-col items-center text-center" aria-label={`${tx(b.name)} ${got ? '' : t('common.locked')}`}>
                  <BadgeIcon badge={b} earned={got} size={64} />
                  <span className="text-[11px] font-bold leading-tight mt-1 line-clamp-2">{tx(b.name)}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-4 mt-4">
          {Object.values(content.worlds).map((w) => (
            <section key={w.id} className="card p-4">
              <h2 className="font-extrabold mb-2">{w.icon} {tx(w.name)}</h2>
              {w.allConcepts.map((id) => {
                const lvl = masteryLevel(state.mastery[id]);
                const [sym, color, pct] = LEVEL_UI[lvl];
                return (
                  <div key={id} className="py-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span>{tx(content.conceptIndex[id].name)}</span>
                      <span>{sym} {t(`mastery.${lvl}`)}</span>
                    </div>
                    <div className="flex gap-1 mt-1" aria-hidden>
                      {[0.33, 0.66, 1].map((s) => <span key={s} className={`h-2 flex-1 rounded-full ${pct >= s ? color : 'bg-soft/20'}`} />)}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}
      <Modal open={!!open} onClose={() => setOpen(null)} label={open ? tx(open.name) : ''}>
        {open && (
          <div className="flex flex-col items-center text-center gap-2">
            <BadgeIcon badge={open} earned={!!state.badges[open.id]} size={110} />
            <span className="chip bg-cream">{t(`rarity.${open.rarity}`)}</span>
            <h2 className="title">{tx(open.name)}</h2>
            <p>{tx(open.desc)}</p>
            {!state.badges[open.id] && badgeProgress(open, state) && (
              <div className="w-full">
                <Progress value={badgeProgress(open, state).have / badgeProgress(open, state).need} />
                <p className="text-sm font-bold mt-1">{badgeProgress(open, state).have} / {badgeProgress(open, state).need}</p>
              </div>
            )}
            {state.badges[open.id] && <p className="text-sm text-soft">✅ {state.badges[open.id]}</p>}
            <button className="btn-primary w-full mt-2" onClick={() => setOpen(null)}>{t('common.close')}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
