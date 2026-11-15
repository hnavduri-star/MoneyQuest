/** Input checks. Nicknames must not look like real contact details. */
const BLOCKED = ['fuck', 'shit', 'bitch', 'cunt', 'dick', 'sex', 'porn', 'nazi', 'kill', 'nigg', 'fag', 'slut', 'whore'];

export function checkNickname(raw) {
  const n = String(raw ?? '').trim().replace(/\s+/g, ' ');
  if (n.length < 2 || n.length > 16) return { ok: false, reason: 'length' };
  if (/@|https?:|www\.|\.com\b/i.test(n)) return { ok: false, reason: 'contact' };
  if (/\d{4,}/.test(n)) return { ok: false, reason: 'numbers' };
  const flat = n.toLowerCase().replace(/[^a-z]/g, '');
  if (BLOCKED.some((w) => flat.includes(w))) return { ok: false, reason: 'blocked' };
  if (!/^[\p{L}\p{N} _.\-'!]+$/u.test(n)) return { ok: false, reason: 'chars' };
  return { ok: true, value: n };
}

export const isPin = (p) => typeof p === 'string' && /^\d{4}$/.test(p);
export const isProfileId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(id);
