import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { play, buzz } from '../lib/sound.js';
import Confetti from './Confetti.jsx';
import Companion from './Companion.jsx';
import Building from './Building.jsx';
import BadgeIcon from './BadgeIcon.jsx';
import { evolutionStage, rankForLevel } from '@engine/levels.js';

/** Shows level-ups, new badges, buildings, quest completions and streak news, one at a time. */
export default function Celebrations() {
  const { celebrations, shiftCelebration, content, active, state } = useGame();
  const { t, tx } = useT();
  const cur = celebrations[0];

  // Small news (quests, streaks) shows as a toast; big moments as a modal.
  const isToast = cur && (cur.type === 'questDone' || cur.type === 'streak' || cur.type === 'bankInterest');
  useEffect(() => {
    if (!cur) return;
    if (cur.type === 'levelUp') {
      play('levelUp');
      buzz([30, 40, 60]);
    } else if (cur.type === 'badges') {
      play('badge');
      buzz(40);
    } else if (cur.type.startsWith('building')) {
      play('levelUp');
      buzz([30, 30, 30]);
    } else play('coin');
    if (isToast) {
      const id = setTimeout(shiftCelebration, 2600);
      return () => clearTimeout(id);
    }
  }, [cur]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cur || !active) return null;
  if (isToast) {
    let text = '';
    if (cur.type === 'questDone') {
      const def = [...content.quests.daily, ...content.quests.weekly].find((q) => q.id === cur.questId);
      text = `✅ ${tx(def?.text)}`;
    } else if (cur.type === 'bankInterest') text = `🏦 ${t('bank.interestToast', { n: cur.amount })}`;
    else text = `🔥 ${t(`streak.${cur.result}`, { n: cur.count })}`;
    return (
      <AnimatePresence>
        <motion.button key={celebrations.length + text} onClick={shiftCelebration} initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} className="fixed top-3 inset-x-3 mx-auto max-w-sm z-[70] card px-4 py-3 font-bold text-center" role="status">
          {text}
        </motion.button>
      </AnimatePresence>
    );
  }

  let body = null;
  if (cur.type === 'levelUp') {
    const rank = rankForLevel(cur.level, content.ranks.ranks);
    const evolved = evolutionStage(cur.level) > evolutionStage(cur.from ?? cur.level - 1);
    body = (
      <>
        <Companion id={active.meta.companion} level={cur.level} mood="excited" size={120} skin={state.inventory.equipped.mascotSkin} />
        <h2 className="title text-3xl">{t('levelUp.title')}</h2>
        <p className="text-lg font-bold">{t('levelUp.body', { level: cur.level })}</p>
        {cur.rankChanged && <p className="chip bg-sun-pale text-lg">{rank.icon} {t('levelUp.rank', { rank: tx(rank.name) })}</p>}
        {evolved && <p className="text-soft">{t('levelUp.evolve')}</p>}
      </>
    );
  } else if (cur.type === 'badges') {
    const list = cur.ids.map((id) => content.badgeMap[id]).filter(Boolean);
    const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
    list.sort((a, b) => order[a.rarity] - order[b.rarity]);
    if (list.length === 1) {
      const b = list[0];
      body = (
        <>
          <BadgeIcon badge={b} earned size={110} />
          <p className="chip bg-sky-pale text-sky">{t('badge.new')} · {t(`rarity.${b.rarity}`)}</p>
          <h2 className="title">{tx(b.name)}</h2>
          <p className="text-soft">{tx(b.desc)}</p>
        </>
      );
    } else {
      body = (
        <>
          <h2 className="title">🏅 {t('badge.new')} ×{list.length}</h2>
          <div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto">
            {list.map((b) => (
              <div key={b.id} className="flex flex-col items-center">
                <BadgeIcon badge={b} earned size={64} />
                <span className="text-[11px] font-bold leading-tight">{tx(b.name)}</span>
              </div>
            ))}
          </div>
        </>
      );
    }
  } else {
    const meta = content.worldIndex.find((w) => w.id === cur.worldId);
    body = (
      <>
        <Building type={meta.building} tier={cur.tier} color={meta.color} icon={meta.icon} size={150} />
        <h2 className="title">{cur.type === 'buildingUnlocked' ? t('building.unlocked', { name: tx(meta.name) }) : t('building.upgraded', { name: tx(meta.name), tier: cur.tier })}</h2>
      </>
    );
  }
  return (
    <>
      <Confetti key={celebrations.length + cur.type} />
      <div className="fixed inset-0 z-[65] bg-black/60 flex items-center justify-center p-4" onClick={shiftCelebration}>
        <motion.div role="dialog" aria-modal="true" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 16 }} className="card max-w-sm w-full p-6 flex flex-col items-center text-center gap-3" onClick={(e) => e.stopPropagation()}>
          {body}
          <button className="btn-primary w-full mt-2" onClick={shiftCelebration} autoFocus>
            {t('common.continue')}
          </button>
        </motion.div>
      </div>
    </>
  );
}
