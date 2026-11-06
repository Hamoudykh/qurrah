// Reference helpers for hadith and Quran citations.
// Hadith numbers follow sunnah.com numbering, so every reference can be opened and checked.

export const COLLECTIONS = {
  bukhari: { en: 'Sahih al-Bukhari', ar: 'صحيح البخاري', he: 'צחיח אל-בוח׳ארי' },
  muslim: { en: 'Sahih Muslim', ar: 'صحيح مسلم', he: 'צחיח מוסלים' },
  abudawud: { en: 'Sunan Abi Dawud', ar: 'سنن أبي داود', he: 'סונן אבו דאוד' },
  tirmidhi: { en: "Jami' at-Tirmidhi", ar: 'جامع الترمذي', he: 'ג׳אמע א-תירמד׳י' },
  nasai: { en: "Sunan an-Nasa'i", ar: 'سنن النسائي', he: 'סונן א-נסאאי' },
  ibnmajah: { en: 'Sunan Ibn Majah', ar: 'سنن ابن ماجه', he: 'סונן אבן מאג׳ה' },
};

// Grading labels. "sahihayn" = in al-Bukhari and/or Muslim (accepted as authentic).
export const GRADES = {
  sahihayn: { en: 'Authentic (in the Sahihayn)', ar: 'صحيح (في الصحيحين أو أحدهما)', he: 'אמין (באחד הצחיחים)' },
  sahih: { en: 'Graded sahih (al-Albani)', ar: 'صححه الألباني', he: 'דורג צחיח (אל-אלבאני)' },
  hasan: { en: 'Graded hasan (al-Albani)', ar: 'حسنه الألباني', he: 'דורג חסן (אל-אלבאני)' },
  differed: { en: 'Scholars graded it differently', ar: 'اختلف العلماء في تصحيحه', he: 'החכמים חלוקים בדירוגו' },
  daif: { en: "Graded weak (da'if)", ar: 'ضعيف', he: 'דורג חלש (צ׳עיף)' },
  scholar: { en: "A scholar's statement, not a hadith", ar: 'قول عالم، وليس حديثًا', he: 'דברי חכם, לא חדית׳' },
  history: { en: 'Historical report (sirah)', ar: 'رواية تاريخية (السيرة)', he: 'דיווח היסטורי (סירה)' },
};

/** h('bukhari', '5013') → hadith reference; grade defaults to sahihayn for Bukhari/Muslim. */
export const h = (c, n, grade, note) => ({
  kind: 'hadith', c, n, grade: grade || (c === 'bukhari' || c === 'muslim' ? 'sahihayn' : undefined), note,
});
/** q('73:4') → Quran reference */
export const q = (key) => ({ kind: 'quran', key });
/** Book reference with no stable URL (e.g., a tafsir or as-Sunan al-Kubra). */
export const book = (title, grade, note) => ({ kind: 'book', title, grade, note });

export function refURL(r) {
  if (r.kind === 'hadith') return `https://sunnah.com/${r.c}:${r.n}`;
  if (r.kind === 'quran') {
    const [s, a] = r.key.split(':');
    return `https://quran.com/${s}/${a.split('-')[0]}`;
  }
  return null;
}
