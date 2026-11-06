// Shared view helpers: icons, item naming, references, badges.
import { html, raw, esc } from '../core/dom.js';
import { t, L, isFallback, getLang, fmtNum } from '../core/i18n.js';
import { chapter } from '../core/api.js';
import { COUNTS } from '../data/meta.js';
import { COLLECTIONS, GRADES, refURL } from '../data/refs.js';
import { getState } from '../core/store.js';
import { daysUntilDue } from '../logic/srs.js';

// ---- icons (simple 24×24 stroke icons drawn for this app) ----
const P = {
  today: '<path d="M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0M12 5v3M5.2 9.8l1.6 1.6M18.8 9.8l-1.6 1.6M2.5 14h2M19.5 14h2"/>',
  learn: '<path d="M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5V20"/>',
  pray: '<path d="M5 21V11a7 7 0 0 1 14 0v10M3 21h18M9.5 21v-5a2.5 2.5 0 0 1 5 0v5"/>',
  times: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  me: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  pause: '<path d="M7.5 5h3v14h-3zM13.5 5h3v14h-3z" fill="currentColor" stroke="none"/>',
  next: '<path d="M6 5.5v13l9-6.5z" fill="currentColor"/><path d="M17.5 5v14"/>',
  prev: '<path d="M18 5.5v13l-9-6.5z" fill="currentColor"/><path d="M6.5 5v14"/>',
  repeat: '<path d="M17 3l3 3-3 3M4 11V9.5A3.5 3.5 0 0 1 7.5 6H20M7 21l-3-3 3-3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H4"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  forward: '<path d="M9 18l6-6-6-6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.4"/>',
  eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeOff: '<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM4 4l16 16"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  shuffle: '<path d="M16 4h4v4M4 19L20 4M20 16v4h-4M15 15l5 5M4 5l5 5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11.5a6.5 6.5 0 0 1 13 0C18.5 15 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.3"/>',
  star: '<path d="M12 2.8l2.7 2.7h3.8v3.8l2.7 2.7-2.7 2.7v3.8h-3.8L12 21.2l-2.7-2.7H5.5v-3.8L2.8 12l2.7-2.7V5.5h3.8z"/>',
  leaf: '<path d="M5 19.5C5 11 11 5 20 4.5c-.5 9-6.5 15-15 15zM5 19.5l7.5-7.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.3 3.5 5.3 3.5 8.5s-1 6.2-3.5 8.5c-2.5-2.3-3.5-5.3-3.5-8.5s1-6.2 3.5-8.5z"/>',
  text: '<path d="M5 6.5V5h14v1.5M12 5v14M9 19h6"/>',
  wifiOff: '<path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4-2.3M12 9.5c2.7 0 5.2 1 7 2.8M2 9.5A15 15 0 0 1 7 6.6M12 5c3.9 0 7.4 1.5 10 4"/><circle cx="12" cy="19.5" r=".8" fill="currentColor"/>',
};

export const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;
export const ic = (name, cls) => raw(icon(name, cls));

// ---- naming ----
export function surahName(n) {
  const c = chapter(n);
  if (!c) return `Surah ${n}`;
  return getLang() === 'ar' ? `سورة ${c.nameArabic}` : c.nameSimple;
}

export function itemTitle(item) {
  if (item.names) return L(item.names);
  if (item.type === 'passage') return `${surahName(item.surah)} ${rangeLabel(item)}`;
  return surahName(item.surah);
}

/** e.g. "112:1–4" — always LTR digits so references can be checked. */
export function rangeLabel(item) {
  const c = chapter(item.surah);
  const from = item.type === 'surah' ? 1 : item.from;
  const to = item.type === 'surah' ? c.verses : item.to;
  return from === to ? `${item.surah}:${from}` : `${item.surah}:${from}–${to}`;
}

export function itemSubtitle(item) {
  const c = chapter(item.surah);
  const parts = [];
  if (item.type === 'passage' && item.names) parts.push(surahName(item.surah));
  else if (getLang() !== 'ar') parts.push(c.nameArabic);
  if (getLang() === 'en' && item.type === 'surah') parts.push(c.meaningEn);
  return parts.filter(Boolean).join(' · ');
}

export function ayahCount(item) {
  if (item.type === 'surah') return chapter(item.surah).verses;
  return item.to - item.from + 1;
}

export const wordCount = (item) => COUNTS[item.id]?.words ?? null;

// ---- badges & status ----
export function levelBadge(level) {
  if (!level || level === 'custom') return html`<span class="badge lv-custom">${t('levelCustom')}</span>`;
  return html`<span class="badge lv-${level}">${t(`level_${level}`)}</span>`;
}

export function statusChip(id) {
  const st = getState().items[id];
  if (!st) return '';
  if (st.status === 'known') {
    const d = daysUntilDue(st.srs);
    const due = d <= 0 ? html`<span class="chip warn">${t('reviewDue')}</span>` : '';
    return html`<span class="chip ok">${ic('check')} ${t('statusKnown')}</span>${due}`;
  }
  const n = Object.values(st.ayahs || {}).filter((v) => v === 'memorized').length;
  return html`<span class="chip learning">${t('statusLearning')}${n ? ` · ${fmtNum(n)}` : ''}</span>`;
}

// ---- references ----
export function refItem(r) {
  const url = refURL(r);
  let label;
  if (r.kind === 'hadith') label = `${L(COLLECTIONS[r.c])} ${r.n}`;
  else if (r.kind === 'quran') label = `${t('quran')} ${r.key.replace('-', '–')}`;
  else label = L(r.title);
  const grade = r.grade ? html`<span class="grade g-${r.grade}">${L(GRADES[r.grade])}</span>` : '';
  const note = r.note ? html`<span class="ref-note">${L(r.note)}</span>` : '';
  const link = url ? html`<a href="${url}" target="_blank" rel="noopener noreferrer" dir="ltr">${label}</a>` : html`<span>${label}</span>`;
  return html`<li>${link} ${grade} ${note}</li>`;
}

export const refsList = (refs) => (refs?.length ? html`<ul class="refs">${refs.map(refItem)}</ul>` : '');

/** Content text in the current language, with a small marker when shown in English. */
export function ctext(obj) {
  if (!obj) return '';
  const fb = isFallback(obj);
  return html`<span ${fb ? raw('lang="en" dir="ltr"') : ''}>${L(obj)}</span>${fb ? html` <span class="fallback-tag">${t('shownInEnglish')}</span>` : ''}`;
}

export function loading(msg) {
  return html`<div class="loading" role="status"><span class="spinner" aria-hidden="true"></span>${msg || t('loading')}</div>`;
}

export function errorBox(e, retry = true) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return html`<div class="card error">
    <p>${offline ? t('offlineNotSaved') : t('loadFailed')}</p>
    ${retry ? html`<button class="btn" data-act="retry">${t('tryAgain')}</button>` : ''}
    <details><summary class="small">${t('details')}</summary><pre class="small">${esc(e?.message || e)}</pre></details>
  </div>`;
}

/** An item's display row (used in lists). */
export function itemRow(item, { href = `#/item/${encodeURIComponent(item.id)}`, extra = '' } = {}) {
  const w = wordCount(item);
  return html`<a class="list-item" href="${href}">
    <span class="li-main">
      <span class="li-title">${itemTitle(item)}</span>
      <span class="li-sub"><span class="ltr-num" dir="ltr">${rangeLabel(item)}</span> · ${t('ayahsN', { count: ayahCount(item), n: fmtNum(ayahCount(item)) })}${w ? ` · ${t('wordsN', { count: w, n: fmtNum(w) })}` : ''}</span>
    </span>
    <span class="li-side">${levelBadge(item.level)}${statusChip(item.id)}${extra}</span>
  </a>`;
}
