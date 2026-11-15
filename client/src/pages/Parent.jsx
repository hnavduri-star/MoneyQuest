import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { masteryLevel } from '@engine/mastery.js';
import { worldStatus } from '@engine/progress.js';
import { dayKey, addDays } from '@engine/dates.js';
import { sims as S } from '@engine/index.js';
import { Header, Segmented, Progress } from '../components/ui.jsx';
import Avatar from '../components/Avatar.jsx';
import PinPad from '../components/PinPad.jsx';
import { api } from '../lib/api.js';

/** Parent mode (PIN-protected): progress, skills, learning checks, missions to confirm, at-home ideas and goals. */
export default function Parent() {
  const g = useGame();
  const { profiles, checkPin, content, dispatchFor, updateProfileFor, themeColor } = g;
  const { t, tx } = useT();
  const nav = useNavigate();
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const list = Object.values(profiles);
  const [pid, setPid] = useState(list[0]?.id);
  const [tab, setTab] = useState('overview');
  const p = profiles[pid];
  const back = () => nav(-1);

  if (!ok)
    return (
      <div className="max-w-app mx-auto p-6 flex flex-col items-center gap-4 text-center">
        <h1 className="title">👨‍👩‍👧 {t('parentMode.title')}</h1>
        <p className="text-soft">{t('parent.enterPin')}</p>
        <PinPad error={err} onDone={async (pin) => ((await checkPin(pin)) ? setOk(true) : setErr(t('parent.pinWrong')))} />
        <button className="btn-ghost" onClick={back}>{t('common.back')}</button>
      </div>
    );
  if (!p)
    return (
      <div className="max-w-app mx-auto p-6">
        <Header title={t('parentMode.title')} onBack={back} />
        <p>{t('parentMode.noKids')}</p>
      </div>
    );
  return (
    <div className="max-w-app mx-auto px-4 py-4 space-y-4">
      <Header title={t('parentMode.title')} onBack={back} />
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {list.map((k) => (
          <button key={k.id} onClick={() => setPid(k.id)} aria-pressed={k.id === pid} className={`shrink-0 card px-3 py-2 flex items-center gap-2 ${k.id === pid ? 'ring-4 ring-sky' : ''}`}>
            <span className="w-9 h-9 overflow-hidden rounded-xl flex justify-center"><Avatar avatar={k.meta.avatar} level={k.state.level} size={36} theme={themeColor(k.meta.theme)} /></span>
            <span className="font-bold">{k.nickname}</span>
          </button>
        ))}
      </div>
      <Segmented label="tab" value={tab} onChange={setTab} options={[{ value: 'overview', label: t('parentMode.overview'), icon: '📊' }, { value: 'skills', label: t('trophies.mastery'), icon: '🎓' }, { value: 'home', label: t('parentMode.atHome'), icon: '🏡' }, { value: 'school', label: t('parentMode.school'), icon: '🏫' }]} />
      {tab === 'overview' && <Overview p={p} t={t} tx={tx} content={content} dispatchFor={dispatchFor} />}
      {tab === 'skills' && <Skills p={p} t={t} tx={tx} content={content} />}
      {tab === 'home' && <AtHome p={p} t={t} tx={tx} content={content} updateProfileFor={updateProfileFor} age={p.ageTier} />}
      {tab === 'school' && <School p={p} t={t} updateProfileFor={updateProfileFor} family={g.family} />}
    </div>
  );
}

function Overview({ p, t, tx, content, dispatchFor }) {
  const s = p.state;
  const week = Array.from({ length: 7 }, (_, i) => addDays(dayKey(), -6 + i));
  const mins = week.map((d) => p.meta.timeLog?.[d] || 0);
  const maxMin = Math.max(10, ...mins);
  const done = content.worldIndex.filter((w) => w.playable && worldStatus(s, w, content, p.ageTier) === 'complete');
  const pending = Object.entries(s.missions || {}).filter(([, m]) => m.status === 'pending');
  const [cert, setCert] = useState(null);
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="card p-3"><div className="text-xs font-bold text-soft">{t('common.level')}</div><div className="text-2xl font-extrabold">{s.level}</div></div>
        <div className="card p-3"><div className="text-xs font-bold text-soft">{t('parentMode.stops')}</div><div className="text-2xl font-extrabold">{done.length}</div></div>
        <div className="card p-3"><div className="text-xs font-bold text-soft">🔥</div><div className="text-2xl font-extrabold">{s.streak.count}</div></div>
      </section>
      <section className="card p-4">
        <h2 className="font-extrabold mb-2">⏱️ {t('parentMode.timeWeek', { n: mins.reduce((a, b) => a + b, 0) })}</h2>
        <div className="flex items-end gap-2 h-24" role="img" aria-label={mins.join(', ')}>
          {week.map((d, i) => (
            <div key={d} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-[10px] font-bold">{mins[i] || ''}</span>
              <div className="w-full rounded-t bg-sky" style={{ height: `${(mins[i] / maxMin) * 80}%`, minHeight: mins[i] ? 4 : 0 }} />
              <span className="text-[10px] text-soft">{d.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>
      {pending.length > 0 && (
        <section className="card p-4 space-y-2">
          <h2 className="font-extrabold">🏡 {t('parentMode.confirmMissions')}</h2>
          {pending.map(([wid]) => (
            <div key={wid} className="flex items-center gap-2">
              <p className="flex-1 text-sm">{tx(content.missions[wid].text)}</p>
              <button className="btn-leaf min-h-[44px] text-base" onClick={() => dispatchFor(p.id, { type: 'mission.approve', worldId: wid })}>✓ {t('parentMode.confirm')}</button>
            </div>
          ))}
        </section>
      )}
      <section className="card p-4">
        <h2 className="font-extrabold mb-2">🧠 {t('parentMode.checks')}</h2>
        {Object.keys(s.checks || {}).length === 0 ? (
          <p className="text-soft text-sm">{t('parentMode.noChecks')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-soft text-start"><th className="text-start">{t('worlds.title')}</th><th>{t('parentMode.before')}</th><th>{t('parentMode.after')}</th></tr></thead>
            <tbody>
              {Object.entries(s.checks).map(([wid, c]) => (
                <tr key={wid} className="border-t border-line">
                  <td className="py-1">{content.worlds[wid]?.icon} {tx(content.worlds[wid]?.name)}</td>
                  <td className="text-center tabular-nums">{c.pre ? `${c.pre.score}/${c.pre.total}` : '–'}</td>
                  <td className="text-center tabular-nums font-bold">{c.post ? `${c.post.score}/${c.post.total}` : '–'}{c.pre && c.post && c.post.score > c.pre.score ? ` ▲${c.post.score - c.pre.score}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="card p-4">
        <h2 className="font-extrabold mb-2">🏅 {t('parentMode.certificates')}</h2>
        {done.length === 0 ? <p className="text-soft text-sm">{t('parentMode.noCertificates')}</p> : (
          <div className="flex flex-wrap gap-2">
            {done.map((w) => <button key={w.id} type="button" className="btn-ghost min-h-[44px] text-sm" onClick={() => setCert({ name: p.nickname, worldId: w.id })}>{w.icon} {tx(w.name)}</button>)}
          </div>
        )}
        {cert && <Certificate cert={cert} t={t} tx={tx} content={content} />}
      </section>
    </div>
  );
}

function Certificate({ cert: c, t, tx, content }) {
  const w = content.worlds[c.worldId];
  return (
    <div className="mt-4 print-area">
      <div className="rounded-blob border-8 border-double border-sun p-6 text-center bg-surface">
        <p className="text-sm font-bold uppercase tracking-widest text-soft">{t('cert.title')}</p>
        <p className="title text-3xl my-2">{c.name}</p>
        <p>{t('cert.body')}</p>
        <p className="title text-2xl my-2">{w.icon} {tx(w.name)}</p>
        <p className="text-sm text-soft">{new Date().toLocaleDateString()}</p>
        <p className="mt-3 font-extrabold">MoneyQuest</p>
      </div>
      <button className="btn-primary w-full mt-2 no-print" onClick={() => window.print()}>🖨️ {t('cert.print')}</button>
    </div>
  );
}

function Skills({ p, t, tx, content }) {
  return (
    <div className="space-y-3">
      {Object.values(content.worlds).filter((w) => w.allConcepts.some((id) => p.state.mastery[id])).map((w) => (
        <section key={w.id} className="card p-4">
          <h2 className="font-extrabold mb-2">{w.icon} {tx(w.name)}</h2>
          {w.allConcepts.map((id) => {
            const lvl = masteryLevel(p.state.mastery[id]);
            const pct = { new: 0, learning: 0.33, practising: 0.66, mastered: 1 }[lvl];
            return (
              <div key={id} className="py-1">
                <div className="flex justify-between text-sm font-bold"><span>{tx(content.conceptIndex[id].name)}</span><span>{t(`mastery.${lvl}`)}</span></div>
                <Progress value={pct} height={8} color={lvl === 'mastered' ? '#009E73' : undefined} />
              </div>
            );
          })}
        </section>
      ))}
      {Object.keys(p.state.mastery).length === 0 && <p className="text-soft">{t('parentMode.noSkills')}</p>}
    </div>
  );
}

function AtHome({ p, t, tx, content, updateProfileFor }) {
  const open = content.worldIndex.filter((w) => w.playable && ['open', 'complete'].includes(worldStatus(p.state, w, content, p.ageTier)));
  const goal = p.meta.allowanceGoal || { name: '', price: 0, weekly: 0 };
  const [g, setG] = useState(goal);
  const weeks = g.price > 0 && g.weekly > 0 ? S.weeksToGoal(g.price, g.weekly) : null;
  return (
    <div className="space-y-4">
      <section className="card p-4 space-y-2">
        <h2 className="font-extrabold">🏡 {t('parentMode.thisWeek')}</h2>
        {open.slice(-3).reverse().map((w) => (
          <div key={w.id} className="border-t border-line pt-2">
            <p className="font-bold">{w.icon} {tx(w.name)}</p>
            <p className="text-sm">{tx(content.worlds[w.id].realLife)}</p>
            <p className="text-sm text-soft mt-1">💬 {t('parentMode.askThem')} “{tx(content.worlds[w.id].tagline)}”?</p>
          </div>
        ))}
      </section>
      <section className="card p-4 space-y-2">
        <h2 className="font-extrabold">🎯 {t('parentMode.allowanceGoal')}</h2>
        <p className="text-sm text-soft">{t('parentMode.allowanceHelp')}</p>
        <label className="block text-sm font-bold">{t('parentMode.goalName')}<input id="goal-name" className="mt-1 w-full min-h-[44px] rounded-xl border border-line bg-surface px-3" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-bold">{t('parentMode.goalPrice')}<input id="goal-price" inputMode="decimal" className="mt-1 w-full min-h-[44px] rounded-xl border border-line bg-surface px-3" value={g.price || ''} onChange={(e) => setG({ ...g, price: Number(e.target.value) || 0 })} /></label>
          <label className="block text-sm font-bold">{t('parentMode.weekly')}<input id="goal-weekly" inputMode="decimal" className="mt-1 w-full min-h-[44px] rounded-xl border border-line bg-surface px-3" value={g.weekly || ''} onChange={(e) => setG({ ...g, weekly: Number(e.target.value) || 0 })} /></label>
        </div>
        {weeks !== null && <p className="font-bold">📅 {t('parentMode.weeksToGoal', { n: weeks })}</p>}
        <button className="btn-primary w-full" onClick={() => updateProfileFor(p.id, { allowanceGoal: g })}>{t('common.save')}</button>
      </section>
    </div>
  );
}

function School({ p, t, updateProfileFor, family }) {
  const [code, setCode] = useState(p.meta.classCode || '');
  const [msg, setMsg] = useState('');
  const join = async () => {
    const c = code.trim().toUpperCase();
    if (!c) {
      updateProfileFor(p.id, { classCode: null });
      setMsg(t('parentMode.classLeft'));
      return;
    }
    try {
      const info = await api.classInfo(c);
      updateProfileFor(p.id, { classCode: info.code, className: info.name });
      setMsg(t('parentMode.classJoined', { name: info.name }));
    } catch {
      setMsg(t('parentMode.classNotFound'));
    }
  };
  return (
    <section className="card p-4 space-y-3">
      <h2 className="font-extrabold">🏫 {t('parentMode.classTitle')}</h2>
      <p className="text-sm text-soft">{t('parentMode.classHelp')}</p>
      {p.meta.className && <p className="chip bg-leaf-pale">✓ {p.meta.className}</p>}
      <input id="class-code" className="w-full min-h-[52px] rounded-2xl border border-line bg-surface px-4 text-xl tracking-widest uppercase text-center" dir="ltr" placeholder="ABCD-EFGH" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      <button className="btn-primary w-full" onClick={join} disabled={!family?.token}>{t('parentMode.classJoin')}</button>
      {!family?.token && <p className="text-sm text-soft">{t('parentMode.needOnline')}</p>}
      {msg && <p className="font-bold" role="status">{msg}</p>}
    </section>
  );
}
