// Catalog of surahs and passages. REFERENCES ONLY — no Quran text lives in this file.
// All Arabic text, translations and audio are loaded at runtime from the Quran.com API
// (see js/core/api.js). Word counts used for levels are generated from that same API by
// scripts/build-meta.mjs into js/data/meta.js, and tests/catalog.test.mjs checks that every
// level below matches the rule in LEVEL_RULES.

export const LEVELS = ['easy', 'medium', 'hard'];

// Rule used to assign levels (documented in docs/PLAN.md).
export const LEVEL_RULES = {
  easy: { maxWords: 26, maxAyahWords: 9 },
  medium: { maxWords: 45, maxAyahWords: 12 },
  hard: { /* anything longer, or any single ayah of >= 18 words */ },
};

export function levelFor({ words, longestAyahWords }) {
  if (longestAyahWords >= 18) return 'hard';
  if (words <= LEVEL_RULES.easy.maxWords && longestAyahWords <= LEVEL_RULES.easy.maxAyahWords) return 'easy';
  if (words <= LEVEL_RULES.medium.maxWords && longestAyahWords <= LEVEL_RULES.medium.maxAyahWords) return 'medium';
  return 'hard';
}

const s = (surah, level) => ({ id: `s${surah}`, type: 'surah', surah, level });
const p = (surah, from, to, level, names) => ({
  id: `p${surah}:${from}-${to}`, type: 'passage', surah, from, to, level, names,
});

// Order inside each level = shortest first (by word count).
export const CATALOG = [
  s(1, 'foundation'),

  // Easy
  s(108, 'easy'), s(103, 'easy'), s(112, 'easy'), s(106, 'easy'), s(110, 'easy'), s(114, 'easy'),
  s(105, 'easy'), s(111, 'easy'), s(113, 'easy'), s(107, 'easy'), s(109, 'easy'),

  // Medium
  s(94, 'medium'), s(102, 'medium'), s(97, 'medium'), s(104, 'medium'), s(95, 'medium'),
  s(99, 'medium'), s(101, 'medium'),
  p(2, 1, 5, 'medium', { en: 'Opening of Al-Baqarah', ar: 'مطلع سورة البقرة', he: 'פתיחת סורת אל-בקרה' }),
  s(93, 'medium'), s(100, 'medium'),

  // Hard
  p(59, 22, 24, 'hard', { en: 'End of Al-Hashr', ar: 'خواتيم سورة الحشر', he: 'סוף סורת אל-חשר' }),
  p(2, 255, 255, 'hard', { en: 'Ayat al-Kursi', ar: 'آية الكرسي', he: 'אית אל-כורסי (פסוק הכיסא)' }),
  s(91, 'hard'),
  p(23, 1, 11, 'hard', { en: "Opening of Al-Mu'minun (khushu')", ar: 'مطلع سورة المؤمنون', he: "פתיחת סורת אל-מואמנון (ח'ושוע)" }),
  p(67, 1, 5, 'hard', { en: 'Opening of Al-Mulk', ar: 'مطلع سورة الملك', he: 'פתיחת סורת אל-מולך' }),
  s(86, 'hard'), s(92, 'hard'), s(87, 'hard'), s(96, 'hard'),
  p(2, 285, 286, 'hard', { en: 'Last two ayahs of Al-Baqarah', ar: 'خواتيم سورة البقرة', he: 'שני הפסוקים האחרונים של אל-בקרה' }),
  p(3, 190, 194, 'hard', { en: "Reflecting on creation (Al 'Imran)", ar: 'آيات التفكر من آل عمران', he: "התבוננות בבריאה (אאל עמראן)" }),
  s(82, 'hard'), s(90, 'hard'), s(88, 'hard'), s(98, 'hard'), s(81, 'hard'), s(84, 'hard'),
  s(85, 'hard'), s(80, 'hard'), s(89, 'hard'), s(83, 'hard'), s(78, 'hard'), s(79, 'hard'),
];

export const CATALOG_BY_ID = Object.fromEntries(CATALOG.map((it) => [it.id, it]));

/** Build a custom passage item (user-added), e.g. from the daily verse or the custom picker. */
export function customItem(surah, from, to) {
  return { id: `p${surah}:${from}-${to}`, type: 'passage', surah, from, to, level: 'custom', custom: true };
}

/** Parse an item id like "s112" or "p2:255-255" into an item (catalog or custom). */
export function itemFromId(id) {
  if (CATALOG_BY_ID[id]) return CATALOG_BY_ID[id];
  const m = /^p(\d{1,3}):(\d{1,3})-(\d{1,3})$/.exec(id);
  if (m) return customItem(+m[1], +m[2], +m[3]);
  const sm = /^s(\d{1,3})$/.exec(id);
  if (sm) return { id, type: 'surah', surah: +sm[1], level: 'custom', custom: true };
  return null;
}

/** Ayah range [from, to] of an item, given the surah's verse count. */
export function ayahRange(item, versesCount) {
  if (item.type === 'surah') return [1, versesCount];
  return [item.from, item.to];
}

/** Position in mushaf order, used to keep rak'ah order. */
export function mushafPos(item) {
  return item.surah * 1000 + (item.type === 'surah' ? 1 : item.from);
}
