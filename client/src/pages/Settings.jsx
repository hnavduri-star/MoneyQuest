import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { LANGUAGES } from '../content.js';
import { CURRENCIES } from '../lib/money.js';
import { AGE_TIERS } from '@engine/text.js';
import { Header, Segmented, Toggle, Modal } from '../components/ui.jsx';
import Avatar from '../components/Avatar.jsx';
import PinPad from '../components/PinPad.jsx';

export default function Settings() {
  const { settings, updateSettings, updateProfile, active, state, family, syncStatus, signOutProfile, linkFamily, content, themeColor } = useGame();
  const { t, tx } = useT();
  const nav = useNavigate();
  const [ageGate, setAgeGate] = useState(null);
  const [linking, setLinking] = useState(false);
  const [err, setErr] = useState('');
  const { checkPin, allowedCities, city, editionPicker, editionId, setDeviceEdition } = useGame();
  const theme = themeColor(active.meta.theme);
  return (
    <div className="space-y-4">
      <Header title={t('settings.title')} onBack={() => nav('/town')} />
      <section className="card p-4 flex items-center gap-4">
        <Avatar avatar={active.meta.avatar} level={state.level} equipped={state.inventory.equipped} size={80} theme={theme} />
        <div className="flex-1">
          <p className="font-extrabold text-xl">{active.nickname}</p>
          <button className="btn-ghost min-h-[44px] mt-1 text-base" onClick={() => nav('/edit-character')}>✏️ {t('settings.editCharacter')}</button>
        </div>
      </section>
      <button
        className="btn-ghost w-full"
        onClick={() => {
          signOutProfile();
          nav('/');
        }}
      >
        👥 {t('settings.switchPlayer')}
      </button>

      <section className="card p-4 space-y-3">
        <label className="font-bold block" htmlFor="set-city">🌍 {t('settings.city')}</label>
        <select id="set-city" className="w-full min-h-[52px] rounded-2xl border border-line bg-surface px-4 font-bold" value={city.id} onChange={(e) => { const c = allowedCities.find((x) => x.id === e.target.value); updateSettings({ city: c.id, currency: c.currency }); }}>
          {allowedCities.map((c) => <option key={c.id} value={c.id}>{c.flag} {tx(c.name)}</option>)}
        </select>
        <p className="font-bold">{t('settings.language')}</p>
        <Segmented label={t('settings.language')} value={settings.lang} onChange={(v) => updateSettings({ lang: v })} options={LANGUAGES.map((l) => ({ value: l.id, label: l.name }))} />
        <p className="font-bold">{t('settings.currency')}</p>
        <Segmented label={t('settings.currency')} value={settings.currency} onChange={(v) => updateSettings({ currency: v })} options={CURRENCIES.map((c) => ({ value: c.id, label: c.id === 'GEMS' ? tx(c.name) : c.id }))} />
        <p className="font-bold">{t('settings.ageTier')}</p>
        <Segmented label={t('settings.ageTier')} value={active.ageTier} onChange={(v) => setAgeGate(v)} options={AGE_TIERS.map((a) => ({ value: a, label: t(`creator.age.${a}`) }))} />
      </section>

      <section className="card p-4 space-y-2">
        <p className="font-bold">🎨 {t('settings.appearance')}</p>
        <Segmented label={t('settings.appearance')} value={settings.appearance} onChange={(v) => updateSettings({ appearance: v })} options={[{ value: 'light', label: t('settings.appearance.light'), icon: '☀️' }, { value: 'dark', label: t('settings.appearance.dark'), icon: '🌙' }, { value: 'auto', label: t('settings.appearance.auto'), icon: '🌓' }]} />
      </section>

      <section className="card px-4 divide-y divide-line">
        <Toggle label={`🔊 ${t('settings.sound')}`} checked={settings.sound} onChange={(v) => updateSettings({ sound: v })} />
        <Toggle label={`🗣️ ${t('settings.voice')}`} checked={settings.voice} onChange={(v) => updateSettings({ voice: v })} />
        <Toggle label={`📳 ${t('settings.haptics')}`} checked={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} />
        <Toggle label={`🐢 ${t('settings.reducedMotion')}`} checked={settings.reducedMotion} onChange={(v) => updateSettings({ reducedMotion: v })} />
        <Toggle label={`🔤 ${t('settings.dyslexia')}`} checked={settings.dyslexia} onChange={(v) => updateSettings({ dyslexia: v })} />
        <Toggle label={`🕌 ${t('settings.islamic')}`} checked={settings.islamic} onChange={(v) => updateSettings({ islamic: v })} />
        <div className="py-3">
          <p className="font-bold mb-2">🔠 {t('settings.textSize')}</p>
          <Segmented label={t('settings.textSize')} value={settings.textSize} onChange={(v) => updateSettings({ textSize: v })} options={['normal', 'large', 'xl'].map((v) => ({ value: v, label: t(`settings.textSize.${v}`) }))} />
        </div>
        <div className="py-3">
          <p className="font-bold mb-2">⏰ {t('settings.sessionLimit')}</p>
          <Segmented label={t('settings.sessionLimit')} value={settings.sessionLimit} onChange={(v) => updateSettings({ sessionLimit: v })} options={[15, 20, 30, 45].map((n) => ({ value: n, label: `${n}′` }))} />
        </div>
      </section>

      {editionPicker && (
        <section className="card p-4">
          <label className="font-bold block mb-2" htmlFor="set-edition">🏷️ {t('settings.edition')}</label>
          <select id="set-edition" className="w-full min-h-[52px] rounded-2xl border border-line bg-surface px-4 font-bold" value={editionId} onChange={(e) => setDeviceEdition(e.target.value)}>
            {content.editions.editions.map((ed) => <option key={ed.id} value={ed.id}>{tx(ed.name)}</option>)}
          </select>
        </section>
      )}

      <section className="card p-4">
        <p className="font-extrabold">🔒 {t('settings.privacy')}</p>
        <p className="text-sm">{t('settings.privacyBody')}</p>
        <p className="text-sm font-bold mt-2">
          ☁️ {t('settings.sync')}: {family?.token && syncStatus !== 'offline' ? `✅ ${t('settings.syncOk')}` : t('settings.syncOffline')}
        </p>
        {family?.code && <p className="text-sm" dir="auto">{t('profiles.familyCode', { code: family.code })}</p>}
        {family?.local && (
          <button className="btn-ghost w-full mt-2" onClick={() => setLinking(true)}>☁️ {t('settings.sync')}</button>
        )}
      </section>

      <Modal open={!!ageGate} onClose={() => setAgeGate(null)} label={t('parent.enterPin')}>
        <p className="text-center font-bold mb-3">{t('parent.enterPin')}</p>
        <PinPad
          error={err}
          onDone={async (pin) => {
            if (await checkPin(pin)) {
              updateProfile({ ageTier: ageGate });
              setAgeGate(null);
              setErr('');
            } else setErr(t('parent.pinWrong'));
          }}
        />
      </Modal>
      <Modal open={linking} onClose={() => setLinking(false)} label={t('settings.sync')}>
        <p className="text-center font-bold mb-3">{t('parent.enterPin')}</p>
        <PinPad
          error={err}
          onDone={async (pin) => {
            try {
              if (await linkFamily(pin)) {
                setLinking(false);
                setErr('');
              } else setErr(t('parent.pinWrong'));
            } catch {
              setErr(t('join.failed'));
            }
          }}
        />
      </Modal>
    </div>
  );
}
