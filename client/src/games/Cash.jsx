/** A banknote or coin drawn in SVG, labelled in the city's own currency. */
const NOTE_COLORS = ['#7BC47F', '#56B4E9', '#CC79A7', '#E69F00', '#D55E00', '#9AA0A6', '#009E73', '#0072B2'];
export default function Cash({ value, kind, label, size = 1, onClick, dim }) {
  const El = onClick ? 'button' : 'span';
  if (kind === 'coin')
    return (
      <El type={onClick ? 'button' : undefined} onClick={onClick} className={`inline-flex ${dim ? 'opacity-40' : ''}`} aria-label={label}>
        <svg width={44 * size} height={44 * size} viewBox="0 0 44 44">
          <defs>
            <radialGradient id="cg" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#FFF1C4" /><stop offset="0.5" stopColor="#E3B341" /><stop offset="1" stopColor="#A87400" /></radialGradient>
          </defs>
          <circle cx="22" cy="22" r="20" fill="url(#cg)" stroke="#8A5A00" strokeWidth="1.5" />
          <circle cx="22" cy="22" r="15" fill="none" stroke="#8A5A00" strokeOpacity="0.4" />
          <text x="22" y="26" textAnchor="middle" fontSize={label.length > 5 ? 8 : 10} fontWeight="800" fontFamily="Arial, sans-serif" fill="#3A2A00">{label}</text>
        </svg>
      </El>
    );
  const parts = String(label).trim().split(/\s+/);
  const amt = (parts.find((x) => /\d/.test(x)) || label).replace(/[^\d.,]/g, '') || label;
  const cur = parts.filter((x) => x !== parts.find((y) => /\d/.test(y))).join(' ') || String(label).replace(/[\d.,\s]/g, '');
  const color = NOTE_COLORS[Math.abs(Math.round(Math.log10(value + 1) * 3)) % NOTE_COLORS.length];
  return (
    <El type={onClick ? 'button' : undefined} onClick={onClick} className={`inline-flex ${dim ? 'opacity-40' : ''}`} aria-label={label}>
      <svg width={84 * size} height={44 * size} viewBox="0 0 84 44">
        <rect x="1" y="1" width="82" height="42" rx="6" fill={color} stroke="#1E2A3A" strokeOpacity="0.3" />
        <rect x="5" y="5" width="74" height="34" rx="4" fill="none" stroke="#fff" strokeOpacity="0.6" strokeDasharray="3 2" />
        <circle cx="70" cy="22" r="8" fill="#fff" fillOpacity="0.35" />
        <text x="10" y="16" fontSize="9" fontWeight="800" fontFamily="Arial, sans-serif" fill="#fff">{cur}</text>
        <text x="34" y="33" textAnchor="middle" fontSize={amt.length > 4 ? 14 : 18} fontWeight="900" fontFamily="Arial, sans-serif" fill="#fff" stroke="#1E2A3A" strokeWidth="0.5">{amt}</text>
      </svg>
    </El>
  );
}
