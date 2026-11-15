import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import Avatar from '../components/Avatar.jsx';
import PinPad from '../components/PinPad.jsx';
import { Modal } from '../components/ui.jsx';

export default function Profiles() {
  const { profiles, switchProfile, family, content, deleteProfile, themeColor } = useGame();
  const { t } = useT();
  const nav = useNavigate();
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState('');
  const list = Object.values(profiles);
  return (
    <div className="min-h-full max-w-app mx-auto px-5 py-8">
      <h1 className="title text-3xl text-center mb-6">{t('profiles.who')}</h1>
      <div className="grid grid-cols-2 gap-4">
        {list.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-3 flex flex-col items-center relative">
            <button
              className="flex flex-col items-center w-full"
              onClick={() => {
                switchProfile(p.id);
                nav('/town');
              }}
            >
              <Avatar avatar={p.meta.avatar} level={p.state.level} equipped={p.state.inventory.equipped} size={92} theme={themeColor(p.meta.theme)} />
              <span className="font-extrabold text-lg mt-1">{p.nickname}</span>
              <span className="text-sm text-soft">
                {t('common.level')} {p.state.level}
              </span>
            </button>
            <button className="absolute top-2 end-2 w-9 h-9 rounded-full bg-cream text-sm" aria-label={t('profiles.delete')} onClick={() => setRemoving(p)}>
              ✕
            </button>
          </motion.div>
        ))}
        <button onClick={() => nav('/create')} className="card p-3 min-h-[180px] flex flex-col items-center justify-center border-dashed border-2 text-soft font-bold">
          <span className="text-5xl" aria-hidden>
            ＋
          </span>
          {t('profiles.add')}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-6">
        <button className="btn-ghost" onClick={() => nav('/parent')}>👨‍👩‍👧 {t('parentMode.title')}</button>
        <button className="btn-ghost" onClick={() => nav('/teacher')}>🏫 {t('welcome.teacher')}</button>
      </div>
      {family?.code && <p className="text-center text-soft mt-4" dir="auto">{t('profiles.familyCode', { code: family.code })}</p>}
      <Modal open={!!removing} onClose={() => setRemoving(null)} label={t('profiles.delete')}>
        {removing && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="font-bold">{t('profiles.deleteConfirm', { name: removing.nickname })}</p>
            <p className="text-soft">{t('parent.enterPin')}</p>
            <PinPad
              error={error}
              onDone={async (pin) => {
                const ok = await deleteProfile(removing.id, pin);
                if (ok) {
                  setRemoving(null);
                  setError('');
                } else setError(t('parent.pinWrong'));
              }}
            />
            <button className="btn-ghost w-full" onClick={() => setRemoving(null)}>
              {t('common.cancel')}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
