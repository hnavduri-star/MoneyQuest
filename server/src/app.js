import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { newId, newToken, newFamilyCode, sha256, hashPin, verifyPin, rateLimiter, securityHeaders } from './security.js';
import { checkNickname, isPin, isProfileId } from '../../engine/nickname.js';
import { AGE_TIERS } from '../../engine/text.js';

const MAX_STATE_BYTES = 400_000;

export function createApp({ db, clientDist } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(securityHeaders);
  app.use(express.json({ limit: '512kb' }));

  const q = {
    insertFamily: db.prepare('INSERT INTO families (id, code, pin_hash, created_at) VALUES (?, ?, ?, ?)'),
    familyByCode: db.prepare('SELECT * FROM families WHERE code = ?'),
    familyById: db.prepare('SELECT * FROM families WHERE id = ?'),
    insertDevice: db.prepare('INSERT INTO devices (token_hash, family_id, created_at, last_seen) VALUES (?, ?, ?, ?)'),
    deviceByToken: db.prepare('SELECT * FROM devices WHERE token_hash = ?'),
    touchDevice: db.prepare('UPDATE devices SET last_seen = ? WHERE token_hash = ?'),
    profilesByFamily: db.prepare('SELECT * FROM profiles WHERE family_id = ? ORDER BY created_at'),
    profileById: db.prepare('SELECT * FROM profiles WHERE id = ?'),
    insertProfile: db.prepare('INSERT INTO profiles (id, family_id, nickname, age_tier, meta, state, summary, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'),
    updateProfile: db.prepare('UPDATE profiles SET nickname = ?, age_tier = ?, meta = ?, state = ?, summary = ?, updated_at = ? WHERE id = ?'),
    deleteProfile: db.prepare('DELETE FROM profiles WHERE id = ? AND family_id = ?'),
  };

  const pinLimiter = rateLimiter({ windowMs: 60_000, max: 6 });
  const createLimiter = rateLimiter({ windowMs: 60_000, max: 10 });

  function issueDevice(familyId) {
    const token = newToken();
    const now = Date.now();
    q.insertDevice.run(sha256(token), familyId, now, now);
    return token;
  }

  function auth(req, res, next) {
    const m = /^Bearer (.+)$/.exec(req.get('authorization') || '');
    const device = m && q.deviceByToken.get(sha256(m[1]));
    if (!device) return res.status(401).json({ error: 'unauthorized' });
    q.touchDevice.run(Date.now(), device.token_hash);
    req.family = q.familyById.get(device.family_id);
    next();
  }

  const toProfile = (r, withState = true) => ({
    id: r.id,
    nickname: r.nickname,
    ageTier: r.age_tier,
    meta: JSON.parse(r.meta),
    summary: JSON.parse(r.summary),
    updatedAt: r.updated_at,
    ...(withState ? { state: JSON.parse(r.state) } : {}),
  });

  app.get('/api/health', (req, res) => res.json({ ok: true, app: 'moneyquest' }));

  app.post('/api/families', createLimiter, (req, res) => {
    const { pin } = req.body || {};
    if (!isPin(pin)) return res.status(400).json({ error: 'badPin' });
    const id = newId();
    let code;
    for (let i = 0; i < 5; i++) {
      code = newFamilyCode();
      if (!q.familyByCode.get(code)) break;
    }
    q.insertFamily.run(id, code, hashPin(pin), Date.now());
    res.status(201).json({ familyId: id, code, token: issueDevice(id) });
  });

  app.post('/api/families/join', pinLimiter, (req, res) => {
    const { code, pin } = req.body || {};
    const fam = typeof code === 'string' && q.familyByCode.get(code.trim().toUpperCase());
    if (!fam || !isPin(pin) || !verifyPin(pin, fam.pin_hash)) return res.status(403).json({ error: 'badCodeOrPin' });
    res.json({ familyId: fam.id, code: fam.code, token: issueDevice(fam.id) });
  });

  app.post('/api/families/verify-pin', auth, pinLimiter, (req, res) => {
    const { pin } = req.body || {};
    res.json({ ok: isPin(pin) && verifyPin(pin, req.family.pin_hash) });
  });

  app.get('/api/family', auth, (req, res) => {
    res.json({ familyId: req.family.id, code: req.family.code, profiles: q.profilesByFamily.all(req.family.id).map((r) => toProfile(r)) });
  });

  /** Upsert a profile. Last write wins by updatedAt; if the server copy is newer it is returned instead. */
  app.put('/api/profiles/:id', auth, (req, res) => {
    const { id } = req.params;
    if (!isProfileId(id)) return res.status(400).json({ error: 'badId' });
    const { nickname, ageTier, meta = {}, state = {}, summary = {}, updatedAt } = req.body || {};
    const nick = checkNickname(nickname);
    if (!nick.ok) return res.status(400).json({ error: 'badNickname', reason: nick.reason });
    if (!AGE_TIERS.includes(ageTier)) return res.status(400).json({ error: 'badAgeTier' });
    const stateJson = JSON.stringify(state);
    if (stateJson.length > MAX_STATE_BYTES) return res.status(413).json({ error: 'stateTooLarge' });
    const ts = Number.isFinite(updatedAt) ? Math.min(updatedAt, Date.now() + 60_000) : Date.now();
    const existing = q.profileById.get(id);
    if (existing && existing.family_id !== req.family.id) return res.status(404).json({ error: 'notFound' });
    if (existing && existing.updated_at > ts) return res.status(409).json({ error: 'stale', profile: toProfile(existing) });
    const args = [nick.value, ageTier, JSON.stringify(meta), stateJson, JSON.stringify(summary), ts];
    if (existing) q.updateProfile.run(...args, id);
    else q.insertProfile.run(id, req.family.id, ...args, Date.now());
    res.json({ ok: true, updatedAt: ts });
  });

  app.delete('/api/profiles/:id', auth, pinLimiter, (req, res) => {
    const pin = req.get('x-parent-pin');
    if (!isPin(pin) || !verifyPin(pin, req.family.pin_hash)) return res.status(403).json({ error: 'badPin' });
    const r = q.deleteProfile.run(req.params.id, req.family.id);
    res.json({ ok: r.changes > 0 });
  });

  /** Family-only leaderboard: nicknames, avatar look and progress numbers. Nothing else. */
  app.get('/api/leaderboard', auth, (req, res) => {
    const rows = q.profilesByFamily.all(req.family.id).map((r) => {
      const p = toProfile(r, false);
      return { id: p.id, nickname: p.nickname, avatar: p.meta.avatar || null, summary: p.summary };
    });
    const top = [...rows].sort((a, b) => (b.summary.weekXp || 0) - (a.summary.weekXp || 0));
    const improved = [...rows].sort((a, b) => (b.summary.improvement || 0) - (a.summary.improvement || 0));
    res.json({ top, improved });
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'notFound' }));

  if (clientDist && existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false, maxAge: '1h', setHeaders: (res, p) => p.includes('/assets/') && res.setHeader('Cache-Control', 'public, max-age=31536000, immutable') }));
    app.get('*', (req, res) => res.sendFile(join(clientDist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'tooLarge' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'badJson' });
    console.error(err);
    res.status(500).json({ error: 'server' });
  });
  return app;
}
