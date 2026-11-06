// Prayer planner: suggests which known surahs/passages to recite after al-Fatihah in each
// fard prayer, rotating so the same few are not repeated every time. Pure + deterministic.
//
// Guidance followed (sources in js/data/fiqh.js):
//  * A surah after al-Fatihah in the first two rak'ahs; al-Fatihah alone in the rest (Bukhari 776).
//  * Rak'ah 1 longer than rak'ah 2 (Bukhari 776) and mushaf order kept inside a prayer
//    (preferred by many scholars; reversing is valid — Muslim 772).
//  * Longer recitation in Fajr, shorter in Maghrib (Muslim 459; Nasa'i 982 — see TO-VERIFY).
//  * Repeating one surah in both rak'ahs is permissible (Abu Dawud 816), used only if needed.

export const PRAYERS = [
  { id: 'fajr', rakahs: 2, lengthTarget: 1.0 },
  { id: 'dhuhr', rakahs: 4, lengthTarget: 0.65 },
  { id: 'asr', rakahs: 4, lengthTarget: 0.4 },
  { id: 'maghrib', rakahs: 3, lengthTarget: 0.0 },
  { id: 'isha', rakahs: 4, lengthTarget: 0.55 },
];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {Array<{id:string, pos:number, words:number, lastRecited:number|null, due:number|null}>} known
 * @param {{today:number, seed?:number}} opts  today = local day number
 * @returns {{prayers: Array<{id:string, rakahs:Array<{n:number, item:string|null, fatihaOnly:boolean}>, repeated:boolean}>}}
 */
export function planDay(known, { today, seed = 0 }) {
  const rnd = mulberry32(today * 7919 + seed * 104729 + 17);
  const byLen = [...known].sort((a, b) => a.words - b.words);
  const rank = new Map(byLen.map((k, i) => [k.id, byLen.length > 1 ? i / (byLen.length - 1) : 0.5]));
  const usedToday = new Map();

  const score = (k, target) => {
    const lengthFit = 1 - Math.abs(rank.get(k.id) - target);
    const since = k.lastRecited == null ? 14 : Math.min(14, Math.max(0, today - k.lastRecited));
    const recency = since / 14;
    const dueBonus = k.due != null && k.due <= today ? 0.5 : 0;
    const used = usedToday.get(k.id) || 0;
    return 1.2 * lengthFit + 1.0 * recency + dueBonus - 1.1 * used + (rnd() - 0.5) * 0.3;
  };

  const prayers = PRAYERS.map((p) => {
    const scored = known.map((k) => ({ k, s: score(k, p.lengthTarget) })).sort((a, b) => b.s - a.s);
    let chosen = scored.slice(0, 2).map((x) => x.k);
    let repeated = false;
    if (chosen.length === 1) { chosen = [chosen[0], chosen[0]]; repeated = true; }
    // Keep mushaf order inside the prayer.
    chosen.sort((a, b) => a.pos - b.pos);
    for (const c of new Set(chosen.map((c) => c.id))) usedToday.set(c, (usedToday.get(c) || 0) + 1);
    const rakahs = Array.from({ length: p.rakahs }, (_, i) => {
      const n = i + 1;
      if (n <= 2 && chosen.length) return { n, item: chosen[i].id, fatihaOnly: false };
      return { n, item: null, fatihaOnly: true };
    });
    return { id: p.id, rakahs, repeated };
  });
  return { prayers };
}

/** Sunnah suggestions that depend on specific surahs being known. */
export function sunnahSuggestions(knownIds) {
  const has = (id) => knownIds.has(id);
  return [
    { id: 'fajrSunnah', items: ['s109', 's112'], ready: has('s109') && has('s112'), ref: 'muslim:726' },
    { id: 'witr', items: ['s87', 's109', 's112'], ready: has('s87') && has('s109') && has('s112'), ref: 'abudawud:1423' },
  ];
}
