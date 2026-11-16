import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { processEvent } from '@engine/rewards.js';
import { createInitialState, migrateState, summarize } from '@engine/state.js';
import { dayKey, addDays } from '@engine/dates.js';
import { content, BUILD_EDITION, EDITION_PICKER } from './content.js';
import { getCity, getEdition, getBank, getSchool, editionCities, cityContext } from '@engine/city.js';
import { loadSaved, persist, newProfileId, localPinHash, checkLocalPin } from './lib/storage.js';
import { api } from './lib/api.js';
import { setSoundEnabled, setHapticsEnabled } from './lib/sound.js';
import { setVoiceEnabled } from './lib/speech.js';

export const DEFAULT_SETTINGS = {
  lang: 'en',
  currency: 'auto', // 'auto' = the chosen city's own currency
  sound: true,
  voice: false,
  haptics: true,
  reducedMotion: false,
  dyslexia: false,
  textSize: 'normal',
  islamic: true,
  sessionLimit: 20,
  appearance: 'auto', // 'light' | 'dark' | 'auto' (follow the device)
};
const CELEBRATE = new Set(['levelUp', 'badge', 'buildingUnlocked', 'buildingUpgraded', 'questDone', 'streak', 'bankInterest']);
const deviceLang = () => (typeof navigator !== 'undefined' && navigator.language?.startsWith('ar') ? 'ar' : 'en');

const GameCtx = createContext(null);
export const useGame = () => useContext(GameCtx);

export function GameProvider({ children }) {
  const [data, setData] = useState(() => {
    const d = loadSaved();
    for (const p of Object.values(d.profiles)) p.state = migrateState(p.state);
    return d;
  });
  const ref = useRef(data);
  const [queue, setQueue] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle');
  const syncTimer = useRef(null);

  const commit = useCallback((fn) => {
    const next = fn(ref.current);
    ref.current = next;
    persist(next);
    setData(next);
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => pushDirty(), 1500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = data.activeId ? data.profiles[data.activeId] : null;
  const settings = { ...DEFAULT_SETTINGS, ...(active?.meta?.settings || {}) };
  const lang = active ? settings.lang : data.device.lang || deviceLang();
  const appearance = active ? settings.appearance : data.device.appearance || 'auto';
  const [systemDark, setSystemDark] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const on = (e) => setSystemDark(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  const isDark = appearance === 'dark' || (appearance === 'auto' && systemDark);

  // ---------- partner edition (bank / school) and city ----------
  const editionId = (EDITION_PICKER && data.device.edition) || BUILD_EDITION;
  const edition = getEdition(content, editionId);
  const bank = getBank(content, edition);
  const school = getSchool(content, edition);
  const allowedCities = editionCities(content, edition);
  const wantedCity = active ? settings.city : data.device.city;
  const city = allowedCities.find((c) => c.id === wantedCity) || allowedCities.find((c) => c.id === edition.defaultCity) || allowedCities[0] || getCity(content);
  const cityCtx = useMemo(() => cityContext(content, city.id), [city.id]);
  const partner = bank.sponsor ? bank : school;
  const themes = useMemo(
    () => [...(partner ? [{ id: 'partner', color: partner.colors.primary, name: partner.short }] : []), ...content.characters.themes],
    [partner],
  );
  const themeColor = useCallback((id) => themes.find((x) => x.id === id)?.color || '#0072B2', [themes]);
  const deferred = useRef([]);
  const age = active?.ageTier || '10-12';

  // ---------- sync with the family account ----------
  const pushDirty = useCallback(async () => {
    const d = ref.current;
    if (!d.family?.token) return;
    const dirty = Object.values(d.profiles).filter((p) => p.dirty);
    if (!dirty.length) return;
    try {
      for (const p of dirty) {
        const body = { id: p.id, nickname: p.nickname, ageTier: p.ageTier, meta: p.meta, state: p.state, summary: summarize(p.state, dayKey(), (day, n) => addDays(day, -n)), updatedAt: p.updatedAt };
        try {
          await api.putProfile(d.family.token, body);
          commitQuiet((x) => (x.profiles[p.id]?.updatedAt === p.updatedAt ? setProfile(x, p.id, { dirty: false }) : x));
        } catch (e) {
          if (e.status === 409 && e.data?.profile) commitQuiet((x) => setProfile(x, p.id, fromServer(e.data.profile)));
          else throw e;
        }
      }
      setSyncStatus('ok');
    } catch {
      setSyncStatus('offline');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const commitQuiet = (fn) => {
    const next = fn(ref.current);
    if (next === ref.current) return;
    ref.current = next;
    persist(next);
    setData(next);
  };

  const pull = useCallback(async () => {
    const d = ref.current;
    if (!d.family?.token) return;
    try {
      const fam = await api.getFamily(d.family.token);
      commitQuiet((x) => {
        let n = { ...x, family: { ...x.family, code: fam.code } };
        for (const sp of fam.profiles) {
          const local = n.profiles[sp.id];
          if (!local || (sp.updatedAt > local.updatedAt && !local.dirty)) n = setProfile(n, sp.id, fromServer(sp));
        }
        return n;
      });
      setSyncStatus('ok');
      pushDirty();
    } catch (e) {
      setSyncStatus(e.status === 401 ? 'unlinked' : 'offline');
    }
  }, [pushDirty]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    pull();
    const on = () => pull();
    window.addEventListener('online', on);
    return () => window.removeEventListener('online', on);
  }, [pull]);

  // ---------- game events ----------
  const dispatch = useCallback(
    (event, { defer = false } = {}) => {
      const d = ref.current;
      const p = d.profiles[d.activeId];
      if (!p) return [];
      const { state, effects } = processEvent(p.state, event, content, { age: p.ageTier });
      if (state !== p.state) commit((x) => setProfile(x, p.id, { state, updatedAt: Date.now(), dirty: true }));
      const wanted = effects.filter((e) => CELEBRATE.has(e.type) && !(e.type === 'streak' && e.result === 'same'));
      // During a level, badges/level-ups wait until the level ends so they don't interrupt a question.
      if (defer) {
        deferred.current.push(...wanted);
        return effects;
      }
      const celebrate = batchCelebrations([...deferred.current.splice(0), ...wanted]);
      if (celebrate.length) setQueue((q) => [...q, ...celebrate]);
      return effects;
    },
    [commit],
  );

  // Daily login: on open, on return to the app, and when the date changes.
  useEffect(() => {
    if (!active) return;
    const check = () => {
      const p = ref.current.profiles[ref.current.activeId];
      if (p && p.state.streak.lastDay !== dayKey()) dispatch({ type: 'daily.login' });
    };
    check();
    const timer = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [active?.id, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- break reminder (anti-addiction) ----------
  const [playSeconds, setPlaySeconds] = useState(0);
  const [breakDue, setBreakDue] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') setPlaySeconds((s) => s + 5);
    }, 5000);
    return () => clearInterval(t);
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (settings.sessionLimit > 0 && playSeconds >= settings.sessionLimit * 60) setBreakDue(true);
  }, [playSeconds, settings.sessionLimit]);
  const snoozeBreak = () => {
    setBreakDue(false);
    setPlaySeconds(0);
  };

  // ---------- apply accessibility + language to the document ----------
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.classList.toggle('dyslexic', !!settings.dyslexia);
    root.classList.toggle('reduce-motion', !!settings.reducedMotion);
    root.classList.toggle('text-large', settings.textSize === 'large');
    root.classList.toggle('text-xl', settings.textSize === 'xl');
    // Light / dark: an explicit choice sets data-theme; Auto leaves the device (or host) setting in charge.
    if (appearance === 'auto') {
      if (root.dataset.mqTheme) {
        delete root.dataset.theme;
        delete root.dataset.mqTheme;
      }
    } else {
      root.dataset.theme = appearance;
      root.dataset.mqTheme = '1';
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#0E1220' : '#0072B2');
    const theme = themeColor(active?.meta?.theme);
    root.style.setProperty('--theme', theme);
    setSoundEnabled(settings.sound);
    setHapticsEnabled(settings.haptics);
    setVoiceEnabled(settings.voice);
  }, [themeColor, appearance, isDark, lang, settings.dyslexia, settings.reducedMotion, settings.textSize, settings.sound, settings.haptics, settings.voice, active?.meta?.theme]);

  // ---------- family + profiles ----------
  const actions = useMemo(
    () => ({
      setDeviceLang: (l) => commit((x) => ({ ...x, device: { ...x.device, lang: l } })),
      setDeviceAppearance: (a) => commit((x) => ({ ...x, device: { ...x.device, appearance: a } })),
      setDeviceEdition: (e) => commit((x) => ({ ...x, device: { ...x.device, edition: e } })),
      setDeviceCity: (c) => commit((x) => ({ ...x, device: { ...x.device, city: c } })),
      async createFamily(pin) {
        const pinHash = await localPinHash(pin);
        let fam = { pinHash, local: true };
        try {
          const r = await api.createFamily(pin);
          fam = { pinHash, id: r.familyId, code: r.code, token: r.token };
          setSyncStatus('ok');
        } catch {
          setSyncStatus('offline');
        }
        commit((x) => ({ ...x, family: fam }));
      },
      /** Link a family made offline to the server later (needs the PIN again). */
      async linkFamily(pin) {
        if (!(await checkLocalPin(pin, ref.current.family?.pinHash))) return false;
        const r = await api.createFamily(pin);
        commit((x) => {
          const profiles = Object.fromEntries(Object.entries(x.profiles).map(([k, p]) => [k, { ...p, dirty: true }]));
          return { ...x, profiles, family: { ...x.family, local: false, id: r.familyId, code: r.code, token: r.token } };
        });
        return true;
      },
      async joinFamily(code, pin) {
        const r = await api.joinFamily(code, pin);
        const pinHash = await localPinHash(pin);
        commit((x) => ({ ...x, family: { pinHash, id: r.familyId, code: r.code, token: r.token } }));
        await pull();
      },
      checkPin: (pin) => checkLocalPin(pin, ref.current.family?.pinHash),
      createProfile({ nickname, ageTier, meta }) {
        const id = newProfileId();
        const state = createInitialState({ profileId: id, start: { coins: content.rewards.startingCoins } });
        commit((x) => ({ ...x, activeId: id, profiles: { ...x.profiles, [id]: { id, nickname, ageTier, meta, state, updatedAt: Date.now(), dirty: true } } }));
        return id;
      },
      updateProfile(patch) {
        commit((x) => {
          const p = x.profiles[x.activeId];
          return setProfile(x, p.id, { ...patch, meta: { ...p.meta, ...(patch.meta || {}) }, updatedAt: Date.now(), dirty: true });
        });
      },
      updateSettings(patch) {
        commit((x) => {
          const p = x.profiles[x.activeId];
          return setProfile(x, p.id, { meta: { ...p.meta, settings: { ...DEFAULT_SETTINGS, ...p.meta.settings, ...patch } }, updatedAt: Date.now(), dirty: true });
        });
      },
      switchProfile: (id) => commit((x) => ({ ...x, activeId: id })),
      signOutProfile: () => commit((x) => ({ ...x, activeId: null })),
      async deleteProfile(id, pin) {
        if (!(await checkLocalPin(pin, ref.current.family?.pinHash))) return false;
        const fam = ref.current.family;
        if (fam?.token) await api.deleteProfile(fam.token, id, pin).catch(() => {});
        commit((x) => {
          const profiles = { ...x.profiles };
          delete profiles[id];
          return { ...x, profiles, activeId: x.activeId === id ? null : x.activeId };
        });
        return true;
      },
      async leaderboard() {
        const fam = ref.current.family;
        const local = () => {
          const rows = Object.values(ref.current.profiles).map((p) => ({ id: p.id, nickname: p.nickname, avatar: p.meta.avatar, summary: summarize(p.state, dayKey(), (day, n) => addDays(day, -n)) }));
          return { top: [...rows].sort((a, b) => b.summary.weekXp - a.summary.weekXp), improved: [...rows].sort((a, b) => b.summary.improvement - a.summary.improvement) };
        };
        if (!fam?.token) return local();
        try {
          await pushDirty();
          return await api.leaderboard(fam.token);
        } catch {
          return local();
        }
      },
      shiftCelebration: () => setQueue((q) => q.slice(1)),
      snoozeBreak,
      syncNow: pull,
    }),
    [commit, pull, pushDirty],
  );

  const value = {
    content,
    family: data.family,
    profiles: data.profiles,
    active,
    state: active?.state,
    settings,
    lang,
    age,
    appearance,
    isDark,
    editionId,
    edition,
    bank,
    school,
    partner,
    city,
    cityId: city.id,
    cityCtx,
    allowedCities,
    editionPicker: EDITION_PICKER,
    themes,
    themeColor,
    currency: !settings.currency || settings.currency === 'auto' ? city.currency : settings.currency,
    currencySetting: settings.currency || 'auto',
    dispatch,
    celebrations: queue,
    syncStatus,
    breakDue,
    ...actions,
  };
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

/** One level-up card (the highest), buildings, then all new badges together, then small toasts. */
function batchCelebrations(list) {
  let level = null;
  const badges = [];
  const big = [];
  const toasts = [];
  for (const e of list) {
    if (e.type === 'levelUp') level = { ...e, from: level?.from ?? e.level - 1, rankChanged: !!(level?.rankChanged || e.rankChanged) };
    else if (e.type === 'badge') badges.push(e.badgeId);
    else if (e.type === 'questDone' || e.type === 'streak' || e.type === 'bankInterest') toasts.push(e);
    else big.push(e);
  }
  return [level, ...big, badges.length ? { type: 'badges', ids: badges } : null, ...toasts].filter(Boolean);
}

function setProfile(d, id, patch) {
  return { ...d, profiles: { ...d.profiles, [id]: { ...d.profiles[id], ...patch } } };
}
function fromServer(sp) {
  return { id: sp.id, nickname: sp.nickname, ageTier: sp.ageTier, meta: sp.meta, state: migrateState(sp.state), updatedAt: sp.updatedAt, dirty: false };
}
