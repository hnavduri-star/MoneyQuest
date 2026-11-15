import { memo } from 'react';
import { content } from '../content.js';
import { evolutionStage } from '@engine/levels.js';

/**
 * Layered SVG avatar. `avatar` comes from content/characters.json ids.
 * `equipped` (from the shop) can swap the outfit and add a hat. `level` drives evolution:
 * 2 = star pin, 3 = hero cape, 4 = golden glow, 5 = sparkles + crown.
 */
const SHOP_OUTFITS = { 'outfit-explorer': 'explorer', 'outfit-chef': 'chef', 'outfit-banker': 'suit', 'outfit-superhero': 'hero', 'outfit-sport': 'sport' };
const SHOP_HATS = { 'hat-crown': 'crown', 'hat-party': 'party', 'hat-grad': 'grad' };
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  return `#${((c(n >> 16) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).padStart(6, '0')}`;
};

function Avatar({ avatar = {}, level = 1, equipped = {}, size = 120, theme = '#0072B2', title }) {
  const ch = content.characters;
  const a = { species: 'human', skin: 2, hair: 'short', hairColor: 0, outfit: 'tshirt', headwear: 'none', accessory: 'none', outfitColor: theme, ...avatar };
  const skin = a.species === 'fox' ? '#E8823A' : ch.skinTones[a.skin] || ch.skinTones[2];
  const hair = ch.hairColors[a.hairColor] || ch.hairColors[0];
  const outfit = SHOP_OUTFITS[equipped.outfit] || a.outfit;
  const hat = SHOP_HATS[equipped.hat];
  const stage = evolutionStage(level);
  const covered = ['hijab', 'ghutra'].includes(a.headwear) && a.species === 'human';
  const human = a.species === 'human' || a.species === 'astronaut';
  const oc = a.outfitColor || theme;

  return (
    <svg viewBox="0 0 120 150" width={size} height={size * 1.25} role="img" aria-label={title || 'avatar'} className="overflow-visible">
      {stage >= 4 && (
        <circle cx="60" cy="75" r="62" fill="url(#mqGlow)" opacity="0.9">
          <animate attributeName="r" values="58;64;58" dur="3s" repeatCount="indefinite" />
        </circle>
      )}
      <defs>
        <radialGradient id="mqGlow">
          <stop offset="0%" stopColor="#F7C95C" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#F7C95C" stopOpacity="0" />
        </radialGradient>
      </defs>
      {stage >= 3 && <path d="M34 100 Q60 92 86 100 L98 150 L22 150 Z" fill={shade(theme, -40)} />}

      {/* back layers */}
      {human && !covered && a.hair === 'long' && <rect x="28" y="40" width="64" height="62" rx="26" fill={hair} />}
      {human && !covered && a.hair === 'afro' && <circle cx="60" cy="52" r="40" fill={hair} />}
      {human && !covered && a.hair === 'ponytail' && <path d="M84 40 Q104 60 92 92 Q86 70 80 52 Z" fill={hair} />}
      {a.headwear === 'hijab' && <path d="M24 58 Q24 18 60 18 Q96 18 96 58 L98 104 Q60 116 22 104 Z" fill={a.headwearColor || '#3A3550'} />}
      {a.headwear === 'ghutra' && <path d="M26 46 Q26 20 60 20 Q94 20 94 46 L104 112 Q60 104 16 112 Z" fill="#FFFFFF" stroke="#D9D9D9" strokeWidth="1.5" />}

      <Body outfit={outfit} color={oc} skin={skin} theme={theme} />

      {/* neck + head */}
      {a.species !== 'robot' && <rect x="52" y="80" width="16" height="16" rx="6" fill={shade(skin, -18)} />}
      {a.species === 'robot' ? (
        <g>
          <line x1="60" y1="16" x2="60" y2="28" stroke="#7D8A96" strokeWidth="3" />
          <circle cx="60" cy="14" r="5" fill="#E69F00">
            <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <rect x="30" y="28" width="60" height="56" rx="16" fill="#C9D3DC" stroke="#7D8A96" strokeWidth="2" />
          <rect x="37" y="38" width="46" height="34" rx="10" fill="#1E2A3A" />
          <circle cx="50" cy="54" r="5" fill="#56B4E9" />
          <circle cx="70" cy="54" r="5" fill="#56B4E9" />
          <path d="M50 64 Q60 70 70 64" stroke="#56B4E9" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="24" y="48" width="6" height="16" rx="3" fill="#7D8A96" />
          <rect x="90" y="48" width="6" height="16" rx="3" fill="#7D8A96" />
        </g>
      ) : (
        <g>
          {a.species === 'fox' && (
            <>
              <path d="M32 44 L36 14 L54 34 Z" fill={skin} />
              <path d="M88 44 L84 14 L66 34 Z" fill={skin} />
              <path d="M37 38 L39 22 L49 33 Z" fill="#FFE3CC" />
              <path d="M83 38 L81 22 L71 33 Z" fill="#FFE3CC" />
            </>
          )}
          {!covered && a.species !== 'fox' && <circle cx="31" cy="60" r="6" fill={shade(skin, -10)} />}
          {!covered && a.species !== 'fox' && <circle cx="89" cy="60" r="6" fill={shade(skin, -10)} />}
          <circle cx="60" cy="58" r={covered ? 26 : 29} fill={skin} />
          {a.species === 'fox' && <ellipse cx="60" cy="70" rx="17" ry="12" fill="#FFF3E6" />}
          {a.species === 'fox' && <ellipse cx="60" cy="64" rx="4.5" ry="3.5" fill="#1E2A3A" />}
          <Face fox={a.species === 'fox'} />
          {a.accessory === 'freckles' && (
            <g fill={shade(skin, -45)}>
              {[[44, 67], [47, 70], [41, 70], [76, 67], [73, 70], [79, 70]].map(([x, y]) => <circle key={x + '' + y} cx={x} cy={y} r="1.1" />)}
            </g>
          )}
          {a.accessory === 'bindi' && <circle cx="60" cy="48" r="2.2" fill="#D55E00" />}
        </g>
      )}

      {/* front hair */}
      {human && !covered && !['patka', 'headwrap'].includes(a.headwear) && <Hair style={a.hair} color={hair} />}

      {/* headwear front */}
      {a.headwear === 'hijab' && <path d="M33 52 Q36 28 60 28 Q84 28 87 52 Q80 36 60 36 Q40 36 33 52 Z" fill={shade(a.headwearColor || '#3A3550', 18)} />}
      {a.headwear === 'ghutra' && (
        <g>
          <path d="M31 52 Q30 20 60 19 Q90 20 89 52 Q80 38 60 38 Q40 38 31 52 Z" fill="#FFFFFF" stroke="#C9C9C9" strokeWidth="1.5" />
          <path d="M40 30 Q60 24 80 30" stroke="#E3E3E3" strokeWidth="1.5" fill="none" />
          <ellipse cx="60" cy="27" rx="24" ry="5.5" fill="none" stroke="#1E1E1E" strokeWidth="3.5" />
          <ellipse cx="60" cy="22.5" rx="21" ry="4.5" fill="none" stroke="#1E1E1E" strokeWidth="3" />
        </g>
      )}
      {a.headwear === 'kufi' && (
        <g>
          <path d="M36 40 Q38 22 60 22 Q82 22 84 40 Z" fill="#FFFFFF" stroke="#D0D0D0" />
          <path d="M40 36 H80 M42 31 H78" stroke="#56B4E9" strokeWidth="1.5" strokeDasharray="3 2" />
        </g>
      )}
      {a.headwear === 'cap' && (
        <g>
          <path d="M31 46 Q31 22 60 22 Q89 22 89 46 Z" fill={theme} />
          <path d="M60 44 Q88 40 104 48 Q90 52 60 48 Z" fill={shade(theme, -30)} />
          <circle cx="60" cy="22" r="3" fill={shade(theme, -30)} />
        </g>
      )}
      {a.headwear === 'beanie' && (
        <g>
          <path d="M30 48 Q30 18 60 18 Q90 18 90 48 Z" fill="#CC79A7" />
          <rect x="28" y="42" width="64" height="9" rx="4" fill="#B0588A" />
          <circle cx="60" cy="16" r="6" fill="#FFF" />
        </g>
      )}
      {a.headwear === 'headwrap' && (
        <g>
          <path d="M28 48 Q22 14 60 12 Q98 14 92 48 Q60 36 28 48 Z" fill={a.headwearColor || '#009E73'} />
          <path d="M40 22 Q60 6 82 24 Q66 18 52 28 Z" fill={shade(a.headwearColor || '#009E73', 30)} />
          <path d="M34 40 Q60 26 86 40" stroke="#E69F00" strokeWidth="2.5" fill="none" />
        </g>
      )}
      {a.headwear === 'patka' && (
        <g>
          <path d="M30 50 Q28 22 60 20 Q92 22 90 50 Q60 40 30 50 Z" fill={a.headwearColor || '#0072B2'} />
          <circle cx="60" cy="20" r="8" fill={shade(a.headwearColor || '#0072B2', -25)} />
        </g>
      )}

      {/* accessories */}
      {a.accessory === 'glasses' && (
        <g fill="none" stroke="#1E2A3A" strokeWidth="2.2">
          <circle cx="49" cy="60" r="7.5" />
          <circle cx="71" cy="60" r="7.5" />
          <path d="M56.5 60 H63.5" />
        </g>
      )}
      {a.accessory === 'headphones' && (
        <g>
          <path d="M28 60 Q28 22 60 22 Q92 22 92 60" fill="none" stroke="#1E2A3A" strokeWidth="5" />
          <rect x="22" y="52" width="12" height="20" rx="5" fill={theme} />
          <rect x="86" y="52" width="12" height="20" rx="5" fill={theme} />
        </g>
      )}
      {a.accessory === 'earrings' && !covered && (
        <g fill="#E69F00">
          <circle cx="31" cy="69" r="2.8" />
          <circle cx="89" cy="69" r="2.8" />
        </g>
      )}
      {a.species === 'astronaut' && (
        <g>
          <circle cx="60" cy="58" r="38" fill="#DDF1FB" fillOpacity="0.28" stroke="#F2F2F2" strokeWidth="6" />
          <path d="M36 40 Q44 28 58 26" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
      )}

      {/* shop hats + evolution */}
      {hat === 'crown' || (!hat && stage >= 5) ? <Crown y={a.species === 'astronaut' ? 8 : 16} /> : null}
      {hat === 'party' && <path d="M48 32 L60 2 L72 32 Z" fill="#CC79A7" stroke="#FFF" strokeWidth="2" strokeDasharray="4 3" />}
      {hat === 'grad' && (
        <g>
          <rect x="44" y="22" width="32" height="10" fill="#1E2A3A" />
          <path d="M30 22 L60 10 L90 22 L60 32 Z" fill="#1E2A3A" />
          <path d="M88 22 L92 38" stroke="#E69F00" strokeWidth="2.5" />
        </g>
      )}
      {stage >= 2 && (
        <g transform="translate(74 112)">
          <circle r="7" fill="#F7C95C" stroke="#E69F00" strokeWidth="1.5" />
          <path d="M0 -4 L1.2 -1.2 L4 -1.2 L1.8 0.6 L2.6 3.6 L0 1.8 L-2.6 3.6 L-1.8 0.6 L-4 -1.2 L-1.2 -1.2 Z" fill="#FFF" />
        </g>
      )}
      {stage >= 5 &&
        [[14, 30], [104, 40], [100, 120], [18, 110]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z`} fill="#F7C95C">
            <animate attributeName="opacity" values="0.2;1;0.2" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
          </path>
        ))}
    </svg>
  );
}

function Crown({ y = 16 }) {
  return (
    <g transform={`translate(0 ${y - 16})`}>
      <path d="M40 30 L42 10 L52 22 L60 6 L68 22 L78 10 L80 30 Z" fill="#F7C95C" stroke="#E69F00" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="60" cy="22" r="2.5" fill="#CC79A7" />
    </g>
  );
}

function Face({ fox }) {
  return (
    <g>
      <ellipse cx="49" cy="59" rx="3.6" ry="4.6" fill="#1E2A3A" />
      <ellipse cx="71" cy="59" rx="3.6" ry="4.6" fill="#1E2A3A" />
      <circle cx="50.3" cy="57.3" r="1.3" fill="#FFF" />
      <circle cx="72.3" cy="57.3" r="1.3" fill="#FFF" />
      <circle cx="42" cy="68" r="4" fill="#FF8FA3" opacity="0.35" />
      <circle cx="78" cy="68" r="4" fill="#FF8FA3" opacity="0.35" />
      <path d={fox ? 'M54 72 Q60 76 66 72' : 'M52 70 Q60 77 68 70'} stroke="#1E2A3A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Hair({ style, color }) {
  switch (style) {
    case 'short':
      return <path d="M30 56 Q28 26 60 25 Q92 26 90 56 Q86 40 70 37 Q58 44 44 38 Q34 42 30 56 Z" fill={color} />;
    case 'curly':
      return (
        <g fill={color}>
          {[[36, 40], [46, 31], [58, 28], [70, 30], [81, 38], [87, 49], [32, 50]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="9" />)}
        </g>
      );
    case 'long':
      return <path d="M29 62 Q27 24 60 24 Q93 24 91 62 Q88 42 74 36 Q60 44 46 36 Q32 42 29 62 Z" fill={color} />;
    case 'bun':
      return (
        <g fill={color}>
          <circle cx="60" cy="20" r="11" />
          <path d="M31 54 Q30 28 60 27 Q90 28 89 54 Q84 38 60 37 Q36 38 31 54 Z" />
        </g>
      );
    case 'braids':
      return (
        <g fill={color}>
          <path d="M30 56 Q29 26 60 25 Q91 26 90 56 Q86 38 60 36 Q34 38 30 56 Z" />
          {[0, 1, 2, 3].map((i) => <circle key={'l' + i} cx="28" cy={66 + i * 9} r="5" />)}
          {[0, 1, 2, 3].map((i) => <circle key={'r' + i} cx="92" cy={66 + i * 9} r="5" />)}
        </g>
      );
    case 'afro':
      return <path d="M31 52 Q34 34 60 33 Q86 34 89 52 Q78 42 60 42 Q42 42 31 52 Z" fill={color} />;
    case 'spiky':
      return <path d="M30 56 L32 34 L40 40 L42 24 L52 34 L58 18 L64 33 L74 22 L77 38 L88 32 L90 56 Q80 42 60 41 Q40 42 30 56 Z" fill={color} />;
    case 'ponytail':
      return <path d="M30 56 Q29 26 60 25 Q91 26 90 56 Q84 36 62 36 Q40 36 30 56 Z" fill={color} />;
    default:
      return null;
  }
}

function Body({ outfit, color, skin, theme }) {
  const torso = 'M24 150 Q24 100 60 94 Q96 100 96 150 Z';
  switch (outfit) {
    case 'thobe':
      return (
        <g>
          <path d="M22 150 Q22 98 60 93 Q98 98 98 150 Z" fill="#FFFFFF" stroke="#D9D9D9" strokeWidth="1.5" />
          <path d="M52 95 Q60 102 68 95" stroke="#C9C9C9" strokeWidth="2" fill="none" />
          <line x1="60" y1="100" x2="60" y2="126" stroke="#D0D0D0" strokeWidth="1.5" />
          {[106, 114, 122].map((y) => <circle key={y} cx="60" cy={y} r="1.4" fill="#B0B0B0" />)}
        </g>
      );
    case 'abaya':
      return (
        <g>
          <path d="M18 150 Q22 98 60 93 Q98 98 102 150 Z" fill={color === '#FFFFFF' ? '#22212B' : color} />
          <path d="M60 98 L60 150" stroke="#E69F00" strokeWidth="2" opacity="0.6" />
        </g>
      );
    case 'kurta':
      return (
        <g>
          <path d={torso} fill={color} />
          <path d="M60 96 L60 128" stroke={shade(color, -40)} strokeWidth="2" />
          {[104, 112, 120].map((y) => <circle key={y} cx="60" cy={y} r="1.6" fill="#F7C95C" />)}
          <path d="M50 96 Q60 104 70 96" stroke={shade(color, -40)} strokeWidth="2" fill="none" />
        </g>
      );
    case 'salwar':
      return (
        <g>
          <path d={torso} fill={color} />
          <path d="M28 112 Q60 96 94 128 L96 140 Q60 108 26 124 Z" fill="#F7C95C" opacity="0.9" />
        </g>
      );
    case 'dashiki':
      return (
        <g>
          <path d={torso} fill={color} />
          <path d="M42 97 L60 122 L78 97" fill="#F7C95C" />
          <path d="M46 99 L60 116 L74 99" fill="#1E2A3A" />
          <path d="M50 101 L60 112 L70 101" fill="#D55E00" />
        </g>
      );
    case 'hanbok':
      return (
        <g>
          <path d={torso} fill={color} />
          <path d="M44 97 L74 130" stroke="#FFF" strokeWidth="5" />
          <path d="M66 116 q8 -2 10 6 q-8 2 -10 -6 Z" fill="#D55E00" />
          <path d="M66 116 L60 134" stroke="#D55E00" strokeWidth="3" />
        </g>
      );
    case 'hoodie':
      return (
        <g>
          <path d="M38 98 Q60 88 82 98 Q60 108 38 98 Z" fill={shade(color, -30)} />
          <path d={torso} fill={color} />
          <rect x="44" y="124" width="32" height="14" rx="6" fill={shade(color, -20)} />
          <line x1="55" y1="100" x2="54" y2="114" stroke="#FFF" strokeWidth="2" />
          <line x1="65" y1="100" x2="66" y2="114" stroke="#FFF" strokeWidth="2" />
        </g>
      );
    case 'jacket':
      return (
        <g>
          <path d={torso} fill={color} />
          <path d="M50 95 L60 120 L70 95 Z" fill="#FFFFFF" />
          <path d="M50 95 L56 118 L46 112 Z M70 95 L64 118 L74 112 Z" fill={shade(color, -30)} />
        </g>
      );
    case 'dress':
      return (
        <g>
          <path d="M30 150 L40 100 Q60 92 80 100 L90 150 Z" fill={color} />
          <path d="M40 118 H80" stroke="#FFF" strokeWidth="3" opacity="0.7" />
          {[44, 56, 68, 80].map((x) => <circle key={x} cx={x - 4} cy="134" r="2.5" fill="#FFF" opacity="0.7" />)}
        </g>
      );
    case 'spacesuit':
      return (
        <g>
          <path d={torso} fill="#F2F2F2" stroke="#C9C9C9" strokeWidth="1.5" />
          <rect x="46" y="110" width="28" height="18" rx="4" fill="#9AA0A6" />
          <circle cx="53" cy="119" r="3" fill="#D55E00" />
          <circle cx="63" cy="119" r="3" fill="#009E73" />
          <rect x="30" y="104" width="10" height="10" rx="2" fill={theme} />
        </g>
      );
    case 'plating':
      return (
        <g>
          <path d={torso} fill="#C9D3DC" stroke="#7D8A96" strokeWidth="2" />
          <rect x="44" y="108" width="32" height="22" rx="5" fill="#1E2A3A" />
          <circle cx="52" cy="119" r="3.5" fill={color}>
            <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="62" cy="119" r="3.5" fill="#E69F00" />
          <circle cx="70" cy="119" r="2" fill="#009E73" />
        </g>
      );
    case 'explorer':
      return (
        <g>
          <path d={torso} fill="#C2A878" />
          <rect x="38" y="112" width="14" height="12" rx="2" fill="#A68B5B" />
          <rect x="68" y="112" width="14" height="12" rx="2" fill="#A68B5B" />
          <path d="M50 95 L60 108 L70 95" fill="#009E73" />
        </g>
      );
    case 'chef':
      return (
        <g>
          <path d={torso} fill="#FFFFFF" stroke="#DDD" strokeWidth="1.5" />
          {[[52, 108], [68, 108], [52, 120], [68, 120]].map(([x, y]) => <circle key={x + '' + y} cx={x} cy={y} r="2.2" fill="#9AA0A6" />)}
          <path d="M48 96 L60 104 L72 96" stroke="#D55E00" strokeWidth="4" fill="none" />
        </g>
      );
    case 'suit':
      return (
        <g>
          <path d={torso} fill="#1F3B5C" />
          <path d="M50 95 L60 122 L70 95 Z" fill="#FFFFFF" />
          <path d="M58 98 L62 98 L64 118 L60 124 L56 118 Z" fill="#D55E00" />
        </g>
      );
    case 'hero':
      return (
        <g>
          <path d={torso} fill={theme} />
          <circle cx="60" cy="118" r="12" fill="#F7C95C" />
          <text x="60" y="124" textAnchor="middle" fontSize="16" fontWeight="900" fill={shade(theme, -30)}>$</text>
        </g>
      );
    case 'sport':
      return (
        <g>
          <path d={torso} fill={theme} />
          <path d="M30 116 H90" stroke="#FFF" strokeWidth="4" />
          <text x="60" y="140" textAnchor="middle" fontSize="18" fontWeight="900" fill="#FFF">10</text>
        </g>
      );
    default:
      return (
        <g>
          <path d={torso} fill={color} />
          <path d="M50 96 Q60 104 70 96" stroke={shade(color, -35)} strokeWidth="3" fill="none" />
          <path d="M24 150 Q24 118 30 110" stroke={skin} strokeWidth="0" />
        </g>
      );
  }
}

export default memo(Avatar);
