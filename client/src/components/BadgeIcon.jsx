const RARITY = {
  common: { ring: '#9AA0A6', fill: '#F2F4F6', label: '●' },
  rare: { ring: '#0072B2', fill: '#DDF1FB', label: '◆' },
  epic: { ring: '#CC79A7', fill: '#F7E3EE', label: '★' },
  legendary: { ring: '#E69F00', fill: '#FFF0CC', label: '♛' },
};
/** Badge medal. Rarity is shown by ring colour AND a shape symbol, so it never relies on colour alone. */
export default function BadgeIcon({ badge, earned, size = 64 }) {
  const r = RARITY[badge.rarity] || RARITY.common;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={badge.rarity} style={{ filter: earned ? 'none' : 'grayscale(1)', opacity: earned ? 1 : 0.45 }}>
      <path d="M20 44 L14 62 L24 57 L30 64 L32 46 Z M44 44 L50 62 L40 57 L34 64 L32 46 Z" fill={r.ring} opacity="0.8" />
      <circle cx="32" cy="28" r="24" fill={r.fill} stroke={r.ring} strokeWidth="4" />
      <text x="32" y="37" textAnchor="middle" fontSize="24">{earned ? badge.icon : '🔒'}</text>
      <circle cx="52" cy="10" r="8" fill={r.ring} />
      <text x="52" y="14" textAnchor="middle" fontSize="10" fill="#FFF" fontWeight="900">{r.label}</text>
    </svg>
  );
}
