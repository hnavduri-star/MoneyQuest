import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { Header, Segmented, Coin, Gem } from '../components/ui.jsx';
import Avatar from '../components/Avatar.jsx';
import Companion from '../components/Companion.jsx';
import { play } from '../lib/sound.js';

const TYPES = ['outfit', 'hat', 'pet', 'decoration', 'mascotSkin'];

function Preview({ item, active, state }) {
  if (item.type === 'outfit' || item.type === 'hat') return <Avatar avatar={active.meta.avatar} level={state.level} equipped={{ ...state.inventory.equipped, [item.type]: item.id }} size={64} />;
  if (item.type === 'mascotSkin') return <Companion id={active.meta.companion} level={state.level} skin={item.id} size={70} bounce={false} />;
  return <span className="text-5xl leading-[80px]" aria-hidden>{item.art}</span>;
}

export default function Shop() {
  const { content, state, active, dispatch } = useGame();
  const { t, tx } = useT();
  const [type, setType] = useState('outfit');
  const [note, setNote] = useState('');
  const items = Object.values(content.items).filter((i) => i.type === type);

  const buy = (item) => {
    const eff = dispatch({ type: 'shop.buy', itemId: item.id });
    const rej = eff.find((e) => e.type === 'rejected');
    if (rej) {
      setNote(t('shop.notEnough'));
      play('wrong');
    } else {
      setNote(`🎉 ${t('shop.bought')}`);
      play('coin');
    }
  };
  return (
    <div>
      <Header title={t('shop.title')} />
      <p className="text-sm text-soft mb-3">🛡️ {t('shop.note')}</p>
      <Segmented label={t('shop.title')} value={type} onChange={setType} options={TYPES.map((x) => ({ value: x, label: t(`shop.${x}`) }))} />
      <p className="font-bold text-center my-2 min-h-[1.5rem]" aria-live="polite">{note}</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const owned = state.inventory.owned.includes(item.id);
          const inUse = item.type === 'decoration' ? state.inventory.decorations.includes(item.id) : state.inventory.equipped[item.type] === item.id;
          const needLevel = item.unlock?.level && state.level < item.unlock.level;
          const needBadge = item.unlock?.badge && !state.badges[item.unlock.badge];
          const price = item.price.gems ? (
            <span className="flex items-center gap-1"><Gem size={16} />{item.price.gems}</span>
          ) : (
            <span className="flex items-center gap-1"><Coin size={16} />{item.price.coins}</span>
          );
          const afford = state.coins >= (item.price.coins || 0) && state.gems >= (item.price.gems || 0);
          return (
            <motion.div key={item.id} layout className={`card p-3 flex flex-col items-center text-center ${inUse ? 'ring-4 ring-leaf' : ''}`}>
              <div className="h-20 flex items-center justify-center overflow-hidden">
                <Preview item={item} active={active} state={state} />
              </div>
              <p className="font-extrabold leading-tight mt-1">{tx(item.name)}</p>
              {owned ? (
                <button className="btn-ghost w-full mt-2 min-h-[44px] text-base" onClick={() => dispatch({ type: 'item.equip', itemId: item.id })}>
                  {inUse ? `✓ ${t('shop.unequip')}` : t('shop.equip')}
                </button>
              ) : needLevel || needBadge ? (
                <p className="mt-2 text-sm font-bold text-soft">🔒 {needLevel ? t('shop.needLevel', { n: item.unlock.level }) : t('shop.needBadge')}</p>
              ) : (
                <button className={`${afford ? 'btn-sun' : 'btn-ghost'} w-full mt-2 min-h-[44px] text-base`} onClick={() => buy(item)}>
                  {t('shop.buy')} · {price}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
