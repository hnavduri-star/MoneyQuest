import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { BrandMark } from '../components/Brand.jsx';
import PinPad from '../components/PinPad.jsx';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { useVisibleNodes } from '../lib/hooks.js';
import { isNodeUnlocked, nodeProgress, worldStatus } from '@engine/progress.js';
import { Stars, Header, Modal } from '../components/ui.jsx';
import Building from '../components/Building.jsx';
import { play } from '../lib/sound.js';

export default function WorldMap() {
  const { worldId } = useParams();
  const { content, state, age, city, bank, checkPin, dispatch } = useGame();
  const { worldId: wid } = useParams();
  const { t, tx } = useT(wid);
  const [gate, setGate] = useState(null);
  const [pinErr, setPinErr] = useState('');
  const nav = useNavigate();
  const world = content.worlds[worldId];
  const meta = content.worldIndex.find((w) => w.id === worldId);
  const nodes = useVisibleNodes(world);
  if (!world || !meta) return <Navigate to="/worlds" replace />;
  const status = worldStatus(state, meta, content, age);
  if (status === 'locked' || status === 'coming-soon') return <Navigate to="/worlds" replace />;
  const tier = state.town.buildings[worldId] ?? 0;

  return (
    <div>
      <Header title={tx(world.name)} onBack={() => nav('/worlds')} />
      <div className="card p-3 flex items-center gap-3 mb-5" style={{ borderColor: meta.color }}>
        <Building type={meta.building} tier={tier} color={meta.sponsored ? bank.colors.primary : meta.color} icon={meta.icon} size={84} sign={meta.sponsored ? tx(bank.short) : undefined} />
        <div className="flex-1">
          <p className="text-xs font-bold uppercase text-soft">📍 {tx(city.stops[worldId]?.location || meta.location)}, {tx(city.name)}</p>
          <p className="text-soft">{tx(world.tagline)}</p>
        </div>
      </div>

      {!state.checks?.[worldId]?.pre && !nodes.some((n) => state.progress?.[worldId]?.[n.id]) && (
        <button className="card w-full p-4 mb-4 flex items-center gap-3 text-start" onClick={() => nav(`/check/${worldId}/pre`)}>
          <span className="text-3xl" aria-hidden>🧠</span>
          <span className="flex-1">
            <span className="font-extrabold block">{t('check.beforeTitle')}</span>
            <span className="text-sm text-soft">{t('check.intro')}</span>
          </span>
          <span className="rtl:rotate-180">→</span>
        </button>
      )}
      <ol className="relative flex flex-col gap-3">
        {nodes.map((n, i) => {
          const done = nodeProgress(state, worldId, n.id);
          const open = isNodeUnlocked(state, world, n.id, age);
          const offset = [0, 40, 70, 40][i % 4];
          return (
            <motion.li key={n.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} style={{ marginInlineStart: offset }}>
              <button
                disabled={!open}
                onClick={() => {
                  play('tap');
                  nav(`/play/${worldId}/${n.id}`);
                }}
                className={`flex items-center gap-3 text-start ${open ? '' : 'opacity-50'}`}
              >
                <span className={`relative w-[72px] h-[72px] shrink-0 rounded-full flex items-center justify-center text-3xl border-4 shadow-pop ${n.kind === 'boss' ? 'w-[84px] h-[84px] text-4xl' : ''}`} style={{ background: done ? meta.color : open ? '#FFFFFF' : '#E7DCC8', borderColor: meta.color }}>
                  <span aria-hidden>{open ? n.icon : '🔒'}</span>
                  {open && !done && <motion.span className="absolute inset-0 rounded-full border-4" style={{ borderColor: meta.color }} animate={{ scale: [1, 1.25], opacity: [0.8, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />}
                </span>
                <span>
                  <span className="text-xs font-bold uppercase text-soft block">
                    {t(`node.${n.kind}`)}
                    {n.optional && ` · ${t('worlds.optional')}`}
                  </span>
                  <span className="font-extrabold block leading-tight">{tx(n.title)}</span>
                  {done && <Stars n={done.stars} size={18} />}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ol>

      {content.missions?.[worldId] && (
        <div className="card p-4 mt-6">
          <p className="font-extrabold">{content.missions[worldId].icon} {t('mission.title')}</p>
          <p className="my-1">{tx(content.missions[worldId].text)}</p>
          <p className="text-sm text-soft mb-2">🪙 {t('mission.reward', { n: content.missions[worldId].reward.coins })}</p>
          {!state.missions?.[worldId] ? (
            <button className="btn-leaf w-full" onClick={() => dispatch({ type: 'mission.done', worldId })}>✅ {t('mission.did')}</button>
          ) : state.missions[worldId].status === 'pending' ? (
            <p className="chip bg-sun-pale">⏳ {t('mission.pending')}</p>
          ) : (
            <p className="chip bg-leaf-pale">🏅 {t('mission.approved')}</p>
          )}
        </div>
      )}
      {meta.sponsored && bank.sponsor && (
        <div className="card p-4 mt-6">
          <div className="flex items-center gap-3">
            <BrandMark brand={bank} size={44} />
            <div className="flex-1">
              <p className="text-xs font-bold uppercase text-soft">{t('partner.forGrownUps')}</p>
              <p className="font-extrabold">{t('partner.learnMore')}</p>
            </div>
            <button className="btn-ghost min-h-[44px] text-base" onClick={() => setGate('pin')}>🔒</button>
          </div>
          <p className="text-xs text-soft mt-2">{t('partner.note')}</p>
        </div>
      )}
      <Modal open={!!gate} onClose={() => { setGate(null); setPinErr(''); }} label={t('partner.forGrownUps')}>
        {gate === 'pin' ? (
          <div className="flex flex-col items-center gap-3">
            <p className="font-bold">{t('parent.enterPin')}</p>
            <PinPad error={pinErr} onDone={async (pin) => ((await checkPin(pin)) ? setGate('info') : setPinErr(t('parent.pinWrong')))} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3"><BrandMark brand={bank} size={48} /><h2 className="title">{tx(bank.name)}</h2></div>
            <p>{tx(bank.parentInfo)}</p>
            {bank.website && (
              <p className="text-sm">
                {t('partner.website')}: <a className="underline font-bold break-all" href={bank.website} target="_blank" rel="noopener noreferrer">{bank.website}</a>
              </p>
            )}
            <button className="btn-primary w-full" onClick={() => setGate(null)}>{t('common.close')}</button>
          </div>
        )}
      </Modal>

      {world.realLife && (
        <div className="card p-4 mt-6 bg-leaf-pale">
          <p className="font-extrabold">🏡 {t('worlds.realLife')}</p>
          <p>{tx(world.realLife)}</p>
        </div>
      )}
    </div>
  );
}
