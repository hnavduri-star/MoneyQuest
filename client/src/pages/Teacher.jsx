import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { api } from '../lib/api.js';
import { Header } from '../components/ui.jsx';
import PinPad from '../components/PinPad.jsx';
import { PartnerStrip } from '../components/Brand.jsx';

/**
 * Teacher mode: create a class (name + PIN), share the class code with parents, then see the class's
 * progress (nicknames only) and print worksheets. Needs the online version (a server).
 */
export default function Teacher() {
  const { device, setTeacher, content } = useGame();
  const { t, tx } = useT();
  const nav = useNavigate();
  const teacher = device?.teacher;
  const [mode, setMode] = useState('new');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [report, setReport] = useState(null);
  const offline = import.meta.env.VITE_STATIC === '1';

  useEffect(() => {
    if (!teacher) return;
    api.classReport(teacher.code, teacher.token).then(setReport).catch(() => setErr(t('teacher.loadFailed')));
  }, [teacher?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const worlds = content.worldIndex.filter((w) => w.playable);
  if (offline)
    return (
      <div className="max-w-app mx-auto p-6 space-y-4">
        <Header title={t('teacher.title')} onBack={() => nav(-1)} />
        <p className="card p-4">{t('teacher.needOnline')}</p>
        <Worksheets worlds={worlds} t={t} tx={tx} nav={nav} />
      </div>
    );
  if (!teacher)
    return (
      <div className="max-w-app mx-auto p-6 space-y-4">
        <Header title={t('teacher.title')} onBack={() => nav(-1)} />
        <p className="text-soft">{t('teacher.intro')}</p>
        <div className="flex gap-2">
          <button className={mode === 'new' ? 'btn-primary flex-1' : 'btn-ghost flex-1'} onClick={() => setMode('new')}>{t('teacher.newClass')}</button>
          <button className={mode === 'login' ? 'btn-primary flex-1' : 'btn-ghost flex-1'} onClick={() => setMode('login')}>{t('teacher.openClass')}</button>
        </div>
        {mode === 'new' ? (
          <input id="class-name" className="w-full min-h-[52px] rounded-2xl border border-line bg-surface px-4 text-lg" placeholder={t('teacher.className')} value={name} onChange={(e) => setName(e.target.value)} />
        ) : (
          <input id="class-code-t" className="w-full min-h-[52px] rounded-2xl border border-line bg-surface px-4 text-xl uppercase tracking-widest text-center" dir="ltr" placeholder="ABCD-EFGH" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        )}
        <p className="text-sm font-bold text-center">{t('teacher.pin')}</p>
        <PinPad
          error={err}
          onDone={async (pin) => {
            setErr('');
            try {
              const r = mode === 'new' ? await api.createClass(name, pin) : await api.loginClass(code, pin);
              setTeacher({ code: r.code, name: r.name, token: r.token });
            } catch {
              setErr(t('teacher.failed'));
            }
          }}
        />
      </div>
    );

  const students = report?.students || [];
  const avg = (f) => (students.length ? Math.round(students.reduce((a, s) => a + f(s), 0) / students.length) : 0);
  return (
    <div className="max-w-app mx-auto px-4 py-4 space-y-4">
      <Header title={teacher.name} onBack={() => nav(-1)} />
      <PartnerStrip compact />
      <section className="card p-4">
        <p className="text-sm text-soft">{t('teacher.shareCode')}</p>
        <p className="text-3xl font-extrabold tracking-widest" dir="ltr">{teacher.code}</p>
      </section>
      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="card p-3"><div className="text-xs font-bold text-soft">{t('teacher.students')}</div><div className="text-2xl font-extrabold">{students.length}</div></div>
        <div className="card p-3"><div className="text-xs font-bold text-soft">{t('teacher.avgStops')}</div><div className="text-2xl font-extrabold">{avg((s) => s.summary.stops?.length || 0)}</div></div>
        <div className="card p-3"><div className="text-xs font-bold text-soft">{t('teacher.avgGain')}</div><div className="text-2xl font-extrabold">{classGain(students)}</div></div>
      </section>
      <section className="card p-3 overflow-x-auto">
        <h2 className="font-extrabold mb-2">{t('teacher.grid')}</h2>
        {students.length === 0 ? <p className="text-soft text-sm">{t('teacher.empty')}</p> : (
          <table className="text-sm min-w-max">
            <thead>
              <tr>
                <th className="text-start pe-2">{t('teacher.student')}</th>
                <th className="px-1">{t('common.level')}</th>
                {worlds.map((w) => <th key={w.id} className="px-1" title={tx(w.name)}>{w.icon}</th>)}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="pe-2 font-bold">{s.nickname}</td>
                  <td className="text-center">{s.summary.level ?? '–'}</td>
                  {worlds.map((w) => {
                    const done = s.summary.stops?.includes(w.id);
                    const c = s.summary.checks?.[w.id];
                    return <td key={w.id} className="text-center px-1" title={c?.post ? `${c.pre?.score ?? '–'} → ${c.post.score}` : ''}>{done ? '✅' : c?.pre ? '▫️' : ''}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-soft mt-2">✅ {t('teacher.legendDone')} · ▫️ {t('teacher.legendStarted')}</p>
      </section>
      <Worksheets worlds={worlds} t={t} tx={tx} nav={nav} />
      <button className="btn-ghost w-full" onClick={() => setTeacher(null)}>{t('teacher.signOut')}</button>
    </div>
  );
}

function classGain(students) {
  const gains = students.flatMap((s) => Object.values(s.summary.checks || {}).filter((c) => c.pre && c.post).map((c) => (c.post.score - c.pre.score) / (c.post.total || 5)));
  if (!gains.length) return '–';
  return `${gains.reduce((a, b) => a + b, 0) / gains.length >= 0 ? '+' : ''}${Math.round((gains.reduce((a, b) => a + b, 0) / gains.length) * 100)}%`;
}

function Worksheets({ worlds, t, tx, nav }) {
  return (
    <section className="card p-4">
      <h2 className="font-extrabold mb-2">🖨️ {t('teacher.worksheets')}</h2>
      <p className="text-sm text-soft mb-2">{t('teacher.worksheetsHelp')}</p>
      <div className="flex flex-wrap gap-2">
        {worlds.map((w) => <button key={w.id} className="btn-ghost min-h-[44px] text-sm" onClick={() => nav(`/worksheet/${w.id}`)}>{w.icon} {tx(w.name)}</button>)}
      </div>
    </section>
  );
}
