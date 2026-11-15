/** Simple, original city skylines (silhouettes only) for the journey header. */
const SKIES = { light: ['#F7C95C', '#FFE9C2'], dark: ['#1B2A5A', '#33407A'] };

function Shapes({ city }) {
  const c = '#B97A4E';
  const s = '#E0A458';
  switch (city) {
    case 'paris':
      return (
        <g>
          <g fill={s} opacity="0.55">
            <rect x="20" y="70" width="40" height="40" /><rect x="250" y="66" width="46" height="44" /><rect x="320" y="74" width="50" height="36" />
          </g>
          <path d="M150 110 L170 60 L176 30 L180 8 L184 30 L190 60 L210 110 Z M163 110 Q180 86 197 110" fill={c} />
          <path d="M168 66 H192 M172 46 H188" stroke="#FFE9C2" strokeWidth="2" />
          <path d="M80 110 V78 H120 V110 M86 78 Q100 60 114 78" fill={c} opacity="0.8" />
        </g>
      );
    case 'london':
      return (
        <g>
          <circle cx="300" cy="72" r="34" fill="none" stroke={c} strokeWidth="4" />
          {[0, 45, 90, 135].map((a) => <line key={a} x1="300" y1="72" x2={300 + 34 * Math.cos((a * Math.PI) / 180)} y2={72 + 34 * Math.sin((a * Math.PI) / 180)} stroke={c} strokeWidth="1.5" />)}
          <rect x="150" y="30" width="22" height="80" fill={c} />
          <path d="M150 30 L161 8 L172 30 Z" fill={c} />
          <circle cx="161" cy="44" r="6" fill="#FFE9C2" />
          <g fill={s} opacity="0.55"><rect x="20" y="64" width="30" height="46" /><rect x="60" y="76" width="50" height="34" /><rect x="200" y="70" width="40" height="40" /></g>
        </g>
      );
    case 'mumbai':
      return (
        <g>
          <path d="M140 110 V56 H220 V110 H200 V84 Q180 62 160 84 V110 Z" fill={c} />
          <path d="M140 56 L150 44 H210 L220 56 Z" fill={c} />
          {[146, 210].map((x) => <rect key={x} x={x} y="34" width="6" height="22" fill={c} />)}
          <g fill={s} opacity="0.55"><rect x="20" y="58" width="24" height="52" /><rect x="50" y="46" width="20" height="64" /><rect x="260" y="50" width="26" height="60" /><rect x="300" y="62" width="30" height="48" /></g>
        </g>
      );
    case 'newyork':
      return (
        <g>
          <path d="M170 110 V44 H176 V28 H182 V10 H184 V28 H190 V44 H196 V110 Z" fill={c} />
          <g fill={s} opacity="0.55"><rect x="20" y="60" width="26" height="50" /><rect x="52" y="44" width="22" height="66" /><rect x="220" y="52" width="30" height="58" /><rect x="256" y="40" width="22" height="70" /></g>
          <path d="M330 110 V70 L336 60 L334 46 L340 40 L344 46 L342 60 L348 70 V110 Z" fill={c} opacity="0.9" />
        </g>
      );
    case 'abudhabi':
      return (
        <g>
          <path d="M120 110 V80 H240 V110 Z" fill={s} opacity="0.8" />
          {[150, 180, 210].map((x, i) => <path key={x} d={`M${x - 14} 80 Q${x} ${i === 1 ? 46 : 58} ${x + 14} 80 Z`} fill={c} />)}
          {[124, 236].map((x) => <rect key={x} x={x - 3} y="40" width="6" height="40" fill={c} />)}
          <g fill={s} opacity="0.55"><rect x="280" y="40" width="20" height="70" /><rect x="306" y="34" width="20" height="76" /><rect x="332" y="46" width="20" height="64" /><rect x="20" y="62" width="40" height="48" /></g>
        </g>
      );
    default: // dubai
      return (
        <g>
          <g fill={s} opacity="0.55"><rect x="20" y="62" width="22" height="48" /><rect x="46" y="50" width="16" height="60" /><rect x="250" y="56" width="20" height="54" /><rect x="274" y="66" width="26" height="44" /><rect x="360" y="60" width="18" height="50" /></g>
          <path d="M170 110 L176 60 L180 30 L183 6 L186 30 L190 60 L196 110 Z" fill={c} />
          <path d="M90 110 L92 40 Q122 58 126 110 Z" fill="#C98B55" />
          <path d="M215 110 V58 H243 V110 M215 62 H243" stroke="#B07400" strokeWidth="5" fill="none" />
        </g>
      );
  }
}

export default function Skyline({ city = 'dubai', height = 120, dark = false }) {
  const [top, bottom] = dark ? SKIES.dark : SKIES.light;
  return (
    <svg viewBox="0 0 400 120" width="100%" height={height} preserveAspectRatio="xMidYMax slice" role="img" aria-label={`${city} skyline`}>
      <defs>
        <linearGradient id={`sky-${city}-${dark}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="400" height="120" fill={`url(#sky-${city}-${dark})`} />
      <circle cx="330" cy="30" r="16" fill={dark ? '#F4F1D0' : '#FFF3D1'} opacity="0.9" />
      <Shapes city={city} />
      <rect y="106" width="400" height="14" fill={dark ? '#23506A' : '#56B4E9'} />
    </svg>
  );
}
