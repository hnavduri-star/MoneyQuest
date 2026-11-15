import { motion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = ['#E69F00', '#56B4E9', '#009E73', '#F7C95C', '#0072B2', '#D55E00', '#CC79A7'];

/** Lightweight confetti burst. Skipped completely when "less motion" is on. */
export default function Confetti({ count = 40, run = true }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 360,
        y: -(120 + Math.random() * 260),
        r: Math.random() * 720 - 360,
        c: COLORS[i % COLORS.length],
        d: 0.9 + Math.random() * 0.8,
        s: 6 + Math.random() * 8,
        round: i % 3 === 0,
      })),
    [count, run], // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (!run || document.documentElement.classList.contains('reduce-motion') || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute"
          style={{ width: p.s, height: p.round ? p.s : p.s * 0.5, background: p.c, borderRadius: p.round ? 999 : 2 }}
          initial={{ x: 0, y: 40, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [40, p.y, p.y + 520], opacity: [1, 1, 0], rotate: p.r }}
          transition={{ duration: p.d * 2, ease: 'easeOut', times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  );
}
