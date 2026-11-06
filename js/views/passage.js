// Loading and rendering of Quran passages (shared by item page, daily verse, review).
import { html, raw } from '../core/dom.js';
import { t, getLang, fmtNum } from '../core/i18n.js';
import { getVerses, getMuyassar, getAudio, getBasmala, chapter, reciterById, TRANSLATIONS, TAFSIRS } from '../core/api.js';
import { settings, getState } from '../core/store.js';
import { player } from '../core/audio.js';
import { ayahRange, itemFromId, mushafPos } from '../data/catalog.js';
import { COUNTS } from '../data/meta.js';
import { itemTitle, ic } from './ui.js';

export async function loadPassage(item, { tafsir = true } = {}) {
  const ch = chapter(item.surah);
  const [from, to] = ayahRange(item, ch.verses);
  const [{ verses, source }, groups, basmala] = await Promise.all([
    getVerses(item.surah, from, to),
    tafsir ? getMuyassar(item.surah, from, to).catch(() => []) : Promise.resolve([]),
    from === 1 && ch.bismillahPre ? getBasmala().catch(() => null) : Promise.resolve(null),
  ]);
  return { item, chapter: ch, from, to, verses, source, groups, basmala };
}

/** Which translations to show, from settings + interface language. */
export function translationModes() {
  const tr = settings().translation;
  if (tr === 'off') return [];
  if (tr === 'both') return ['en', 'he'];
  if (tr === 'en' || tr === 'he') return [tr];
  if (getLang() === 'ar') return []; // auto in Arabic UI: the Arabic text + al-Muyassar meaning
  return getLang() === 'he' ? ['he'] : ['en'];
}

export function arabicStyle() {
  return `--qsize:${settings().arabicSize}px`;
}

/** Arabic words as tappable spans (for word-by-word meaning and the hide-words test). */
export function wordsHTML(v, { hide = null, revealed = new Set() } = {}) {
  return v.words.map((w, i) => {
    const hidden = hide ? hide(i, v.words.length) && !revealed.has(`${v.n}:${i}`) : false;
    return html`<span class="w${hidden ? ' hid' : ''}" data-w="${i}" data-n="${v.n}" ${raw(hidden ? `aria-label="${t('hiddenWord')}" role="button" tabindex="0"` : '')}>${w.t}</span> `;
  });
}

export function ayahEnd(n) {
  return html`<span class="ayah-end" aria-label="${t('ayahN', { n })}">${fmtNum(n)}</span>`;
}

/**
 * Read-mode ayah cards. Muyassar meaning is placed after the last ayah of each group and
 * labelled with exactly the ayahs it covers.
 */
export function ayahCards(p, { showTranslit, showMeaning, modes, playingN = null } = {}) {
  const groupEnd = new Map(p.groups.map((g) => [Math.min(g.to, p.to), g]));
  return p.verses.map((v) => {
    const g = groupEnd.get(v.n);
    const showG = g && showMeaning;
    return html`<article class="ayah${playingN === v.n ? ' playing' : ''}" id="a${v.n}" data-n="${v.n}">
      <div class="ayah-tools">
        <span class="ayah-key" dir="ltr">${v.key}</span>
        ${v.sajdah ? html`<span class="chip">${t('sajdahAyah')}</span>` : ''}
        <span class="grow"></span>
        <button class="icon-btn" data-act="play-ayah" data-n="${v.n}" aria-label="${t('playAyah', { n: v.n })}">${ic('play')}</button>
        <button class="icon-btn" data-act="ibn-kathir" data-n="${v.n}" aria-label="${t('ibnKathir')}" title="${t('ibnKathir')}">${ic('info')}</button>
      </div>
      <p class="quran" lang="ar" dir="rtl">${wordsHTML(v)}${ayahEnd(v.n)}</p>
      ${showTranslit && v.tr.translit ? html`<p class="translit" dir="ltr" lang="en">${v.tr.translit}</p>` : ''}
      ${modes.map((m) => (v.tr[m] ? html`<p class="translation" lang="${m}" dir="${m === 'he' ? 'rtl' : 'ltr'}">${v.tr[m]}</p>` : m === 'he' ? html`<p class="translation muted small">${t('hebrewUnavailable')}</p>` : ''))}
      <div class="tafsir-slot" data-n="${v.n}"></div>
      ${showG ? html`<div class="meaning" lang="ar" dir="rtl">
        <div class="meaning-label" dir="auto">${g.from === g.to ? t('meaningOfAyah', { n: g.from }) : t('meaningOfAyahs', { from: g.from, to: g.to })} · ${t('muyassarShort')}</div>
        <p>${g.text}</p></div>` : ''}
    </article>`;
  });
}

export function sourceLine(p) {
  const modes = translationModes();
  const rec = reciterById(settings().reciter);
  const parts = [
    p.source === 'tanzil' ? t('srcArabicTanzil') : t('srcArabicQC'),
    ...modes.map((m) => (m === 'en' ? TRANSLATIONS.en.name : TRANSLATIONS.he.name)),
    t('srcMeaning', { name: TAFSIRS.muyassar.name }),
    t('srcAudio', { name: getLang() === 'ar' ? rec.ar : rec.name }),
  ];
  return html`<p class="source-line small muted">${ic('info')} ${parts.join(' · ')}</p>`;
}

/** Load audio for a passage into the shared player. Returns the queue. */
export async function queueAudio(p) {
  const s = settings();
  const q = await getAudio(s.reciter, p.item.surah, p.verses);
  const rec = reciterById(s.reciter);
  player.setQueue(q, {
    title: itemTitle(p.item),
    artist: getLang() === 'ar' ? rec.ar : rec.name,
    href: `#/item/${encodeURIComponent(p.item.id)}`,
    itemId: p.item.id,
    reciter: s.reciter,
  });
  return q;
}

export function playerIsFor(itemId) {
  return player.meta?.itemId === itemId && player.meta?.reciter === settings().reciter && player.queue.length > 0;
}

// ---- planner pool ----
export function plannerPool() {
  const s = getState();
  return Object.entries(s.items)
    .filter(([id, st]) => id !== 's1' && (st.status === 'known' || (s.settings.planner.includeLearning && st.status === 'learning')))
    .map(([id, st]) => {
      const item = itemFromId(id);
      if (!item) return null;
      const ayahs = item.type === 'surah' ? chapter(item.surah).verses : item.to - item.from + 1;
      return { id, pos: mushafPos(item), words: COUNTS[id]?.words ?? ayahs * 6, lastRecited: st.recited?.last ?? null, due: st.srs?.due ?? null };
    })
    .filter(Boolean);
}
