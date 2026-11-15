import { memo } from 'react';
import { motion } from 'framer-motion';
import { evolutionStage } from '@engine/levels.js';

/**
 * Companion guide. Grows from a baby (stage 1) to a grand guide (stage 5).
 * mood: 'happy' | 'thinking' | 'excited' | 'wink' | 'sad' (gentle) ; skin: shop mascot look.
 */
const SKINS = { 'skin-sunglasses': 'shades', 'skin-bowtie': 'bowtie', 'skin-cape': 'cape', 'skin-tophat': 'tophat', 'skin-crownbuddy': 'crown' };

function Eyes({ mood, y = 42, gap = 12, cx = 50 }) {
  const l = cx - gap;
  const r = cx + gap;
  if (mood === 'happy' || mood === 'excited')
    return (
      <g stroke="#1E2A3A" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d={`M${l - 5} ${y + 1} Q${l} ${y - 5} ${l + 5} ${y + 1}`} />
        <path d={`M${r - 5} ${y + 1} Q${r} ${y - 5} ${r + 5} ${y + 1}`} />
      </g>
    );
  if (mood === 'wink')
    return (
      <g>
        <circle cx={l} cy={y} r="5" fill="#1E2A3A" />
        <path d={`M${r - 5} ${y} H${r + 5}`} stroke="#1E2A3A" strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  return (
    <g>
      <circle cx={l} cy={y} r="6" fill="#FFF" />
      <circle cx={r} cy={y} r="6" fill="#FFF" />
      <circle cx={l + (mood === 'thinking' ? 2 : 0)} cy={y - (mood === 'thinking' ? 2 : 0)} r="3.6" fill="#1E2A3A" />
      <circle cx={r + (mood === 'thinking' ? 2 : 0)} cy={y - (mood === 'thinking' ? 2 : 0)} r="3.6" fill="#1E2A3A" />
    </g>
  );
}

function Mouth({ mood, y = 58, cx = 50 }) {
  if (mood === 'excited') return <path d={`M${cx - 7} ${y} Q${cx} ${y + 10} ${cx + 7} ${y} Z`} fill="#1E2A3A" />;
  if (mood === 'thinking') return <path d={`M${cx - 5} ${y + 2} H${cx + 5}`} stroke="#1E2A3A" strokeWidth="2.5" strokeLinecap="round" />;
  if (mood === 'sad') return <path d={`M${cx - 6} ${y + 4} Q${cx} ${y - 1} ${cx + 6} ${y + 4}`} stroke="#1E2A3A" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
  return <path d={`M${cx - 6} ${y} Q${cx} ${y + 6} ${cx + 6} ${y}`} stroke="#1E2A3A" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
}

function Creature({ id, mood }) {
  switch (id) {
    case 'owl':
      return (
        <g>
          <path d="M22 30 L30 12 L40 26 Z M78 30 L70 12 L60 26 Z" fill="#6E4521" />
          <ellipse cx="50" cy="56" rx="32" ry="36" fill="#8A5A2B" />
          <ellipse cx="50" cy="66" rx="20" ry="22" fill="#E8C9A0" />
          <circle cx="38" cy="42" r="11" fill="#F6E7D0" />
          <circle cx="62" cy="42" r="11" fill="#F6E7D0" />
          <Eyes mood={mood} />
          <path d="M46 52 L54 52 L50 60 Z" fill="#E69F00" />
          <path d="M18 60 Q10 74 22 84 M82 60 Q90 74 78 84" stroke="#6E4521" strokeWidth="7" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'falcon':
      return (
        <g>
          <ellipse cx="50" cy="58" rx="30" ry="34" fill="#B97A4E" />
          <ellipse cx="50" cy="68" rx="18" ry="20" fill="#F2E3D0" />
          <path d="M28 40 Q50 20 72 40 L72 48 Q50 38 28 48 Z" fill="#6B4226" />
          <Eyes mood={mood} y={45} gap={11} />
          <path d="M44 54 Q50 50 56 54 L50 64 Z" fill="#F7C95C" stroke="#B07400" strokeWidth="1" />
          <path d="M20 54 Q6 66 18 84 L28 70 Z M80 54 Q94 66 82 84 L72 70 Z" fill="#8D5A36" />
        </g>
      );
    case 'camel':
      return (
        <g>
          <ellipse cx="50" cy="74" rx="34" ry="20" fill="#D9A54A" />
          <ellipse cx="38" cy="58" rx="12" ry="10" fill="#D9A54A" />
          <ellipse cx="62" cy="58" rx="12" ry="10" fill="#D9A54A" />
          <ellipse cx="50" cy="40" rx="20" ry="18" fill="#E6B65C" />
          <ellipse cx="34" cy="26" rx="5" ry="7" fill="#C28F35" />
          <ellipse cx="66" cy="26" rx="5" ry="7" fill="#C28F35" />
          <ellipse cx="50" cy="50" rx="12" ry="8" fill="#F1D18C" />
          <Eyes mood={mood} y={38} gap={9} />
          <circle cx="46" cy="50" r="1.5" fill="#1E2A3A" />
          <circle cx="54" cy="50" r="1.5" fill="#1E2A3A" />
          <Mouth mood={mood} y={53} />
        </g>
      );
    case 'robot':
      return (
        <g>
          <line x1="50" y1="6" x2="50" y2="18" stroke="#7D8A96" strokeWidth="3" />
          <circle cx="50" cy="6" r="5" fill="#E69F00" />
          <rect x="18" y="18" width="64" height="54" rx="16" fill="#C9D3DC" stroke="#7D8A96" strokeWidth="2" />
          <rect x="26" y="28" width="48" height="32" rx="10" fill="#1E2A3A" />
          <g transform="translate(0 2)">
            {mood === 'happy' || mood === 'excited' ? (
              <g stroke="#56B4E9" strokeWidth="3" fill="none" strokeLinecap="round">
                <path d="M33 44 Q38 38 43 44" />
                <path d="M57 44 Q62 38 67 44" />
              </g>
            ) : (
              <g fill="#56B4E9">
                <circle cx="38" cy="42" r="5" />
                <circle cx="62" cy="42" r="5" />
              </g>
            )}
            <path d="M42 52 Q50 57 58 52" stroke="#56B4E9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
          <rect x="30" y="74" width="40" height="18" rx="6" fill="#AEB9C4" />
        </g>
      );
    case 'dragon':
      return (
        <g>
          <path d="M18 50 Q4 30 14 20 Q22 34 30 38 Z M82 50 Q96 30 86 20 Q78 34 70 38 Z" fill="#56B4E9" />
          <ellipse cx="50" cy="60" rx="30" ry="32" fill="#009E73" />
          <ellipse cx="50" cy="70" rx="18" ry="18" fill="#BDE8D8" />
          <path d="M36 26 L40 14 L46 26 Z M54 26 L60 14 L64 26 Z" fill="#F7C95C" />
          <Eyes mood={mood} y={44} gap={11} />
          <circle cx="45" cy="56" r="1.6" fill="#1E2A3A" />
          <circle cx="55" cy="56" r="1.6" fill="#1E2A3A" />
          <Mouth mood={mood} y={60} />
        </g>
      );
    case 'elephant':
      return (
        <g>
          <ellipse cx="20" cy="46" rx="16" ry="20" fill="#B5BAC0" />
          <ellipse cx="80" cy="46" rx="16" ry="20" fill="#B5BAC0" />
          <ellipse cx="50" cy="50" rx="28" ry="28" fill="#9AA0A6" />
          <path d="M44 62 Q44 86 56 90 Q60 84 54 80 Q52 72 56 62 Z" fill="#9AA0A6" />
          <Eyes mood={mood} y={44} gap={10} />
          <ellipse cx="36" cy="58" rx="4" ry="2.5" fill="#FF8FA3" opacity="0.5" />
          <ellipse cx="64" cy="58" rx="4" ry="2.5" fill="#FF8FA3" opacity="0.5" />
        </g>
      );
    default:
      return <circle cx="50" cy="50" r="30" fill="#E69F00" />;
  }
}

function Companion({ id = 'owl', level = 1, skin, mood = 'happy', size = 96, bounce = true, title }) {
  const stage = evolutionStage(level);
  const scale = 0.78 + stage * 0.055;
  const look = SKINS[skin];
  const reduced = typeof document !== 'undefined' && document.documentElement.classList.contains('reduce-motion');
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={title || id}
      animate={bounce && !reduced ? { y: [0, -4, 0] } : undefined}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      className="overflow-visible"
    >
      {look === 'cape' && <path d="M26 50 Q50 40 74 50 L84 98 L16 98 Z" fill="#D55E00" />}
      <g transform={`translate(50 54) scale(${scale}) translate(-50 -54)`}>
        <Creature id={id} mood={mood} />
        {stage >= 3 && <path d="M30 80 Q50 90 70 80 L66 88 Q50 96 34 88 Z" fill="#CC79A7" />}
        {look === 'shades' && (
          <g>
            <rect x="26" y="36" width="20" height="12" rx="4" fill="#1E2A3A" />
            <rect x="54" y="36" width="20" height="12" rx="4" fill="#1E2A3A" />
            <path d="M46 41 H54" stroke="#1E2A3A" strokeWidth="3" />
          </g>
        )}
        {look === 'bowtie' && <path d="M38 82 L50 88 L62 82 L62 94 L50 88 L38 94 Z" fill="#D55E00" />}
        {look === 'tophat' && (
          <g>
            <rect x="34" y="-4" width="32" height="24" rx="3" fill="#1E2A3A" />
            <rect x="26" y="18" width="48" height="6" rx="3" fill="#1E2A3A" />
            <rect x="34" y="12" width="32" height="5" fill="#CC79A7" />
          </g>
        )}
        {look === 'crown' && <path d="M32 16 L35 -2 L43 8 L50 -6 L57 8 L65 -2 L68 16 Z" fill="#F7C95C" stroke="#B07400" strokeWidth="1.5" />}
        {stage >= 5 && !look && <path d="M36 14 L38 0 L45 9 L50 -2 L55 9 L62 0 L64 14 Z" fill="#F7C95C" stroke="#E69F00" strokeWidth="1.5" />}
      </g>
      {stage >= 4 && (
        <g fill="#F7C95C">
          <circle cx="8" cy="20" r="2.5" />
          <circle cx="94" cy="30" r="2" />
          <circle cx="90" cy="86" r="2.5" />
        </g>
      )}
    </motion.svg>
  );
}

export default memo(Companion);
