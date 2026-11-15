import { useGame } from '../store.jsx';
import { useT } from '../lib/i18n.js';

/**
 * A partner's mark: their initials on a satin tile in their colours. A real partner can swap this for
 * their own logo file later (editions.json "logo"), so no third-party artwork ships with the app.
 */
export function BrandMark({ brand, size = 40 }) {
  if (!brand) return null;
  const { primary, accent } = brand.colors;
  const letters = brand.logo || '';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={letters}>
      <defs>
        <linearGradient id={`bm-${letters}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={primary} stopOpacity="0.85" />
          <stop offset="1" stopColor={primary} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="12" fill={`url(#bm-${letters})`} />
      <rect x="1.5" y="1.5" width="45" height="22" rx="11" fill="#fff" opacity="0.12" />
      <rect x="6" y="35" width="36" height="4" rx="2" fill={accent} />
      <text x="24" y="29" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize={letters.length > 2 ? 14 : 18} fill="#fff">
        {letters}
      </text>
    </svg>
  );
}

/** "Presented by ABC Bank · Sunrise International School" strip. Shows nothing for the standard edition. */
export function PartnerStrip({ compact = false }) {
  const { bank, school } = useGame();
  const { t, tx } = useT();
  const sponsors = [bank.sponsor ? bank : null, school].filter(Boolean);
  if (!sponsors.length) return null;
  return (
    <div className={`card flex items-center gap-3 ${compact ? 'px-3 py-2' : 'p-3'}`}>
      <div className="flex -space-x-2 rtl:space-x-reverse">
        {sponsors.map((b) => <BrandMark key={b.logo} brand={b} size={compact ? 30 : 40} />)}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-soft">{t('partner.presentedBy')}</p>
        <p className="font-extrabold leading-tight truncate">{sponsors.map((b) => tx(b.name)).join(' · ')}</p>
        {!compact && school?.motto && <p className="text-xs text-soft">“{tx(school.motto)}”</p>}
      </div>
    </div>
  );
}
