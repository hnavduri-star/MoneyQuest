import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../lib/i18n.js';
import { motion } from 'framer-motion';
import { Modal, Progress, Coin } from './ui.jsx';
import Avatar from './Avatar.jsx';
import { useGame } from '../store.jsx';

/** Full-screen frame for levels: progress, a gentle "leave" button, content. */
export default function PlayFrame({ world, progress, children, footer, color }) {
  const { t } = useT();
  const nav = useNavigate();
  const [quit, setQuit] = useState(false);
  const { active, state, content } = useGame();
  const theme = content.characters.themes.find((x) => x.id === active?.meta?.theme)?.color;
  return (
    <div className="min-h-full max-w-app mx-auto flex flex-col">
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur px-4 pt-3 pb-2 flex items-center gap-3">
        <button className="tap rounded-2xl bg-surface border-2 border-line font-bold" onClick={() => setQuit(true)} aria-label={t('lesson.quit')}>
          ✕
        </button>
        {/* The child's own character walks along the level towards the flag */}
        <div className="relative flex-1 pt-7">
          <Progress value={progress} color={color} height={14} />
          <motion.div className="absolute top-0 -translate-x-1/2 rtl:translate-x-1/2" style={{ insetInlineStart: 0 }} animate={{ insetInlineStart: `${Math.min(0.97, Math.max(0.03, progress)) * 100}%` }} transition={{ type: 'spring', stiffness: 90, damping: 16 }} aria-hidden>
            <Avatar avatar={active?.meta?.avatar} level={state?.level} equipped={state?.inventory?.equipped} size={26} theme={theme} />
          </motion.div>
          <span className="absolute -top-0.5 end-0 text-lg" aria-hidden>🏁</span>
        </div>
        <motion.span key={state?.coins} initial={{ scale: 1.35 }} animate={{ scale: 1 }} className="chip bg-sun-pale font-extrabold" aria-label={`${state?.coins} coins`}>
          <Coin size={18} /> <span className="tabular-nums">{state?.coins}</span>
        </motion.span>
      </div>
      <div className="flex-1 px-4 pb-4">{children}</div>
      {footer && <div className="sticky bottom-0 z-20 px-4 pt-2 pb-safe bg-cream">{footer}</div>}
      <Modal open={quit} onClose={() => setQuit(false)} label={t('lesson.quit')}>
        <p className="font-bold text-lg mb-4">{t('lesson.quitConfirm')}</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={() => setQuit(false)}>
            {t('common.cancel')}
          </button>
          <button className="btn-primary" onClick={() => nav(`/world/${world.id}`)}>
            {t('lesson.quit')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
