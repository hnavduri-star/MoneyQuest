import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame, DEFAULT_SETTINGS } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { LANGUAGES } from '../content.js';
import { CURRENCIES } from '../lib/money.js';
import { checkNickname } from '@engine/nickname.js';
import { AGE_TIERS } from '@engine/text.js';
import Avatar from '../components/Avatar.jsx';
import Companion from '../components/Companion.jsx';
import { Segmented } from '../components/ui.jsx';
import { play } from '../lib/sound.js';

const NICK_A = ['Super', 'Lucky', 'Clever', 'Brave', 'Sunny', 'Cosmic', 'Turbo', 'Happy'];
const NICK_B = ['Saver', 'Falcon', 'Panda', 'Star', 'Coin', 'Comet', 'Tiger', 'Rocket'];

function Swatches({ colors, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {colors.map((c, i) => (
        <button key={c} type="button" role="radio" aria-checked={value === i} aria-label={`${label} ${i + 1}`} onClick={() => onChange(i)} className={`w-12 h-12 rounded-full border-4 ${value === i ? 'border-ink' : 'border-white'} shadow`} style={{ background: c }}>
          {value === i && <span className="text-white drop-shadow font-black">✓</span>}
        </button>
      ))}
    </div>
  );
}

function Picker({ items, value, onChange, label, tx }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {items.map((it) => (
        <button key={it.id} type="button" role="radio" aria-checked={value === it.id} onClick={() => { play('tap'); onChange(it.id); }} className={`shrink-0 min-h-[48px] px-4 rounded-2xl border-2 font-bold ${value === it.id ? 'border-ink bg-ink text-cream' : 'border-line bg-surface'}`}>
          {tx(it.name)}
        </button>
      ))}
    </div>
  );
}

export default function Creator({ edit = false }) {
  const g = useGame();
  const { content, active, createProfile, updateProfile, setDeviceLang, lang, profiles } = g;
  const { t, tx } = useT();
  const nav = useNavigate();
  const ch = content.characters;
  const startPreset = ch.presets[Math.floor(Math.random() * ch.presets.length)];
  const [d, setD] = useState(() =>
    edit && active
      ? { nickname: active.nickname, ageTier: active.ageTier, avatar: active.meta.avatar, companion: active.meta.companion, theme: active.meta.theme, presetId: null, lang, currency: g.settings.currency }
      : { nickname: '', ageTier: '10-12', avatar: { ...startPreset.avatar }, presetId: startPreset.id, companion: 'owl', theme: 'sky', lang, currency: lang === 'ar' ? 'AED' : 'USD' },
  );
  const steps = edit ? ['look', 'buddy', 'theme', 'name'] : ['language', 'age', 'name', 'look', 'buddy', 'theme'];
  const [i, setI] = useState(0);
  const [mode, setMode] = useState('presets');
  const [group, setGroup] = useState(ch.presets.find((p) => p.id === d.presetId)?.group || 'arab');
  const step = steps[i];
  const set = (patch) => setD((x) => ({ ...x, ...patch }));
  const setA = (patch) => setD((x) => ({ ...x, presetId: null, avatar: { ...x.avatar, ...patch } }));
  const nick = checkNickname(d.nickname);
  const themeColor = ch.themes.find((x) => x.id === d.theme)?.color;
  const canNext = step !== 'name' || nick.ok;

  const finish = () => {
    const meta = { avatar: d.avatar, companion: d.companion, theme: d.theme };
    if (edit) {
      updateProfile({ nickname: nick.value, meta });
      nav('/settings');
    } else {
      createProfile({ nickname: nick.value, ageTier: d.ageTier, meta: { ...meta, settings: { ...DEFAULT_SETTINGS, lang: d.lang, currency: d.currency } } });
      nav('/town');
    }
  };

  return (
    <div className="min-h-full max-w-app mx-auto px-4 py-4 flex flex-col">
      <div className="flex items-center gap-2">
        <button className="tap rounded-2xl bg-surface border-2 border-line font-bold" aria-label={t('common.back')} onClick={() => (i > 0 ? setI(i - 1) : nav(edit ? '/settings' : Object.keys(profiles).length ? '/profiles' : '/'))}>
          <span className="inline-block rtl:rotate-180">←</span>
        </button>
        <div className="flex-1 flex gap-1" aria-label={`${i + 1} / ${steps.length}`}>
          {steps.map((s, k) => <span key={s} className={`h-2 flex-1 rounded-full ${k <= i ? 'bg-theme' : 'bg-soft/20'}`} style={k <= i ? { background: themeColor } : undefined} />)}
        </div>
      </div>
      <h1 className="title mt-3">{t(`creator.step.${step}`)}</h1>

      {/* Live preview */}
      <div className="flex items-end justify-center gap-1 my-2 min-h-[150px]">
        <motion.div key={JSON.stringify(d.avatar)} initial={{ scale: 0.92 }} animate={{ scale: 1 }}>
          <Avatar avatar={d.avatar} size={118} theme={themeColor} title={d.nickname || 'avatar'} />
        </motion.div>
        <Companion id={d.companion} size={78} mood="happy" />
      </div>
      {d.nickname && <p className="text-center font-extrabold text-xl -mt-2 mb-2">{d.nickname}</p>}

      <AnimatePresence mode="wait">
        <motion.section key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 space-y-4">
          {step === 'language' && (
            <>
              <div>
                <p className="font-bold mb-2">{t('creator.language')}</p>
                <Segmented label={t('creator.language')} value={d.lang} onChange={(v) => { set({ lang: v }); setDeviceLang(v); }} options={LANGUAGES.map((l) => ({ value: l.id, label: l.name }))} />
              </div>
              <div>
                <p className="font-bold mb-2">{t('creator.currency')}</p>
                <Segmented label={t('creator.currency')} value={d.currency} onChange={(v) => set({ currency: v })} options={CURRENCIES.map((c) => ({ value: c.id, label: c.id === 'GEMS' ? tx(c.name) : c.id }))} />
              </div>
            </>
          )}
          {step === 'age' && (
            <div>
              <p className="font-bold mb-2">{t('creator.age')}</p>
              <div className="grid grid-cols-3 gap-3">
                {AGE_TIERS.map((a) => (
                  <button key={a} onClick={() => set({ ageTier: a })} aria-pressed={d.ageTier === a} className={`min-h-[84px] rounded-blob border-4 text-2xl font-extrabold ${d.ageTier === a ? 'border-ink bg-sun-pale' : 'border-line bg-surface'}`}>
                    {t(`creator.age.${a}`)}
                    {d.ageTier === a && <span className="block text-base">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 'name' && (
            <div>
              <label className="font-bold block mb-2" htmlFor="nick">{t('creator.nickname')}</label>
              <div className="flex gap-2">
                <input id="nick" className="flex-1 min-h-[56px] rounded-2xl border-2 border-line px-4 text-xl font-bold" maxLength={16} value={d.nickname} onChange={(e) => set({ nickname: e.target.value })} autoComplete="off" dir="auto" />
                <button className="btn-sun" onClick={() => set({ nickname: NICK_A[Math.floor(Math.random() * 8)] + NICK_B[Math.floor(Math.random() * 8)] })} aria-label={t('creator.surprise')}>🎲</button>
              </div>
              <p className="text-sm text-soft mt-2">🔒 {t('creator.nicknameHelp')}</p>
              {d.nickname.length >= 2 && !nick.ok && <p className="text-ember font-bold mt-1" role="alert">⚠️ {t('creator.nicknameBad')}</p>}
            </div>
          )}
          {step === 'look' && (
            <>
              <Segmented label="mode" value={mode} onChange={setMode} options={[{ value: 'presets', label: t('creator.presets') }, { value: 'custom', label: t('creator.custom') }]} />
              {mode === 'presets' ? (
                <>
                  <Picker items={ch.presetGroups} value={group} onChange={setGroup} label="group" tx={tx} />
                  <div className="grid grid-cols-3 gap-2">
                    {ch.presets.filter((p) => p.group === group).map((p) => (
                      <button key={p.id} onClick={() => { play('tap'); set({ avatar: { ...p.avatar }, presetId: p.id }); }} aria-pressed={d.presetId === p.id} className={`card p-1 flex flex-col items-center border-4 ${d.presetId === p.id ? 'border-ink' : 'border-transparent'}`}>
                        <Avatar avatar={p.avatar} size={70} theme={themeColor} />
                        <span className="text-xs font-bold leading-tight text-center">{tx(p.name)}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <Field label={t('creator.species')}><Picker items={ch.species} value={d.avatar.species} onChange={(v) => setA({ species: v, outfit: v === 'robot' ? 'plating' : v === 'astronaut' ? 'spacesuit' : d.avatar.outfit })} label={t('creator.species')} tx={tx} /></Field>
                  {d.avatar.species !== 'robot' && d.avatar.species !== 'fox' && <Field label={t('creator.skin')}><Swatches colors={ch.skinTones} value={d.avatar.skin} onChange={(v) => setA({ skin: v })} label={t('creator.skin')} /></Field>}
                  {(d.avatar.species === 'human' || d.avatar.species === 'astronaut') && (
                    <>
                      <Field label={t('creator.hair')}><Picker items={ch.hairStyles} value={d.avatar.hair} onChange={(v) => setA({ hair: v })} label={t('creator.hair')} tx={tx} /></Field>
                      <Field label={t('creator.hairColor')}><Swatches colors={ch.hairColors} value={d.avatar.hairColor} onChange={(v) => setA({ hairColor: v })} label={t('creator.hairColor')} /></Field>
                      <Field label={t('creator.headwear')}><Picker items={ch.headwear} value={d.avatar.headwear} onChange={(v) => setA({ headwear: v })} label={t('creator.headwear')} tx={tx} /></Field>
                    </>
                  )}
                  <Field label={t('creator.outfit')}><Picker items={ch.outfits} value={d.avatar.outfit} onChange={(v) => setA({ outfit: v })} label={t('creator.outfit')} tx={tx} /></Field>
                  <Field label={t('creator.outfitColor')}><Swatches colors={ch.themes.map((x) => x.color).concat(['#FFFFFF', '#22212B'])} value={ch.themes.map((x) => x.color).concat(['#FFFFFF', '#22212B']).indexOf(d.avatar.outfitColor)} onChange={(v) => setA({ outfitColor: ch.themes.map((x) => x.color).concat(['#FFFFFF', '#22212B'])[v] })} label={t('creator.outfitColor')} /></Field>
                  <Field label={t('creator.accessory')}><Picker items={ch.accessories} value={d.avatar.accessory} onChange={(v) => setA({ accessory: v })} label={t('creator.accessory')} tx={tx} /></Field>
                </div>
              )}
            </>
          )}
          {step === 'buddy' && (
            <>
              <p className="font-bold">{t('creator.buddy')}</p>
              <div className="grid grid-cols-2 gap-3">
                {ch.companions.map((c) => (
                  <button key={c.id} onClick={() => { play('tap'); set({ companion: c.id }); }} aria-pressed={d.companion === c.id} className={`card p-2 flex flex-col items-center border-4 ${d.companion === c.id ? 'border-ink' : 'border-transparent'}`}>
                    <Companion id={c.id} size={72} bounce={false} />
                    <span className="font-extrabold">{tx(c.name)}</span>
                    <span className="text-xs text-soft">{tx(c.tagline)}</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-soft">✨ {t('creator.evolveNote')}</p>
            </>
          )}
          {step === 'theme' && (
            <div>
              <p className="font-bold mb-2">{t('creator.theme')}</p>
              <div className="grid grid-cols-3 gap-3">
                {ch.themes.map((th) => (
                  <button key={th.id} onClick={() => set({ theme: th.id })} aria-pressed={d.theme === th.id} className={`min-h-[72px] rounded-blob border-4 text-white font-extrabold ${d.theme === th.id ? 'border-ink' : 'border-white'}`} style={{ background: th.color }}>
                    {tx(th.name)} {d.theme === th.id && '✓'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.section>
      </AnimatePresence>

      <div className="sticky bottom-0 bg-cream pt-3 pb-safe">
        {i < steps.length - 1 ? (
          <button className="btn-primary w-full" disabled={!canNext} onClick={() => { play('tap'); setI(i + 1); }} style={{ '--btn': themeColor }}>
            {t('common.next')} <span className="rtl:rotate-180 inline-block">→</span>
          </button>
        ) : (
          <button className="btn-leaf w-full" disabled={!nick.ok} onClick={finish}>
            {edit ? t('common.save') : t('creator.finish')} 🎉
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="font-bold text-sm mb-1">{label}</p>
      {children}
    </div>
  );
}
