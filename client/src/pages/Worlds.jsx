import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';
import { useWorlds } from '../lib/hooks.js';
import { Progress } from '../components/ui.jsx';
import Avatar from '../components/Avatar.jsx';
import Companion from '../components/Companion.jsx';
import Skyline from '../components/Skyline.jsx';
import JourneyCard from '../components/JourneyCard.jsx';
import { PartnerStrip } from '../components/Brand.jsx';
import { play } from '../lib/sound.js';

/**
 * The Dubai Money Journey: playable worlds are stops along a road. The child's own character stands at
 * the current stop; finishing a stop's boss unlocks the next one.
 */
export default function Worlds() {
  const { t, tx } = useT();
  const { active, state, content, themeColor, city, isDark, bank } = useGame();
  const nav = useNavigate();
  const worlds = useWorlds();
  const stops = worlds.filter((w) => w.meta.playable);
  const later = worlds.filter((w) => !w.meta.playable);
  const currentIdx = Math.max(0, stops.findIndex((w) => w.status === 'open'));
  const theme = themeColor(active.meta.theme);

  return (
    <div>
      <div className="rounded-blob overflow-hidden border border-line shadow-card mb-4">
        <Skyline city={city.skyline} dark={isDark} height={110} />
        <div className="bg-surface p-4">
          <h1 className="title">{city.flag} {t('journey.title')}</h1>
          <p className="text-soft">{t('journey.intro')}</p>
        </div>
      </div>

      <div className="mb-4"><JourneyCard compact /></div>
      <div className="mb-4"><PartnerStrip compact /></div>
      <ol className="relative">
        {/* the road */}
        <div className="absolute top-6 bottom-6 start-1/2 w-3 -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-[#C9D3DC]" aria-hidden>
          <div className="absolute inset-y-0 start-1/2 border-s-2 border-dashed border-white" />
        </div>
        {stops.map(({ meta: base, status, stars }, i) => {
          const stop = city.stops[base.id];
          const meta = { ...base, location: stop?.location || base.location, landmark: stop?.landmark || base.landmark, color: base.sponsored ? bank.colors.primary : base.color };
          const open = status === 'open' || status === 'complete';
          const here = i === currentIdx && status === 'open';
          const left = i % 2 === 0;
          return (
            <motion.li key={meta.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`relative flex mb-5 ${left ? 'justify-start' : 'justify-end'}`}>
              {/* stop marker on the road */}
              <span className={`absolute top-8 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-10 w-9 h-9 rounded-full border-4 border-white flex items-center justify-center text-sm font-extrabold text-white shadow`} style={{ background: open ? meta.color : '#9AA0A6' }} aria-hidden>
                {status === 'complete' ? '✓' : i + 1}
              </span>
              <button
                disabled={!open}
                onClick={() => {
                  play('tap');
                  nav(`/world/${meta.id}`);
                }}
                className={`relative w-[46%] card p-3 text-start ${open ? '' : 'opacity-60'} ${here ? 'ring-4' : ''}`}
                style={here ? { '--tw-ring-color': meta.color } : undefined}
                aria-label={`${t('journey.stop', { n: i + 1 })}: ${tx(meta.location)}, ${tx(meta.name)}`}
              >
                <span className="text-4xl block" aria-hidden>{open ? meta.landmark : '🔒'}</span>
                <span className="text-[11px] font-bold uppercase text-soft block">{t('journey.stop', { n: i + 1 })} · {tx(meta.location)}</span>
                <span className="font-extrabold leading-tight block">{meta.icon} {tx(meta.name)}</span>
                {open && (
                  <span className="flex items-center gap-1 mt-1">
                    <Progress value={stars.got / (stars.max || 1)} color={meta.color} height={6} />
                    <span className="text-[11px] font-bold whitespace-nowrap">⭐{stars.got}/{stars.max}</span>
                  </span>
                )}
                {status === 'complete' && <span className="chip bg-leaf-pale text-leaf text-xs mt-1">✅ {t('journey.done')}</span>}
                {here && <span className="btn-primary min-h-[40px] text-sm mt-2 w-full" style={{ '--btn': meta.color }}>▶ {t('common.continue')}</span>}
              </button>
              {here && (
                <motion.div className={`absolute top-0 ${left ? 'end-0' : 'start-0'} w-[46%] flex flex-col items-center`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }} aria-hidden>
                  <span className="chip bg-ink text-cream text-xs">📍 {t('journey.here')}</span>
                  <div className="flex items-end">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
                      <Avatar avatar={active.meta.avatar} level={state.level} equipped={state.inventory.equipped} size={64} theme={theme} />
                    </motion.div>
                    <Companion id={active.meta.companion} level={state.level} skin={state.inventory.equipped.mascotSkin} size={44} />
                  </div>
                </motion.div>
              )}
            </motion.li>
          );
        })}
      </ol>

      {later.length > 0 && (
        <div className="card p-4 mt-2">
          <p className="font-extrabold">🚧 {t('journey.more')}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {later.map(({ meta }) => (
              <span key={meta.id} className="chip bg-cream text-xs">{meta.icon} {tx(meta.name)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
