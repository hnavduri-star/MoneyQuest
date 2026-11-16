import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { LANGUAGES } from '../content.js';
import Building from '../components/Building.jsx';
import Companion from '../components/Companion.jsx';
import PinPad from '../components/PinPad.jsx';
import { Segmented } from '../components/ui.jsx';
import { PartnerStrip } from '../components/Brand.jsx';

/** First run: a grown-up sets the parent PIN (or links this device to an existing family). */
export default function Welcome() {
  const { createFamily, joinFamily, setDeviceLang, lang, appearance, setDeviceAppearance, editionPicker, editionId, setDeviceEdition, content } = useGame();
  const { t, tx } = useT();
  const [step, setStep] = useState('hello');
  const [first, setFirst] = useState(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="min-h-full max-w-app mx-auto px-5 py-8 flex flex-col">
      <div className="flex justify-between gap-2 flex-wrap">
        <Segmented label="theme" value={appearance} onChange={setDeviceAppearance} options={[{ value: 'light', label: '☀️' }, { value: 'dark', label: '🌙' }]} />
        <Segmented label="language" value={lang} onChange={setDeviceLang} options={LANGUAGES.map((l) => ({ value: l.id, label: l.name }))} />
      </div>
      {step === 'hello' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <motion.div className="flex items-end" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Building type="home" tier={1} color="#E69F00" size={110} />
            <Building type="bank" tier={2} color="#0072B2" size={130} />
            <Building type="piggy-house" tier={3} color="#CC79A7" size={110} />
          </motion.div>
          <div className="flex gap-1">
            {['owl', 'camel', 'robot', 'dragon'].map((c) => <Companion key={c} id={c} size={56} />)}
          </div>
          <h1 className="title text-4xl">{t('welcome.title')}</h1>
          <div className="w-full"><PartnerStrip /></div>
          <p className="text-lg text-soft">{t('welcome.body')}</p>
          <button className="btn-primary w-full mt-2" onClick={() => setStep('pin')}>
            {t('welcome.start')} →
          </button>
          <button className="btn-ghost w-full" onClick={() => setStep('join')}>
            {t('welcome.join')}
          </button>
          <p className="text-sm text-soft mt-2">🔒 {t('parent.privacy')}</p>
          {editionPicker && (
            <label className="w-full text-start text-sm font-bold">
              🏷️ {t('welcome.edition')}
              <select className="mt-1 w-full min-h-[48px] rounded-2xl border border-line bg-surface px-3 font-bold" value={editionId} onChange={(e) => setDeviceEdition(e.target.value)}>
                {content.editions.editions.map((ed) => <option key={ed.id} value={ed.id}>{tx(ed.name)}</option>)}
              </select>
            </label>
          )}
        </div>
      )}
      {step === 'pin' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
          <h1 className="title">👨‍👩‍👧 {t('parent.gateTitle')}</h1>
          <p className="text-soft">{first ? t('parent.confirmPin') : t('parent.setPin')}</p>
          <PinPad
            error={error}
            onDone={async (p) => {
              if (!first) {
                setFirst(p);
                setError('');
                return;
              }
              if (p !== first) {
                setFirst(null);
                setError(t('parent.pinMismatch'));
                return;
              }
              setBusy(true);
              await createFamily(p);
            }}
          />
          {busy && <p aria-live="polite">…</p>}
          <button className="btn-ghost" onClick={() => setStep('hello')}>
            {t('common.back')}
          </button>
        </div>
      )}
      {step === 'join' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <h1 className="title">{t('join.title')}</h1>
          <label className="w-full text-start font-bold">
            {t('join.code')}
            <input className="mt-1 w-full min-h-[56px] rounded-2xl border-2 border-line px-4 text-2xl tracking-widest uppercase text-center" dir="ltr" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCD-EFGH" autoComplete="off" />
          </label>
          <p className="text-soft">{t('parent.enterPin')}</p>
          <PinPad
            error={error}
            onDone={async (p) => {
              setError('');
              try {
                await joinFamily(code, p);
              } catch {
                setError(t('join.failed'));
              }
            }}
          />
          <button className="btn-ghost" onClick={() => setStep('hello')}>
            {t('common.back')}
          </button>
        </div>
      )}
    </div>
  );
}
