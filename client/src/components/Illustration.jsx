import { motion } from 'framer-motion';

/** Small animated scenes for story steps, keyed by `art` in the lesson JSON (see engine/registry.js STEP_ART). */
const SCENES = {
  barter: ['🐟', '⇄', '🍎'],
  coins: ['🪙', '💵', '🪙'],
  cards: ['🪙', '💳', '📱'],
  needs: ['🍞', '🏠', '🎮'],
  thinking: ['🤔', '💭', '🎈'],
  work: ['👩‍🍳', '🧑‍🔧', '👨‍🏫'],
  jar: ['🫙', '💰', '🫙'],
  goal: ['🐷', '➜', '🚲'],
  bank: ['🏦', '🔒', '💰'],
  grow: ['💰', '🌱', '🌳'],
  percent: ['💯', '➗', '5️⃣'],
  snowball: ['❄️', '☃️', '⛄'],
  loan: ['🏦', '➜', '🧑', '↩︎'],
  partners: ['🤝', '🏪', '📈'],
  souk: ['🕌', '🐪', '🦪', '🌴'],
  difc: ['🏙️', '🏦', '💼'],
  office: ['🏢', '👩‍💼', '💼'],
  payday: ['🏢', '➜', '🏦', '➜', '👩‍💼'],
  family: ['👨‍👩‍👧‍👦', '🏡', '📋'],
  bills: ['🧾', '💡', '🛒'],
  storm: ['🌩️', '🚗', '☔'],
  notes: ['💵', '🇦🇪', '🪙'],
  atm: ['💳', '🏧', '🏦'],
  shield: ['🔐', '🛡️', '🤫'],
  phone: ['📱', '💳', '🛍️'],
  flags: ['🇦🇪', '🇸🇦', '🇮🇳', '🇺🇸', '🇪🇺'],
  exchange: ['💵', '⇄', '💶'],
  chart: ['📉', '📈', '💱'],
  stand: ['🏖️', '🍋', '🥤'],
  ingredients: ['🍋', '🌿', '🧊', '🥤'],
  profit: ['💰', '➖', '🧾'],
  price: ['🏷️', '🤔', '🧍'],
  shares: ['🏢', '➗', '📄', '🧑‍🤝‍🧑'],
  trading: ['🙋', '🏛️', '🙅'],
  updown: ['📈', '📰', '📉'],
  eggs: ['🧺', '🥚', '🥚', '🥚'],
  riskreturn: ['🐢', '⚖️', '🐇'],
};

export default function Illustration({ art }) {
  const items = SCENES[art];
  if (!items) return null;
  return (
    <div className="flex items-center justify-center gap-3 py-3 text-5xl select-none" aria-hidden>
      {items.map((e, i) => (
        <motion.span key={i} initial={{ y: 12, opacity: 0, scale: 0.6 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: 0.12 * i, type: 'spring', stiffness: 260, damping: 14 }} className={/^[⇄➜➗➖↩︎]/.test(e) ? 'text-3xl text-soft' : ''}>
          {e}
        </motion.span>
      ))}
    </div>
  );
}
