/** Everything is saved on the device first (works offline), then backed up to the family account. */
const KEY = 'moneyquest:v1';

export function loadSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through */
  }
  return { family: null, activeId: null, profiles: {}, device: {} };
}
export function persist(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export function newProfileId() {
  const b = crypto.getRandomValues(new Uint8Array(12));
  return 'p_' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}
/** Salted SHA-256 of the PIN, kept only so the PIN can be checked on this device while offline. */
export async function localPinHash(pin, salt) {
  const s = salt || Array.from(crypto.getRandomValues(new Uint8Array(8)), (x) => x.toString(16).padStart(2, '0')).join('');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${s}:${pin}`));
  return `${s}:${Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, '0')).join('')}`;
}
export async function checkLocalPin(pin, stored) {
  if (!stored) return false;
  const [salt] = stored.split(':');
  return (await localPinHash(pin, salt)) === stored;
}
