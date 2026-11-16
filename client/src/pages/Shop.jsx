import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { Header, Segmented, Coin, Gem } from '../components/ui.jsx';
import Avatar from '../components/Avatar.jsx';
import Companion from '../components/Companion.jsx';
import { BrandMark } from '../components/Brand.jsx';
import { play } from '../lib/sound.js';

const TYPES = ['bank', 'outfit', 'hat', 'pet', 'decoration', 'mascotSkin'];

function Preview({ item, active, state }) {
  if (item.type === 'outfit' || item.type === 'hat') return <Avatar avatar={active.meta.avatar} level={state.level} equipped={{ ...state.inventory.equipped, [item.type]: item.id }} size={64} />;
  if (item.type === 'mascotSkin') return <Companion id={active.meta.companion} level={state.level} skin={item.id} size={70} bounce={false} />;
  return <span className="text-5xl leading-[80px]" aria-hidden>{item.art}</span>;
}

/** The in-game Town Bank: save coins to earn weekly compound interest, and swap coins for gems. */
function BankPanel({ amt, setAmt, setNote }) {
  const { content, state, dispatch, bank } = useGame();
  const { t } = useT();
  const rate = content.rewards.bank?.weeklyRatePct ?? 5;
  const price = content.rewards.gemPriceCoins ?? 120;
  let projected = state.bank.balance || amt;
  const start = projected;
  for (let w = 0; w < 8; w++) projected += Math.max(1, Math.floor((projected * rate) / 100));
  const act = (ev, ok) => {
    const eff = dispatch(ev);
    const rej = eff.find((e) => e.type === 'rejected');
    setNote(rej ? t('shop.notEnough') : ok);
    play(rej ? 'wrong' : 'coin');
  };
  return (
    <div className="space-y-3 mb-4">
      <section className="card p-4 space-y-3">
        <h2 className="title flex items-center gap-2"><BrandMark brand={bank} size={36} /> {t('bank.title')}</h2>
        <p className="text-soft">{t('bank.intro', { rate })}</p>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-sun-pale p-3">
            <div className="text-xs font-bold text-soft">{t('bank.wallet')}</div>
            <div className="text-2xl font-extrabold flex items-center justify-center gap-1"><Coin size={22} /> <span className="tabular-nums">{state.coins}</span></div>
          </div>
          <div className="rounded-2xl bg-leaf-pale p-3">
            <div className="text-xs font-bold text-soft">{t('bank.saved')}</div>
            <motion.div key={state.bank.balance} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-2xl font-extrabold flex items-center justify-center gap-1">🐷 <span className="tabular-nums">{state.bank.balance}</span></motion.div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center" role="radiogroup" aria-label="amount">
          {[10, 50, 100, 250].map((n) => (
            <button key={n} role="radio" aria-checked={amt === n} onClick={() => setAmt(n)} className={`min-h-[44px] px-4 rounded-2xl border-2 font-bold ${amt === n ? 'border-ink bg-ink text-cream' : 'border-line bg-surface'}`}>{n}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-leaf" disabled={state.coins < amt} onClick={() => act({ type: 'bank.deposit', amount: amt }, `🐷 +${amt}`)}>⬇️ {t('bank.deposit')} {amt}</button>
          <button className="btn-ghost" disabled={state.bank.balance < amt} onClick={() => act({ type: 'bank.withdraw', amount: amt }, `👛 +${amt}`)}>⬆️ {t('bank.withdraw')} {amt}</button>
        </div>
        <p className="text-sm font-bold">📈 {t('bank.projection', { n: start, m: projected })}</p>
        {state.bank.interestEarned > 0 && <p className="text-sm">🌱 {t('bank.earned', { n: state.bank.interestEarned })}</p>}
      </section>
      <section className="card p-4 space-y-2">
        <h2 className="font-extrabold text-lg flex items-center gap-2"><Gem size={22} /> {t('bank.gems')}</h2>
        <p className="text-soft text-sm">{t('bank.gemsHelp', { price })}</p>
        <div className="grid grid-cols-2 gap-2">
          {[1, 5].map((n) => (
            <button key={n} className="btn-sun text-base" disabled={state.coins < n * price} onClick={() => act({ type: 'gems.buy', count: n }, `💎 +${n}`)}>
              {n === 1 ? t('bank.buyGem', { n }) : t('bank.buyGems', { n })} · <Coin size={16} /> {n * price}
            </button>
          ))}
        </div>
      </section>
      <p className="text-xs text-soft text-center">🛡️ {t('bank.noRealMoney')}</p>
    </div>
  );
}

export default function Shop() {
  const { content, state, active, dispatch } = useGame();
  const { t, tx } = useT();
  const [type, setType] = useState('outfit');
  const [amt, setAmt] = useState(50);
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
      <Segmented label={t('shop.title')} value={type} onChange={(v) => { setType(v); setNote(''); }} options={TYPES.map((x) => ({ value: x, label: t(`shop.${x}`), icon: x === 'bank' ? '🏦' : undefined }))} />
      <p className="font-bold text-center my-2 min-h-[1.5rem]" aria-live="polite">{note}</p>
      {type === 'bank' && <BankPanel amt={amt} setAmt={setAmt} setNote={setNote} />}
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
