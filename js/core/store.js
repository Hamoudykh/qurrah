// Local-only persistence (no accounts, no server). State lives in localStorage and can be
// exported/imported as a JSON file from Settings.

import { dayKey, dayNumber } from '../logic/dates.js';
import { newSchedule, knownSchedule, review as srsReview, isDue } from '../logic/srs.js';

const KEY = 'qurrah:v1';
const listeners = new Set();

export const DEFAULTS = Object.freeze({
  v: 1,
  onboarded: false,
  settings: {
    lang: null, // null = pick from browser on first run
    theme: 'system',
    arabicSize: 34,
    showTranslit: false,
    showTranslation: true,
    translation: 'auto', // 'auto' | 'en' | 'he' | 'both'
    showMeaning: true, // al-Muyassar
    wbw: false,
    reciter: 7,
    cacheAudio: true,
    prayer: {
      method: 'MuslimWorldLeague',
      madhab: 'shafi',
      highLat: 'auto',
      adjust: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
      location: null, // {mode:'gps'|'city'|'manual', lat, lon, tz, label, country}
      notify: { enabled: false, minutesBefore: 10, prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true } },
    },
    daily: { notify: false, time: '08:00' },
    planner: { includeLearning: false },
    memorize: { repeat: 5, gap: 'echo', rate: 1, autoAdvance: true, rangeRepeat: 1 },
  },
  items: {}, // id -> { status:'learning'|'known', ayahs:{n:'learning'|'memorized'}, addedAt, knownAt, srs, recited:{last,count} }
  activity: {}, // dayKey -> { studied, reviewed, prayed }
  planSeed: {}, // dayKey -> shuffle counter
  prayed: {}, // dayKey -> { fajr:true, ... }
  saved: {}, // itemId -> { at, reciter, audio:boolean }
});

function deepMerge(base, extra) {
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return extra === undefined ? base : extra;
  const out = { ...base };
  for (const k of Object.keys(extra || {})) {
    out[k] = k in base && typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k])
      ? deepMerge(base[k], extra[k])
      : extra[k];
  }
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    return deepMerge(structuredClone(DEFAULTS), JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULTS);
  }
}

let state = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save progress', e);
  }
}

export const getState = () => state;
export const settings = () => state.settings;

export function update(mutator, { silent = false } = {}) {
  mutator(state);
  persist();
  if (!silent) for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setSetting(path, value) {
  update((s) => {
    const keys = path.split('.');
    let o = s.settings;
    for (const k of keys.slice(0, -1)) o = o[k];
    o[keys.at(-1)] = value;
  });
}

// ---- activity / streaks ----
export function logActivity(kind, n = 1) {
  update((s) => {
    const k = dayKey();
    const a = (s.activity[k] ||= { studied: 0, reviewed: 0, prayed: 0 });
    a[kind] = (a[kind] || 0) + n;
  }, { silent: true });
}

// ---- items ----
export const itemState = (id) => state.items[id];

export function startLearning(id) {
  update((s) => {
    if (!s.items[id]) s.items[id] = { status: 'learning', ayahs: {}, addedAt: Date.now() };
    else if (s.items[id].status !== 'known') s.items[id].status = 'learning';
  });
  logActivity('studied');
}

export function markKnown(id, { already = false, index = 0 } = {}) {
  update((s) => {
    const it = (s.items[id] ||= { ayahs: {}, addedAt: Date.now() });
    it.status = 'known';
    it.knownAt = Date.now();
    it.srs = already ? knownSchedule(index) : newSchedule();
  });
  if (!already) logActivity('studied');
}

export function removeItem(id) {
  update((s) => { delete s.items[id]; delete s.saved[id]; });
}

export function setAyahStatus(id, n, status) {
  update((s) => {
    const it = (s.items[id] ||= { status: 'learning', ayahs: {}, addedAt: Date.now() });
    if (status) it.ayahs[n] = status; else delete it.ayahs[n];
    if (it.status !== 'known') it.status = 'learning';
  });
  logActivity('studied');
}

export function reviewItem(id, grade) {
  update((s) => {
    const it = s.items[id];
    if (!it) return;
    it.srs = srsReview(it.srs || newSchedule(), grade);
  });
  logActivity('reviewed');
}

/** Called when the user confirms they prayed a planned prayer with these items. */
export function markPrayed(prayerId, itemIds) {
  const t = dayNumber();
  update((s) => {
    const k = dayKey();
    (s.prayed[k] ||= {})[prayerId] = true;
    for (const id of new Set(itemIds)) {
      const it = s.items[id];
      if (!it) continue;
      it.recited = { last: t, count: (it.recited?.count || 0) + 1 };
      // Reciting a due item in salah counts as a successful review.
      if (it.srs && isDue(it.srs)) it.srs = srsReview(it.srs, 'good');
    }
  });
  logActivity('prayed');
}

export function unmarkPrayed(prayerId) {
  update((s) => { const k = dayKey(); if (s.prayed[k]) delete s.prayed[k][prayerId]; });
}

export function bumpPlanSeed() {
  update((s) => { const k = dayKey(); s.planSeed[k] = (s.planSeed[k] || 0) + 1; });
}

// ---- backup ----
export function exportJSON() {
  return JSON.stringify({ app: 'qurrah', exportedAt: new Date().toISOString(), state }, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (data?.app !== 'qurrah' || !data.state) throw new Error('Not a Qurrah backup file');
  state = deepMerge(structuredClone(DEFAULTS), data.state);
  persist();
  for (const fn of listeners) fn(state);
}

export function resetAll() {
  state = structuredClone(DEFAULTS);
  persist();
  for (const fn of listeners) fn(state);
}
