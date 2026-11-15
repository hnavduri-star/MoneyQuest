import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

export const newId = () => randomBytes(12).toString('base64url');
export const newToken = () => randomBytes(32).toString('base64url');
export const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// Family codes avoid look-alike characters (0/O, 1/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newFamilyCode() {
  const bytes = randomBytes(8);
  let s = '';
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

export function hashPin(pin) {
  const salt = randomBytes(16);
  const key = scryptSync(String(pin), salt, 32);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}
export function verifyPin(pin, stored) {
  const [salt, key] = stored.split(':');
  const got = scryptSync(String(pin), Buffer.from(salt, 'hex'), 32);
  return timingSafeEqual(got, Buffer.from(key, 'hex'));
}

/** Tiny in-memory rate limiter (per key, sliding window). Enough for PIN/join brute-force protection. */
export function rateLimiter({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = `${req.ip}|${req.path}`;
    const now = Date.now();
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) return res.status(429).json({ error: 'tooManyAttempts' });
    list.push(now);
    hits.set(key, list);
    next();
  };
}

/** Strict, first-party-only security headers. No third-party scripts, fonts or trackers are allowed. */
export function securityHeaders(req, res, next) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  next();
}
