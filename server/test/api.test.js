import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';

let app;
beforeEach(() => {
  app = createApp({ db: openDb(':memory:') });
});

async function family(pin = '1234') {
  const r = await request(app).post('/api/families').send({ pin });
  return r.body;
}
const profile = (over = {}) => ({ nickname: 'StarSaver', ageTier: '10-12', meta: { avatar: { species: 'fox' } }, state: { xp: 10 }, summary: { weekXp: 10, improvement: 5 }, updatedAt: 1000, ...over });

describe('MoneyQuest API', () => {
  it('health and security headers', async () => {
    const r = await request(app).get('/api/health');
    expect(r.body.ok).toBe(true);
    expect(r.headers['content-security-policy']).toMatch(/default-src 'self'/);
    expect(r.headers['x-powered-by']).toBeUndefined();
  });

  it('creates a family with a PIN and rejects bad PINs', async () => {
    expect((await request(app).post('/api/families').send({ pin: '12' })).status).toBe(400);
    const f = await family();
    expect(f.code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(f.token.length).toBeGreaterThan(20);
  });

  it('requires a token', async () => {
    expect((await request(app).get('/api/family')).status).toBe(401);
    expect((await request(app).get('/api/family').set('Authorization', 'Bearer nope')).status).toBe(401);
  });

  it('saves, loads and syncs profiles (last write wins)', async () => {
    const f = await family();
    const auth = { Authorization: `Bearer ${f.token}` };
    expect((await request(app).put('/api/profiles/profile_abc123').set(auth).send(profile())).body.ok).toBe(true);
    const fam = await request(app).get('/api/family').set(auth);
    expect(fam.body.profiles).toHaveLength(1);
    expect(fam.body.profiles[0].state.xp).toBe(10);
    const stale = await request(app).put('/api/profiles/profile_abc123').set(auth).send(profile({ updatedAt: 500, state: { xp: 1 } }));
    expect(stale.status).toBe(409);
    expect(stale.body.profile.state.xp).toBe(10);
    await request(app).put('/api/profiles/profile_abc123').set(auth).send(profile({ updatedAt: 2000, state: { xp: 99 } }));
    expect((await request(app).get('/api/family').set(auth)).body.profiles[0].state.xp).toBe(99);
  });

  it('rejects nicknames that look like real contact details', async () => {
    const f = await family();
    const auth = { Authorization: `Bearer ${f.token}` };
    for (const nickname of ['a', 'me@mail.com', 'call 0501234567', 'www.site.com']) {
      const r = await request(app).put('/api/profiles/profile_abc123').set(auth).send(profile({ nickname }));
      expect(r.status).toBe(400);
    }
    expect((await request(app).put('/api/profiles/profile_abc123').set(auth).send(profile({ nickname: 'نجمة' }))).status).toBe(200);
  });

  it('keeps families apart', async () => {
    const a = await family();
    const b = await family();
    await request(app).put('/api/profiles/profile_aaa111').set({ Authorization: `Bearer ${a.token}` }).send(profile());
    const r = await request(app).put('/api/profiles/profile_aaa111').set({ Authorization: `Bearer ${b.token}` }).send(profile({ updatedAt: 9999 }));
    expect(r.status).toBe(404);
    expect((await request(app).get('/api/family').set({ Authorization: `Bearer ${b.token}` })).body.profiles).toHaveLength(0);
  });

  it('joins another device with code + PIN', async () => {
    const f = await family('4321');
    expect((await request(app).post('/api/families/join').send({ code: f.code, pin: '0000' })).status).toBe(403);
    const j = await request(app).post('/api/families/join').send({ code: f.code.toLowerCase(), pin: '4321' });
    expect(j.body.familyId).toBe(f.familyId);
  });

  it('rate limits PIN guessing', async () => {
    const f = await family();
    let last;
    for (let i = 0; i < 8; i++) last = await request(app).post('/api/families/join').send({ code: f.code, pin: '0000' });
    expect(last.status).toBe(429);
  });

  it('deleting a profile needs the parent PIN', async () => {
    const f = await family('5555');
    const auth = { Authorization: `Bearer ${f.token}` };
    await request(app).put('/api/profiles/profile_del000').set(auth).send(profile());
    expect((await request(app).delete('/api/profiles/profile_del000').set(auth).set('x-parent-pin', '1111')).status).toBe(403);
    expect((await request(app).delete('/api/profiles/profile_del000').set(auth).set('x-parent-pin', '5555')).body.ok).toBe(true);
  });

  it('family leaderboard shares nicknames and progress only', async () => {
    const f = await family();
    const auth = { Authorization: `Bearer ${f.token}` };
    await request(app).put('/api/profiles/profile_one111').set(auth).send(profile({ nickname: 'Ace', summary: { weekXp: 50, improvement: 1 } }));
    await request(app).put('/api/profiles/profile_two222').set(auth).send(profile({ nickname: 'Bee', summary: { weekXp: 20, improvement: 30 } }));
    const lb = (await request(app).get('/api/leaderboard').set(auth)).body;
    expect(lb.top.map((r) => r.nickname)).toEqual(['Ace', 'Bee']);
    expect(lb.improved[0].nickname).toBe('Bee');
    expect(lb.top[0].state).toBeUndefined();
  });

  it('rejects oversized state', async () => {
    const f = await family();
    const r = await request(app).put('/api/profiles/profile_big000').set({ Authorization: `Bearer ${f.token}` }).send(profile({ state: { junk: 'x'.repeat(450_000) } }));
    expect(r.status).toBe(413);
  });
});
