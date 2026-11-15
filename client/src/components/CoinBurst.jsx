import { AnimatePresence, motion } from 'framer-motion';
import { Coin } from './ui.jsx';

/** A little shower of coins flying up to the wallet when an answer pays out. */
export default function CoinBurst({ pop }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center" aria-hidden>
      <AnimatePresence>
        {pop && (
          <motion.div key={pop.key} className="relative" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {Array.from({ length: Math.min(8, pop.n + 2) }, (_, i) => (
              <motion.span
                key={i}
                className="absolute"
                initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
                animate={{ x: [0, (i - 3) * 22, 150], y: [0, -60 - (i % 3) * 18, -380], scale: [0.4, 1.2, 0.6], opacity: [0, 1, 0] }}
                transition={{ duration: 1.1, delay: i * 0.05, ease: 'easeOut' }}
              >
                <Coin size={28} />
              </motion.span>
            ))}
            <motion.span initial={{ y: 0, scale: 0.6, opacity: 0 }} animate={{ y: -70, scale: 1.3, opacity: [0, 1, 1, 0] }} transition={{ duration: 1.2 }} className="absolute -translate-x-1/2 font-display font-extrabold text-4xl coin-text whitespace-nowrap" style={{ textShadow: 'none', filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.25))' }}>
              +{pop.n}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
