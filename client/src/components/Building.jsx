import { createContext, memo, useContext } from 'react';

/** At night (dark mode) every window glows. */
const Night = createContext(false);

/**
 * Town buildings as SVG. tier: 0 empty plot, 'construction', 1-3 built (bigger, brighter, golden).
 * Unknown building types fall back to a generic shop with the world's icon, so new worlds work without new art.
 */
function Windows({ x, y, cols, rows, lit: litProp, w = 10, h = 12, gap = 6 }) {
  const night = useContext(Night);
  const lit = litProp || night;
  const out = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const on = (r * cols + c) % 3 !== 0 || lit;
      out.push(<rect key={`${r}-${c}`} x={x + c * (w + gap)} y={y + r * (h + gap)} width={w} height={h} rx="2.5" fill={on ? '#FFE9A8' : '#9FC6E0'} stroke="#1E2A3A" strokeOpacity="0.15" />);
    }
  return out;
}

function Flag({ x, y, color }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 22} stroke="#5B6B7F" strokeWidth="2" />
      <path d={`M${x} ${y - 22} L${x + 14} ${y - 17} L${x} ${y - 12} Z`} fill={color}>
        <animateTransform attributeName="transform" type="skewY" values="0;6;0" dur="1.8s" repeatCount="indefinite" />
      </path>
    </g>
  );
}

function Sparkles() {
  return (
    <g fill="#F7C95C">
      {[[14, 28], [104, 22], [96, 70], [20, 74]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 5} L${x + 1.6} ${y - 1.6} L${x + 5} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 5} L${x - 1.6} ${y + 1.6} L${x - 5} ${y} L${x - 1.6} ${y - 1.6} Z`}>
          <animate attributeName="opacity" values="0.15;1;0.15" dur={`${1.4 + i * 0.35}s`} repeatCount="indefinite" />
        </path>
      ))}
    </g>
  );
}

function Art({ type, tier, color, icon, night }) {
  const t = typeof tier === 'number' ? tier : 1;
  const gold = t >= 3 ? '#E69F00' : '#5B6B7F';
  switch (type) {
    case 'home':
      return (
        <g>
          <rect x="30" y="58" width="60" height="44" rx="4" fill="#FFF8EC" stroke="#1E2A3A" strokeOpacity="0.2" strokeWidth="2" />
          <path d="M24 62 L60 30 L96 62 Z" fill={color} />
          <rect x="53" y="76" width="14" height="26" rx="3" fill="#8A5A2B" />
          <Windows x={36} y={68} cols={1} rows={1} lit />
          <Windows x={74} y={68} cols={1} rows={1} lit />
          <rect x="74" y="34" width="9" height="16" fill="#B5452B" />
        </g>
      );
    case 'hall':
      return (
        <g>
          <rect x="22" y="52" width="76" height="50" fill="#F2E7D5" stroke="#1E2A3A" strokeOpacity="0.2" strokeWidth="2" />
          <path d="M18 54 L60 30 L102 54 Z" fill="#9AA0A6" />
          <circle cx="60" cy="44" r="7" fill="#FFF" stroke="#5B6B7F" strokeWidth="2" />
          <path d="M60 44 V40 M60 44 H63" stroke="#1E2A3A" strokeWidth="1.5" />
          {[30, 46, 66, 82].map((x) => <rect key={x} x={x} y="60" width="8" height="34" rx="2" fill="#FFF" />)}
          <rect x="52" y="78" width="16" height="24" fill="#8A5A2B" />
          <Flag x={60} y={30} color="#009E73" />
        </g>
      );
    case 'piggy-house':
      return (
        <g>
          {t >= 2 && <rect x="34" y="34" width="52" height="22" rx="6" fill="#F7B9CF" stroke="#CC79A7" strokeWidth="2" />}
          <rect x="26" y="54" width="68" height="48" rx="12" fill="#F7C6D9" stroke="#CC79A7" strokeWidth="2" />
          <ellipse cx="60" cy={t >= 2 ? 34 : 54} rx="30" ry="18" fill="#F49AC1" stroke="#CC79A7" strokeWidth="2" />
          <rect x="52" y={t >= 2 ? 16 : 36} width="16" height="5" rx="2" fill="#1E2A3A" opacity="0.6" />
          <ellipse cx="84" cy={t >= 2 ? 38 : 58} rx="7" ry="6" fill="#F7B9CF" stroke="#CC79A7" strokeWidth="2" />
          <circle cx="82" cy={t >= 2 ? 37 : 57} r="1.3" fill="#1E2A3A" />
          <circle cx="86" cy={t >= 2 ? 37 : 57} r="1.3" fill="#1E2A3A" />
          <Windows x={34} y={66} cols={2} rows={1} lit={t >= 2} />
          <Windows x={70} y={66} cols={1} rows={1} lit={t >= 2} />
          <rect x="54" y="80" width="14" height="22" rx="6" fill="#CC79A7" />
          <circle cx="60" cy={t >= 2 ? 10 : 30} r="6" fill="#F7C95C" stroke={gold} strokeWidth="2" />
          {t >= 3 && <Flag x={34} y={34} color="#E69F00" />}
        </g>
      );
    case 'bank':
      return (
        <g>
          {t >= 2 && <rect x="30" y="30" width="60" height="18" fill="#E6EEF5" stroke="#1E2A3A" strokeOpacity="0.2" />}
          <path d={`M18 ${t >= 2 ? 34 : 50} L60 ${t >= 2 ? 12 : 28} L102 ${t >= 2 ? 34 : 50} Z`} fill={color} />
          <rect x="20" y="50" width="80" height="8" fill="#DDE6EE" />
          {[26, 42, 58, 74, 90].map((x) => <rect key={x} x={x - 3} y="58" width="8" height="36" fill="#F5F8FB" stroke="#B9C6D2" />)}
          <rect x="16" y="94" width="88" height="8" fill="#DDE6EE" />
          <rect x="52" y="70" width="16" height="24" rx="2" fill="#1E2A3A" opacity="0.8" />
          <circle cx="60" cy={t >= 2 ? 26 : 42} r="5" fill="#F7C95C" stroke={gold} strokeWidth="1.5" />
          {t >= 3 && <rect x="16" y="49" width="88" height="3" fill="#E69F00" />}
          {t >= 3 && <Flag x={96} y={34} color="#E69F00" />}
        </g>
      );
    default:
      return (
        <g>
          <rect x="28" y="50" width="64" height="52" rx="6" fill="#FFF" stroke={color} strokeWidth="3" />
          <path d="M22 52 Q60 30 98 52 Z" fill={color} />
          <Windows x={34} y={58} cols={3} rows={1} lit={t >= 2} w={12} />
          <text x="60" y="94" textAnchor="middle" fontSize="22">{icon}</text>
        </g>
      );
  }
}

function Building({ type, tier, color = '#0072B2', icon = '🏠', size = 110, label, night = false }) {
  return (
    <Night.Provider value={night}>
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={label} className="overflow-visible">
      {night && typeof tier === 'number' && tier > 0 && <ellipse cx="60" cy="70" rx="46" ry="38" fill="#FFD27A" opacity="0.18" />}
      <ellipse cx="60" cy="104" rx="50" ry="10" fill={night ? '#2F6B4A' : '#7BC47F'} />
      {tier === 0 && (
        <g>
          <rect x="30" y="86" width="60" height="16" rx="4" fill="#C9A97A" opacity="0.7" />
          <line x1="40" y1="100" x2="40" y2="76" stroke="#8A5A2B" strokeWidth="3" />
          <rect x="26" y="62" width="40" height="18" rx="4" fill="#FFF8EC" stroke="#8A5A2B" strokeWidth="2" />
          <text x="46" y="75" textAnchor="middle" fontSize="12">{icon}</text>
        </g>
      )}
      {tier === 'construction' && (
        <g>
          <rect x="30" y="66" width="60" height="36" fill="#E7DCC8" stroke="#8A5A2B" strokeWidth="2" strokeDasharray="5 3" />
          <path d="M30 66 L90 102 M90 66 L30 102" stroke="#E69F00" strokeWidth="2.5" />
          <line x1="96" y1="102" x2="96" y2="30" stroke="#E69F00" strokeWidth="4" />
          <line x1="96" y1="32" x2="58" y2="32" stroke="#E69F00" strokeWidth="4" />
          <line x1="64" y1="32" x2="64" y2="52" stroke="#5B6B7F" strokeWidth="1.5">
            <animate attributeName="y2" values="48;58;48" dur="2s" repeatCount="indefinite" />
          </line>
          <rect x="58" y="52" width="12" height="8" fill="#B5452B">
            <animate attributeName="y" values="48;58;48" dur="2s" repeatCount="indefinite" />
          </rect>
          <text x="46" y="92" textAnchor="middle" fontSize="16">{icon}</text>
        </g>
      )}
      {typeof tier === 'number' && tier > 0 && (
        <g>
          {tier >= 3 && <ellipse cx="60" cy="66" rx="56" ry="48" fill="#F7C95C" opacity="0.25" />}
          <Art type={type} tier={tier} color={color} icon={icon} />
          {tier >= 3 && <Sparkles />}
        </g>
      )}
    </svg>
    </Night.Provider>
  );
}

export default memo(Building);
