/** A simple, original Dubai-inspired skyline (tall tower, sail hotel, frame, creek dhow). */
export default function Skyline({ height = 120 }) {
  return (
    <svg viewBox="0 0 400 120" width="100%" height={height} preserveAspectRatio="xMidYMax slice" role="img" aria-label="Dubai skyline">
      <defs>
        <linearGradient id="dxbSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7C95C" />
          <stop offset="1" stopColor="#FFE9C2" />
        </linearGradient>
      </defs>
      <rect width="400" height="120" fill="url(#dxbSky)" />
      <circle cx="330" cy="38" r="18" fill="#FFF3D1" opacity="0.9" />
      {/* towers */}
      <g fill="#E0A458" opacity="0.55">
        <rect x="20" y="62" width="22" height="48" />
        <rect x="46" y="50" width="16" height="60" />
        <rect x="250" y="56" width="20" height="54" />
        <rect x="274" y="66" width="26" height="44" />
        <rect x="360" y="60" width="18" height="50" />
      </g>
      {/* tall needle tower */}
      <path d="M170 110 L176 60 L180 30 L183 6 L186 30 L190 60 L196 110 Z" fill="#B97A4E" />
      <path d="M176 60 L190 60 M178 45 L188 45 M180 30 L186 30" stroke="#FFE9C2" strokeWidth="1.5" />
      {/* sail hotel */}
      <path d="M90 110 L92 40 Q122 58 126 110 Z" fill="#C98B55" />
      <path d="M92 40 L92 110" stroke="#8A5A2B" strokeWidth="2" />
      {/* frame */}
      <path d="M215 110 V58 H243 V110 M215 62 H243" stroke="#B07400" strokeWidth="5" fill="none" />
      {/* creek with dhow */}
      <rect y="104" width="400" height="16" fill="#56B4E9" />
      <path d="M300 104 Q318 112 336 104 Z" fill="#8A5A2B" />
      <path d="M318 104 V86 L332 100 Z" fill="#FFF8EC" />
      <path d="M0 110 Q50 106 100 110 T200 110 T300 110 T400 110" stroke="#FFFFFF" strokeOpacity="0.6" fill="none" />
    </svg>
  );
}
