import { memo } from 'react';

/**
 * Drawn pets and town decorations (replacing emoji, which look different on every phone).
 * Each is a small SVG in the same flat, rounded style as the avatars. Unknown ids fall back to the item's emoji.
 */
const eye = (x, y, r = 2.6) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#1E2A3A" />
    <circle cx={x + 0.9} cy={y - 0.9} r={r * 0.35} fill="#fff" />
  </g>
);
const smile = (x, y, w = 6) => <path d={`M${x - w / 2} ${y} Q${x} ${y + w * 0.6} ${x + w / 2} ${y}`} stroke="#1E2A3A" strokeWidth="1.8" fill="none" strokeLinecap="round" />;

const ART = {
  'pet-cat': (
    <g>
      <path d="M28 70 Q22 40 50 40 Q78 40 72 70 Z" fill="#F2A65A" />
      <path d="M30 36 L34 16 L46 30 Z M70 36 L66 16 L54 30 Z" fill="#E08A3C" />
      <circle cx="50" cy="40" r="20" fill="#F2A65A" />
      {eye(43, 39)}{eye(57, 39)}
      <path d="M48 46 L52 46 L50 48 Z" fill="#CC79A7" />{smile(50, 49, 7)}
      <path d="M72 66 Q90 60 84 44" stroke="#E08A3C" strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  ),
  'pet-dog': (
    <g>
      <ellipse cx="50" cy="66" rx="22" ry="14" fill="#C69C6D" />
      <circle cx="50" cy="40" r="20" fill="#D9B48A" />
      <ellipse cx="31" cy="40" rx="7" ry="14" fill="#8A5A2B" />
      <ellipse cx="69" cy="40" rx="7" ry="14" fill="#8A5A2B" />
      {eye(43, 37)}{eye(57, 37)}
      <ellipse cx="50" cy="46" rx="4" ry="3" fill="#1E2A3A" />{smile(50, 50, 8)}
    </g>
  ),
  'pet-bunny': (
    <g>
      <ellipse cx="42" cy="18" rx="5" ry="16" fill="#F2F2F2" stroke="#DDD" />
      <ellipse cx="58" cy="18" rx="5" ry="16" fill="#F2F2F2" stroke="#DDD" />
      <ellipse cx="50" cy="66" rx="20" ry="14" fill="#F2F2F2" />
      <circle cx="50" cy="42" r="17" fill="#FAFAFA" stroke="#E5E5E5" />
      {eye(44, 40)}{eye(56, 40)}
      <circle cx="50" cy="46" r="2" fill="#CC79A7" />{smile(50, 49, 6)}
    </g>
  ),
  'pet-turtle': (
    <g>
      <ellipse cx="50" cy="60" rx="28" ry="18" fill="#009E73" />
      <path d="M30 58 Q50 30 70 58" fill="#3CB98F" />
      <path d="M40 46 L50 40 L60 46 L56 56 L44 56 Z" fill="none" stroke="#0B6B4F" strokeWidth="2" />
      <circle cx="80" cy="56" r="9" fill="#7BC47F" />{eye(83, 54, 2)}
      <ellipse cx="32" cy="74" rx="6" ry="4" fill="#7BC47F" /><ellipse cx="68" cy="74" rx="6" ry="4" fill="#7BC47F" />
    </g>
  ),
  'pet-parrot': (
    <g>
      <path d="M50 88 L44 60 L56 60 Z" fill="#0072B2" />
      <ellipse cx="50" cy="52" rx="16" ry="20" fill="#D55E00" />
      <circle cx="50" cy="32" r="14" fill="#E85D2E" />
      <path d="M58 32 Q68 34 62 42 Z" fill="#F7C95C" />
      {eye(52, 29)}
      <path d="M38 50 Q30 62 40 70" stroke="#009E73" strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  ),
  'pet-gazelle': (
    <g>
      <path d="M40 18 Q36 6 30 4 M60 18 Q64 6 70 4" stroke="#6B4226" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="66" rx="22" ry="12" fill="#D39A6A" />
      <rect x="44" y="34" width="10" height="26" rx="5" fill="#D39A6A" />
      <ellipse cx="50" cy="30" rx="11" ry="13" fill="#E3B285" />
      {eye(46, 28, 2.2)}{eye(54, 28, 2.2)}
      <rect x="34" y="74" width="4" height="14" fill="#B97A4E" /><rect x="62" y="74" width="4" height="14" fill="#B97A4E" />
    </g>
  ),
  'pet-falcon': (
    <g>
      <ellipse cx="50" cy="56" rx="20" ry="24" fill="#8D5A36" />
      <ellipse cx="50" cy="62" rx="12" ry="16" fill="#F2E3D0" />
      <circle cx="50" cy="32" r="14" fill="#6B4226" />
      {eye(45, 31)}{eye(55, 31)}
      <path d="M46 37 Q50 34 54 37 L50 44 Z" fill="#F7C95C" />
      <path d="M30 50 Q16 62 26 80 L36 66 Z M70 50 Q84 62 74 80 L64 66 Z" fill="#6B4226" />
    </g>
  ),
  'pet-camel': (
    <g>
      <ellipse cx="50" cy="62" rx="26" ry="14" fill="#D9A54A" />
      <ellipse cx="42" cy="48" rx="9" ry="9" fill="#D9A54A" /><ellipse cx="58" cy="48" rx="9" ry="9" fill="#D9A54A" />
      <path d="M74 60 Q84 40 80 26" stroke="#D9A54A" strokeWidth="9" fill="none" strokeLinecap="round" />
      <ellipse cx="82" cy="24" rx="9" ry="7" fill="#E6B65C" />{eye(84, 22, 2)}
      {[32, 44, 58, 68].map((x) => <rect key={x} x={x} y="70" width="4" height="16" rx="2" fill="#C28F35" />)}
    </g>
  ),
  'pet-dolphin': (
    <g>
      <path d="M14 60 Q40 26 76 40 Q90 46 92 54 Q80 52 74 56 Q56 70 30 66 Z" fill="#56B4E9" />
      <path d="M50 38 L58 24 L62 40 Z" fill="#3F9BD0" />
      <path d="M18 60 L6 52 L10 66 Z" fill="#3F9BD0" />
      <path d="M40 60 Q56 66 72 56" fill="#DDF1FB" />
      {eye(72, 46, 2.2)}
    </g>
  ),
  'pet-peacock': (
    <g>
      {[-60, -30, 0, 30, 60].map((a) => <ellipse key={a} cx="50" cy="36" rx="9" ry="28" fill="#009E73" transform={`rotate(${a} 50 64)`} />)}
      {[-60, -30, 0, 30, 60].map((a) => <circle key={'c' + a} cx="50" cy="14" r="5" fill="#0072B2" stroke="#F7C95C" strokeWidth="2" transform={`rotate(${a} 50 64)`} />)}
      <ellipse cx="50" cy="66" rx="11" ry="16" fill="#1F5FA8" />
      <circle cx="50" cy="48" r="8" fill="#1F5FA8" />{eye(52, 47, 1.8)}
    </g>
  ),
  'pet-unicorn': (
    <g>
      <path d="M50 14 L54 34 L46 34 Z" fill="#F7C95C" />
      <ellipse cx="50" cy="66" rx="24" ry="14" fill="#FFFFFF" stroke="#E5E5E5" />
      <circle cx="50" cy="44" r="16" fill="#FFFFFF" stroke="#E5E5E5" />
      <path d="M34 36 Q30 54 40 60 M36 30 Q26 40 30 52" stroke="#CC79A7" strokeWidth="5" fill="none" strokeLinecap="round" />
      {eye(46, 42)}{eye(56, 42)}{smile(51, 49, 6)}
    </g>
  ),
  'deco-tree': (<g><rect x="45" y="56" width="10" height="30" rx="3" fill="#8A5A2B" /><circle cx="50" cy="42" r="22" fill="#2E9E5B" /><circle cx="38" cy="50" r="12" fill="#3CB371" /><circle cx="62" cy="50" r="12" fill="#3CB371" /></g>),
  'deco-palm': (<g><path d="M48 88 Q44 60 52 34" stroke="#8A5A2B" strokeWidth="7" fill="none" strokeLinecap="round" />{[-70, -30, 10, 50, 90].map((a) => <ellipse key={a} cx="52" cy="22" rx="6" ry="20" fill="#2E9E5B" transform={`rotate(${a} 52 34)`} />)}<circle cx="54" cy="36" r="3" fill="#8A5A2B" /></g>),
  'deco-fountain': (<g><ellipse cx="50" cy="78" rx="34" ry="8" fill="#9FC6E0" stroke="#5B6B7F" /><rect x="44" y="44" width="12" height="32" fill="#C9D3DC" /><ellipse cx="50" cy="44" rx="18" ry="5" fill="#9FC6E0" stroke="#5B6B7F" /><path d="M50 40 Q40 20 30 40 M50 40 Q60 20 70 40" stroke="#56B4E9" strokeWidth="3" fill="none" /></g>),
  'deco-flowers': (<g><rect x="20" y="66" width="60" height="18" rx="4" fill="#8A5A2B" />{[30, 44, 58, 72].map((x, i) => <g key={x}><line x1={x} y1="66" x2={x} y2="48" stroke="#2E9E5B" strokeWidth="3" /><circle cx={x} cy="44" r="7" fill={['#CC79A7', '#E69F00', '#D55E00', '#56B4E9'][i]} /><circle cx={x} cy="44" r="2.5" fill="#F7C95C" /></g>)}</g>),
  'deco-lantern': (<g><line x1="50" y1="8" x2="50" y2="20" stroke="#5B6B7F" strokeWidth="2" /><path d="M36 22 H64 L60 30 H40 Z" fill="#B07400" /><rect x="38" y="30" width="24" height="34" rx="4" fill="#F7C95C" stroke="#B07400" strokeWidth="2" /><path d="M44 36 L50 44 L56 36 M44 58 L50 50 L56 58" stroke="#B07400" strokeWidth="1.5" fill="none" /><path d="M36 64 H64 L60 72 H40 Z" fill="#B07400" /></g>),
  'deco-ferris': (<g><circle cx="50" cy="42" r="30" fill="none" stroke="#CC79A7" strokeWidth="4" />{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <g key={a}><line x1="50" y1="42" x2={50 + 30 * Math.cos((a * Math.PI) / 180)} y2={42 + 30 * Math.sin((a * Math.PI) / 180)} stroke="#CC79A7" strokeWidth="1.5" /><circle cx={50 + 30 * Math.cos((a * Math.PI) / 180)} cy={42 + 30 * Math.sin((a * Math.PI) / 180)} r="4.5" fill={a % 90 ? '#56B4E9' : '#E69F00'} /></g>)}<path d="M50 42 L34 88 M50 42 L66 88" stroke="#5B6B7F" strokeWidth="4" /></g>),
  'deco-statue': (<g><rect x="30" y="72" width="40" height="14" rx="2" fill="#C9D3DC" /><rect x="40" y="40" width="20" height="32" rx="4" fill="#B5BAC0" /><circle cx="50" cy="32" r="10" fill="#B5BAC0" /><ellipse cx="50" cy="56" rx="10" ry="8" fill="#F49AC1" /><circle cx="50" cy="48" r="3" fill="#F7C95C" /></g>),
  'deco-abra': (<g><path d="M14 66 Q50 86 86 66 Z" fill="#8A5A2B" /><rect x="30" y="50" width="40" height="16" rx="3" fill="#E69F00" /><path d="M30 50 H70 L66 44 H34 Z" fill="#B5452B" /><path d="M6 76 Q50 92 94 76" stroke="#56B4E9" strokeWidth="4" fill="none" /></g>),
  'deco-balloon': (<g><ellipse cx="50" cy="36" rx="24" ry="28" fill="#D55E00" /><path d="M38 12 Q50 36 38 60 M62 12 Q50 36 62 60" stroke="#F7C95C" strokeWidth="5" fill="none" /><path d="M38 60 L44 74 M62 60 L56 74" stroke="#5B6B7F" strokeWidth="1.5" /><rect x="42" y="74" width="16" height="12" rx="2" fill="#8A5A2B" /></g>),
  'deco-fireworks': (<g>{[[50, 34, '#E69F00'], [28, 50, '#CC79A7'], [72, 52, '#56B4E9']].map(([x, y, c], k) => <g key={k}>{Array.from({ length: 10 }, (_, i) => <line key={i} x1={x} y1={y} x2={x + 14 * Math.cos((i * Math.PI) / 5)} y2={y + 14 * Math.sin((i * Math.PI) / 5)} stroke={c} strokeWidth="3" strokeLinecap="round" />)}<circle cx={x} cy={y} r="3" fill="#fff" /></g>)}</g>),
  'deco-island': (<g><ellipse cx="50" cy="78" rx="40" ry="8" fill="#56B4E9" /><ellipse cx="50" cy="72" rx="28" ry="8" fill="#F2D49B" /><path d="M48 72 Q44 50 52 36" stroke="#8A5A2B" strokeWidth="5" fill="none" />{[-60, -20, 20, 60].map((a) => <ellipse key={a} cx="52" cy="22" rx="5" ry="15" fill="#2E9E5B" transform={`rotate(${a} 52 34)`} />)}</g>),
  'deco-rocket': (<g><path d="M50 8 Q66 28 64 62 H36 Q34 28 50 8 Z" fill="#F2F2F2" stroke="#9AA0A6" strokeWidth="2" /><circle cx="50" cy="36" r="7" fill="#56B4E9" stroke="#0072B2" strokeWidth="2" /><path d="M36 50 L24 70 L36 64 Z M64 50 L76 70 L64 64 Z" fill="#D55E00" /><path d="M42 62 Q50 92 58 62 Z" fill="#E69F00" /></g>),
  'deco-tower': (<g><path d="M44 88 L48 30 L50 6 L52 30 L56 88 Z" fill="#9AA0A6" /><path d="M46 60 H54 M47 44 H53" stroke="#F2F2F2" strokeWidth="2" /><circle cx="50" cy="20" r="2.5" fill="#E69F00" /></g>),
};

function Sticker({ item, size = 48 }) {
  const art = ART[item?.id];
  if (!art) return <span style={{ fontSize: size * 0.8, lineHeight: 1 }} aria-hidden>{item?.art}</span>;
  return (
    <svg viewBox="0 0 100 92" width={size} height={size * 0.92} role="img" aria-label={item.name?.en || item.id} className="overflow-visible">
      {art}
    </svg>
  );
}
export default memo(Sticker);
