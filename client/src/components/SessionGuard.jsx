import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { Modal } from './ui.jsx';
import Mascot from './Mascot.jsx';

/** Friendly break reminder. Never locks the child out and never punishes. */
export default function SessionGuard() {
  const { breakDue, snoozeBreak, settings, signOutProfile } = useGame();
  const { t } = useT();
  return (
    <Modal open={breakDue} onClose={snoozeBreak} label={t('break.title')}>
      <h2 className="title mb-2">🧃 {t('break.title')}</h2>
      <Mascot text={t('break.body', { n: settings.sessionLimit })} mood="happy" size={70} />
      <div className="grid gap-2 mt-3">
        <button
          className="btn-leaf"
          onClick={() => {
            snoozeBreak();
            signOutProfile();
          }}
        >
          {t('break.stop')}
        </button>
        <button className="btn-ghost" onClick={snoozeBreak}>
          {t('break.continue')}
        </button>
      </div>
    </Modal>
  );
}
