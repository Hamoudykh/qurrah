// Quran data client. ALL Quran text, translations, tafsir and audio come from here.
// Primary:  Quran.com API v4  (https://api.quran.com/api/v4) — Uthmani script.
// Fallback: AlQuran.cloud     (https://api.alquran.cloud/v1)  — edition "quran-uthmani" (Tanzil text).
// Responses are cached in the Cache Storage API so opened/saved surahs work offline.

import { plainText } from './dom.js';
import { CHAPTERS } from '../data/meta.js';

const QC = 'https://api.quran.com/api/v4';
const AQC = 'https://api.alquran.cloud/v1';
const VERSES_HOST = 'https://verses.quran.com/';
export const DATA_CACHE = 'qurrah-data-v1';
export const AUDIO_CACHE = 'qurrah-audio-v1';

export const TRANSLATIONS = {
  en: { id: 20, name: 'Saheeh International', fallback: 'en.sahih' },
  he: { id: 233, name: 'Dar Al-Salam Center (Hebrew)', fallback: null },
  translit: { id: 57, name: 'Transliteration (Quran.com)', fallback: 'en.transliteration' },
};
export const TAFSIRS = {
  muyassar: { id: 16, name: 'Tafsir al-Muyassar — King Fahd Glorious Quran Printing Complex', lang: 'ar', fallback: 'ar.muyassar' },
  ibnKathir: { id: 169, name: 'Tafsir Ibn Kathir (Abridged), English', lang: 'en' },
};
export const RECITERS = [
  { id: 7, name: 'Mishary Rashid Alafasy', ar: 'مشاري راشد العفاسي', fb: 'ar.alafasy', br: 128 },
  { id: 6, name: 'Mahmoud Khalil Al-Husary', ar: 'محمود خليل الحصري', fb: 'ar.husary', br: 128 },
  { id: 12, name: 'Al-Husary — Muallim (teaching, with pauses)', ar: 'الحصري — المصحف المعلم', fb: 'ar.husary', br: 128 },
  { id: 2, name: 'Abdul Basit Abdus-Samad (Murattal)', ar: 'عبد الباسط عبد الصمد (مرتل)', fb: 'ar.abdulbasitmurattal', br: 64 },
  { id: 9, name: 'Mohamed Siddiq al-Minshawi (Murattal)', ar: 'محمد صديق المنشاوي (مرتل)', fb: 'ar.minshawi', br: 128 },
];
export const reciterById = (id) => RECITERS.find((r) => r.id === Number(id)) || RECITERS[0];
export const chapter = (n) => CHAPTERS[n - 1];

const memo = new Map();
const hasCaches = () => typeof caches !== 'undefined';

/** Cache-first JSON fetch (Quran text does not change). */
export async function cachedJSON(url, { timeout = 15000 } = {}) {
  if (memo.has(url)) return memo.get(url);
  const p = (async () => {
    if (hasCaches()) {
      try {
        const hit = await (await caches.open(DATA_CACHE)).match(url);
        if (hit) return hit.json();
      } catch { /* cache unavailable */ }
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' }, signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      if (hasCaches()) {
        try { await (await caches.open(DATA_CACHE)).put(url, res.clone()); } catch { /* quota */ }
      }
      return res.json();
    } finally {
      clearTimeout(timer);
    }
  })();
  memo.set(url, p);
  p.catch(() => memo.delete(url));
  return p;
}

export async function isCachedURL(url, cacheName = DATA_CACHE) {
  if (!hasCaches()) return false;
  try { return !!(await (await caches.open(cacheName)).match(url)); } catch { return false; }
}

// ---------------------------------------------------------------- verses

function qcVersesURL(surah, from, to, page) {
  return `${QC}/verses/by_chapter/${surah}?language=en&words=true&translations=${TRANSLATIONS.en.id},${TRANSLATIONS.he.id},${TRANSLATIONS.translit.id}`
    + `&fields=text_uthmani&word_fields=text_uthmani,transliteration&per_page=50&page=${page}&from=${from}&to=${to}`;
}

async function qcVerses(surah, from, to) {
  const out = [];
  for (let page = 1; page < 20; page++) {
    const d = await cachedJSON(qcVersesURL(surah, from, to, page));
    const vs = (d.verses || []).filter((v) => v.verse_number >= from && v.verse_number <= to);
    out.push(...vs);
    if (!d.verses?.length || !d.pagination?.next_page || out.at(-1)?.verse_number >= to) break;
  }
  if (!out.length) throw new Error('no verses');
  return out.map((v) => {
    const tr = Object.fromEntries((v.translations || []).map((t) => [t.resource_id, t.text]));
    return {
      key: v.verse_key,
      n: v.verse_number,
      gid: v.id,
      page: v.page_number,
      juz: v.juz_number,
      sajdah: v.sajdah_number != null,
      arabic: (v.text_uthmani || '').trim(),
      words: (v.words || []).filter((w) => w.char_type_name === 'word').map((w) => ({
        t: w.text_uthmani, tl: w.transliteration?.text || '', m: w.translation?.text || '',
      })),
      tr: {
        en: plainText(tr[TRANSLATIONS.en.id]),
        he: plainText(tr[TRANSLATIONS.he.id]),
        translit: plainText(tr[TRANSLATIONS.translit.id]),
      },
    };
  });
}

let aqcBasmala = null;
async function aqcVerses(surah, from, to) {
  const url = `${AQC}/surah/${surah}/editions/quran-uthmani,${TRANSLATIONS.en.fallback},${TRANSLATIONS.translit.fallback}?offset=${from - 1}&limit=${to - from + 1}`;
  const d = await cachedJSON(url);
  const [ar, en, tl] = d.data;
  if (surah !== 1 && surah !== 9 && from === 1 && aqcBasmala === null) {
    // The Tanzil edition prefixes ayah 1 with the basmala; strip it using the same source's 1:1.
    const b = await cachedJSON(`${AQC}/ayah/1:1/quran-uthmani`);
    aqcBasmala = b.data.text.replace(/^\uFEFF/, '').trim();
  }
  return ar.ayahs.map((a, i) => {
    let text = a.text.replace(/^\uFEFF/, '').trim();
    if (a.numberInSurah === 1 && surah !== 1 && surah !== 9 && aqcBasmala && text.startsWith(aqcBasmala)) {
      text = text.slice(aqcBasmala.length).trim();
    }
    return {
      key: `${surah}:${a.numberInSurah}`,
      n: a.numberInSurah,
      gid: a.number,
      page: a.page,
      juz: a.juz,
      sajdah: !!a.sajda,
      arabic: text,
      words: text.split(/\s+/).filter(Boolean).reduce((acc, tok) => {
        if (/[\u0621-\u064A\u0671]/.test(tok) || !acc.length) acc.push({ t: tok, tl: '', m: '' });
        else acc[acc.length - 1].t += ` ${tok}`; // attach waqf signs to the previous word
        return acc;
      }, []),
      tr: { en: plainText(en.ayahs[i]?.text), he: '', translit: plainText(tl.ayahs[i]?.text) },
    };
  });
}

/** Verses for surah:from-to. Returns { verses, source }. */
export async function getVerses(surah, from, to) {
  try {
    return { verses: await qcVerses(surah, from, to), source: 'quran.com' };
  } catch (e) {
    console.warn('Quran.com unavailable, using Tanzil fallback', e);
    return { verses: await aqcVerses(surah, from, to), source: 'tanzil' };
  }
}

/** The basmala as text, from the source (Al-Fatihah 1:1), for the header above surahs. */
export async function getBasmala() {
  const { verses } = await getVerses(1, 1, 1);
  return verses[0];
}

// ---------------------------------------------------------------- tafsir

/**
 * al-Muyassar groups for an ayah range: [{from, to, text}]. Some groups explain several
 * ayahs together; each group is labelled with exactly the ayahs it covers.
 */
export async function getMuyassar(surah, from, to) {
  const total = chapter(surah).verses;
  try {
    if (from === 1 && to === total) {
      const heads = [];
      for (let page = 1; page <= Math.ceil(total / 50); page++) {
        const d = await cachedJSON(`${QC}/tafsirs/${TAFSIRS.muyassar.id}/by_chapter/${surah}?per_page=50&page=${page}`);
        heads.push(...(d.tafsirs || []));
      }
      const sorted = heads.map((t) => ({ n: +t.verse_key.split(':')[1], text: plainText(t.text) })).sort((a, b) => a.n - b.n);
      return sorted.map((h, i) => ({ from: h.n, to: (sorted[i + 1]?.n ?? total + 1) - 1, text: h.text }));
    }
    const groups = [];
    for (let n = from; n <= to;) {
      const d = await cachedJSON(`${QC}/tafsirs/${TAFSIRS.muyassar.id}/by_ayah/${surah}:${n}`);
      const nums = Object.keys(d.tafsir.verses || {}).map((k) => +k.split(':')[1]).sort((a, b) => a - b);
      const g = { from: nums[0] ?? n, to: nums.at(-1) ?? n, text: plainText(d.tafsir.text) };
      groups.push(g);
      n = Math.max(n, g.to) + 1;
    }
    return groups;
  } catch (e) {
    console.warn('Muyassar via Quran.com failed, trying fallback', e);
    const d = await cachedJSON(`${AQC}/surah/${surah}/${TAFSIRS.muyassar.fallback}?offset=${from - 1}&limit=${to - from + 1}`);
    return d.data.ayahs.map((a) => ({ from: a.numberInSurah, to: a.numberInSurah, text: plainText(a.text) }));
  }
}

/** Ibn Kathir (abridged, English) for one ayah: { verses:[n...], html } — loaded on demand. */
export async function getIbnKathir(surah, n) {
  const d = await cachedJSON(`${QC}/tafsirs/${TAFSIRS.ibnKathir.id}/by_ayah/${surah}:${n}`);
  const nums = Object.keys(d.tafsir.verses || {}).map((k) => +k.split(':')[1]).sort((a, b) => a - b);
  return { verses: nums, html: d.tafsir.text || '' };
}

// ---------------------------------------------------------------- audio

const normAudio = (u) => (u.startsWith('//') ? `https:${u}` : /^https?:/.test(u) ? u : VERSES_HOST + u.replace(/^\//, ''));
export const fallbackAudioURL = (reciter, gid) => `https://cdn.islamic.network/quran/audio/${reciter.br}/${reciter.fb}/${gid}.mp3`;

/** Audio for the given verses: [{n, key, url, fallback}] */
export async function getAudio(reciterId, surah, verses) {
  const reciter = reciterById(reciterId);
  const nums = verses.map((v) => v.n);
  const pages = [...new Set(nums.map((n) => Math.ceil(n / 50)))];
  const byKey = {};
  try {
    for (const p of pages) {
      const d = await cachedJSON(`${QC}/recitations/${reciter.id}/by_chapter/${surah}?per_page=50&page=${p}`);
      for (const a of d.audio_files || []) byKey[a.verse_key] = normAudio(a.url);
    }
  } catch (e) {
    console.warn('Recitation list unavailable, using fallback CDN', e);
  }
  return verses.map((v) => ({
    n: v.n, key: v.key, url: byKey[v.key] || fallbackAudioURL(reciter, v.gid), fallback: fallbackAudioURL(reciter, v.gid),
  }));
}

/** Store audio files in Cache Storage. CORS-enabled hosts only (others stream online). */
export async function cacheAudio(urls, onProgress = () => {}) {
  if (!hasCaches()) return { ok: 0, failed: urls.length };
  const cache = await caches.open(AUDIO_CACHE);
  let ok = 0, failed = 0, i = 0;
  const queue = [...urls];
  const worker = async () => {
    while (queue.length) {
      const url = queue.shift();
      try {
        if (!(await cache.match(url))) {
          const res = await fetch(url, { mode: 'cors' });
          if (!res.ok) throw new Error(res.status);
          await cache.put(url, res);
        }
        ok++;
      } catch { failed++; }
      onProgress(++i, urls.length);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return { ok, failed };
}

export async function cachedAudioBlobURL(url) {
  if (!hasCaches()) return null;
  try {
    const hit = await (await caches.open(AUDIO_CACHE)).match(url);
    if (!hit) return null;
    return URL.createObjectURL(await hit.blob());
  } catch { return null; }
}

// ---------------------------------------------------------------- geocoding (city search)

export async function searchCity(name, lang = 'en') {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=8&language=${lang}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return (j.results || []).map((r) => ({
    label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    lat: r.latitude, lon: r.longitude, tz: r.timezone, country: r.country_code,
  }));
}

/** Sizes of the local caches, for the settings screen. */
export async function cacheStats() {
  if (!hasCaches()) return null;
  const count = async (n) => { try { return (await (await caches.open(n)).keys()).length; } catch { return 0; } };
  const est = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
  return { data: await count(DATA_CACHE), audio: await count(AUDIO_CACHE), usage: est?.usage ?? null };
}

export async function clearCaches() {
  if (!hasCaches()) return;
  await caches.delete(DATA_CACHE);
  await caches.delete(AUDIO_CACHE);
  memo.clear();
}
