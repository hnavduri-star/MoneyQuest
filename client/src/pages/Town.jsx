import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { useWorlds, useDueReviews } from '../lib/hooks.js';
import { townLiveliness } from '@engine/town.js';
import Building from '../components/Building.jsx';
import Avatar from '../components/Avatar.jsx';
import Mascot from '../components/Mascot.jsx';
import { play } from '../lib/sound.js';

const WALKERS = ['🚶', '🚴', '🧍', '🛵', '🚶‍♀️', '🧑‍🦽', '🛴', '🚗', '🚌', '🏃'];

export default function Town() {
  const { state, active, content, settings, isDark } = useGame();
  const { t, tx } = useT();
  const nav = useNavigate();
  const worlds = useWorlds();
  const due = useDueReviews();
  const live = townLiveliness(state, content);
  const theme = content.characters.themes.find((x) => x.id === active.meta.theme)?.color;
  const pet = content.items[state.inventory.equipped.pet];
  const decorations = state.inventory.decorations.map((id) => content.items[id]).filter(Boolean);
  const current = worlds.find((w) => w.status === 'open');
  const walkers = Math.round(2 + live * 10);
  const greeting = useMemo(() => {
    if (state.stats.levelsCompleted ? false : true) return t('town.hello');
    return t('town.welcome', { name: active.nickname });
  }, [state.stats.levelsCompleted, active.nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <Mascot text={greeting} mood="happy" size={72} />

      {/* Town scene */}
      <section className="relative rounded-blob overflow-hidden border border-line shadow-card" aria-label={t('nav.town')}>
        <div className="absolute inset-0" style={{ background: isDark ? 'linear-gradient(#0B1330, #1B2A5A 45%, #23506A 58%, #1E4A3A 62%)' : `linear-gradient(#BFE6FA, #E9F7FD ${40 + live * 20}%, #A8DCA0 60%)` }} />
        {isDark &&
          Array.from({ length: 18 }, (_, i) => (
            <motion.span key={i} className="absolute rounded-full bg-white" style={{ width: 2 + (i % 3), height: 2 + (i % 3), top: 6 + ((i * 37) % 70), left: `${(i * 53) % 100}%` }} animate={settings.reducedMotion ? {} : { opacity: [0.2, 1, 0.2] }} transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.2 }} aria-hidden />
          ))}
        <motion.div className="absolute top-3 end-6 text-5xl" style={isDark ? { filter: 'drop-shadow(0 0 12px rgba(255,240,180,.7))' } : undefined} animate={settings.reducedMotion ? {} : { rotate: [0, 10, 0] }} transition={{ duration: 8, repeat: Infinity }} aria-hidden>
          {isDark ? '🌙' : '☀️'}
        </motion.div>
        {!isDark && [0, 1].map((i) => (
          <motion.div key={i} className="absolute text-4xl opacity-80" style={{ top: 12 + i * 34 }} initial={{ x: i ? 260 : -60 }} animate={settings.reducedMotion ? {} : { x: [i ? 260 : -60, i ? -60 : 380] }} transition={{ duration: 40 + i * 15, repeat: Infinity, ease: 'linear' }} aria-hidden>
            ☁️
          </motion.div>
        ))}
        <div className="relative pt-20 px-2 pb-3">
          <div className="grid grid-cols-3 gap-y-1 items-end">
            {/* Home with the avatar and pet */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <Building type="home" tier={1} color={theme} size={96} label={t('town.home')} night={isDark} />
                <div className="absolute -bottom-1 -start-4 flex items-end">
                  <Avatar avatar={active.meta.avatar} level={state.level} equipped={state.inventory.equipped} size={40} theme={theme} />
                  {pet && <span className="text-2xl -ms-1">{pet.art}</span>}
                </div>
              </div>
              <span className="text-xs font-bold bg-surface/80 rounded-full px-2">{t('town.home')}</span>
            </div>
            <div className="flex flex-col items-center">
              <Building type="hall" tier={1} size={96} label={t('town.hall')} night={isDark} />
              <span className="text-xs font-bold bg-surface/80 rounded-full px-2">{t('town.hall')}</span>
            </div>
            {worlds.filter(({ meta }) => meta.playable).map(({ meta, status }) => {
              const tier = meta.playable ? state.town.buildings[meta.id] ?? 0 : 0;
              const locked = !meta.playable || status === 'locked' || status === 'age-locked';
              return (
                <button
                  key={meta.id}
                  className="flex flex-col items-center focus-visible:ring-4 rounded-2xl"
                  onClick={() => {
                    play('tap');
                    nav(meta.playable ? `/world/${meta.id}` : '/worlds');
                  }}
                  aria-label={`${tx(meta.name)}: ${locked ? t('common.locked') : typeof tier === 'number' && tier > 0 ? t('town.plot.tier', { tier }) : t('town.plot.building')}`}
                >
                  <div className={locked ? 'opacity-55 saturate-50' : ''}>
                    <Building type={meta.building} tier={tier} color={meta.color} icon={meta.icon} size={96} night={isDark} />
                  </div>
                  <span className="text-xs font-bold bg-surface/85 rounded-full px-2 leading-tight text-center max-w-[100px] truncate">
                    {locked && '🔒 '}
                    {tx(meta.name)}
                  </span>
                  {typeof tier === 'number' && tier > 0 && <span className="text-[11px] font-bold">{'★'.repeat(tier)}</span>}
                </button>
              );
            })}
          </div>
          {/* Districts arriving in future updates: small signposts so the town shows where it will grow */}
          <button className="mt-3 w-full rounded-2xl bg-surface/70 px-3 py-2 text-start" onClick={() => nav('/worlds')}>
            <span className="text-xs font-bold text-soft">🚧 {t('common.comingSoon')}</span>
            <span className="flex flex-wrap gap-1 text-xl mt-1" aria-hidden>
              {worlds.filter(({ meta }) => !meta.playable).map(({ meta }) => <span key={meta.id} className="opacity-70" title={tx(meta.name)}>{meta.icon}</span>)}
            </span>
          </button>
          {/* Decorations bought in the shop */}
          {decorations.length > 0 && (
            <div className="flex justify-center gap-3 text-3xl mt-2" aria-label={t('shop.decoration')}>
              {decorations.map((d) => <span key={d.id} title={tx(d.name)}>{d.art}</span>)}
            </div>
          )}
        </div>
        {/* Road with walkers: busier as the town grows */}
        <div className={`relative h-12 border-t-4 overflow-hidden ${isDark ? 'bg-[#2A3346] border-[#3B4660]' : 'bg-[#8E9AA6] border-[#C9D3DC]'}`} aria-hidden>
          <div className="absolute top-1/2 inset-x-0 border-t-2 border-dashed border-white/70" />
          {Array.from({ length: walkers }, (_, i) => (
            <motion.span key={i} className="absolute top-1 text-2xl" initial={{ x: -40 }} animate={settings.reducedMotion ? { x: 30 + i * 36 } : { x: [-40 - i * 30, 560] }} transition={{ duration: 14 + (i % 4) * 4, repeat: Infinity, delay: i * 1.6, ease: 'linear' }}>
              {WALKERS[i % WALKERS.length]}
            </motion.span>
          ))}
        </div>
      </section>
      <p className="text-center text-sm text-soft">{t('town.tapBuilding')}</p>

      {current?.next && (
        <button className="btn-primary w-full text-xl" onClick={() => nav(`/play/${current.meta.id}/${current.next.id}`)}>
          ▶ {t('town.continue', { world: tx(current.meta.name) })}
        </button>
      )}
      {due.length > 0 && (
        <button className="card w-full p-4 flex items-center gap-3 text-start" onClick={() => nav('/review')}>
          <span className="text-4xl" aria-hidden>🔁</span>
          <span className="flex-1">
            <span className="font-extrabold block">{t('town.reviewDue', { n: due.length })}</span>
            <span className="text-sm text-soft">{t('town.reviewCta')}</span>
          </span>
          <span className="rtl:rotate-180">→</span>
        </button>
      )}
    </div>
  );
}
