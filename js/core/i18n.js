// Interface languages: English, Arabic (RTL), Hebrew (RTL).
import en from '../i18n/en.js';
import ar from '../i18n/ar.js';
import he from '../i18n/he.js';

const DICTS = { en, ar, he };
export const LANGS = [
  { id: 'en', name: 'English', dir: 'ltr' },
  { id: 'ar', name: 'العربية', dir: 'rtl' },
  { id: 'he', name: 'עברית', dir: 'rtl' },
];

let lang = 'en';
export const getLang = () => lang;
export const isRTL = () => LANGS.find((l) => l.id === lang)?.dir === 'rtl';

export function detectLang() {
  for (const l of navigator.languages || [navigator.language || 'en']) {
    const base = String(l).slice(0, 2).toLowerCase();
    if (base === 'iw') return 'he';
    if (DICTS[base]) return base;
  }
  return 'en';
}

export function setLang(l) {
  lang = DICTS[l] ? l : 'en';
  const root = document.documentElement;
  root.lang = lang;
  root.dir = isRTL() ? 'rtl' : 'ltr';
}

const pluralRules = {};
/** Plural form: with a numeric `n`, looks for key_one / key_two / key_few … before key. */
function pick(key, vars) {
  const n = vars && typeof vars.count === 'number' ? vars.count : null;
  if (n != null) {
    const cat = (pluralRules[lang] ||= new Intl.PluralRules(lang)).select(n);
    const d = DICTS[lang];
    if (d?.[`${key}_${cat}`] != null) return d[`${key}_${cat}`];
    if (lang === 'en' || d?.[key] == null) {
      const ec = (pluralRules.en ||= new Intl.PluralRules('en')).select(n);
      if (DICTS.en[`${key}_${ec}`] != null && d?.[key] == null) return DICTS.en[`${key}_${ec}`];
    }
  }
  return DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
}

/** Translate a UI key with {placeholders}. Pass {count: number} for plural forms. Falls back to English, then the key. */
export function t(key, vars) {
  let s = pick(key, vars);
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  return s;
}

/** Pick the current language from a content object {en, ar, he}. */
export const L = (obj) => (obj == null ? '' : typeof obj === 'string' ? obj : obj[lang] ?? obj.en ?? '');
/** True when content isn't available in the current language (shown in English instead). */
export const isFallback = (obj) => obj && typeof obj === 'object' && obj[lang] == null && lang !== 'en';

/** Locale for Intl formatting (Western digits for clarity in all languages). */
export const intlLocale = () => (lang === 'ar' ? 'ar-u-nu-latn' : lang === 'he' ? 'he-IL' : 'en');

export const fmtNum = (n) => new Intl.NumberFormat(intlLocale()).format(n);
