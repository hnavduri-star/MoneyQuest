import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../lib/i18n.js';
import { Modal, Progress } from './ui.jsx';

/** Full-screen frame for levels: progress, a gentle "leave" button, content. */
export default function PlayFrame({ world, progress, children, footer, color }) {
  const { t } = useT();
  const nav = useNavigate();
  const [quit, setQuit] = useState(false);
  return (
    <div className="min-h-full max-w-app mx-auto flex flex-col">
      <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur px-4 pt-3 pb-2 flex items-center gap-3">
        <button className="tap rounded-2xl bg-white border-2 border-line font-bold" onClick={() => setQuit(true)} aria-label={t('lesson.quit')}>
          ✕
        </button>
        <Progress value={progress} color={color} height={14} />
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
