import { AnimatePresence, motion } from 'framer-motion';
import { play } from '../lib/sound.js';

export function Stars({ n = 0, size = 22, label }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={label || `${n} / 3`}>
      {[1, 2, 3].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" fill={i <= n ? '#F7C95C' : '#E7DCC8'} stroke={i <= n ? '#B07400' : '#CDBFA6'} strokeWidth="1.2" />
        </svg>
      ))}
    </span>
  );
}

export function Progress({ value, color = 'var(--theme)', height = 12, label }) {
  const pct = Math.max(0, Math.min(1, value || 0));
  return (
    <div className="w-full rounded-full bg-soft/20 overflow-hidden" style={{ height }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)} aria-label={label}>
      <motion.div className="h-full rounded-full" style={{ background: color }} initial={false} animate={{ width: `${pct * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
    </div>
  );
}

/** Brushed-gold coin: satin gradient rim, embossed face, soft highlight. */
export function Coin({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="mqCoinRim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE7A0" />
          <stop offset="0.55" stopColor="#E3A21A" />
          <stop offset="1" stopColor="#9A6200" />
        </linearGradient>
        <radialGradient id="mqCoinFace" cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#FFF1C4" />
          <stop offset="0.45" stopColor="#F5C445" />
          <stop offset="1" stopColor="#C98800" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#mqCoinRim)" />
      <circle cx="12" cy="12" r="8" fill="url(#mqCoinFace)" stroke="#A86F00" strokeOpacity="0.45" strokeWidth="0.8" />
      <path d="M12 7.2l1.4 2.9 3.1.4-2.3 2.1.6 3.1L12 14.2l-2.8 1.5.6-3.1-2.3-2.1 3.1-.4z" fill="#B47A00" opacity="0.55" />
      <ellipse cx="8.8" cy="7.6" rx="3" ry="1.4" fill="#fff" opacity="0.45" transform="rotate(-30 8.8 7.6)" />
    </svg>
  );
}
/** Cut gem with facets and a soft glint. */
export function Gem({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="mqGem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B9E6FF" />
          <stop offset="0.5" stopColor="#3FA3E0" />
          <stop offset="1" stopColor="#0B4F86" />
        </linearGradient>
      </defs>
      <path d="M6 3h12l4 6-10 12L2 9z" fill="url(#mqGem)" stroke="#0B4F86" strokeWidth="1" strokeLinejoin="round" />
      <path d="M2 9h20M9 3l3 18 3-18M6 3l3 6 3-6 3 6 3-6" stroke="#E8F7FF" strokeWidth="0.7" fill="none" opacity="0.6" />
      <path d="M8 5l1.5 3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export function RewardRow({ xp, coins, gems, t }) {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {xp > 0 && <span className="chip bg-leaf-pale text-leaf text-base">+{xp} {t('common.xp')}</span>}
      {coins > 0 && (
        <span className="chip bg-sun-pale text-ink text-base">
          <Coin size={18} /> +{coins}
        </span>
      )}
      {gems > 0 && (
        <span className="chip bg-sky-pale text-sky text-base">
          <Gem size={18} /> +{gems}
        </span>
      )}
    </div>
  );
}

export function Modal({ open, onClose, children, label, wide }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`card w-full ${wide ? 'max-w-app' : 'max-w-sm'} p-5 max-h-[90vh] overflow-y-auto`}
            initial={{ y: 60, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toggle({ checked, onChange, label, help }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer min-h-[52px]">
      <span>
        <span className="font-bold block">{label}</span>
        {help && <span className="text-sm text-soft">{help}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => {
          play('tap');
          onChange(!checked);
        }}
        className={`relative shrink-0 w-14 h-8 rounded-full transition ${checked ? 'bg-leaf' : 'bg-soft/35'}`}
      >
        <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${checked ? 'start-7' : 'start-1'}`} />
        <span className="sr-only">{checked ? 'on' : 'off'}</span>
      </button>
    </label>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => {
            play('tap');
            onChange(o.value);
          }}
          className={`min-h-[48px] px-4 rounded-2xl border-2 font-bold transition ${value === o.value ? 'border-ink bg-ink text-cream' : 'border-line bg-surface'}`}
        >
          {o.icon && <span className="me-1" aria-hidden>{o.icon}</span>}
          {o.label}
          {value === o.value && <span className="ms-1" aria-hidden>✓</span>}
        </button>
      ))}
    </div>
  );
}

export function Header({ title, onBack, right }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {onBack && (
        <button onClick={onBack} className="tap rounded-2xl bg-surface border-2 border-line font-bold text-xl" aria-label="back">
          <span className="inline-block rtl:rotate-180">←</span>
        </button>
      )}
      <h1 className="title flex-1">{title}</h1>
      {right}
    </div>
  );
}
