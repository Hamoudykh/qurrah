import { html, mount, on, toast } from '../core/dom.js';
import { t, L, getLang, intlLocale, fmtNum } from '../core/i18n.js';
import { getState, settings, startLearning, markKnown, itemState } from '../core/store.js';
import { todayAndNext, formatTime, formatCountdown, hijriDate } from '../logic/prayer.js';
import { dueQueue } from '../logic/srs.js';
import { suggestNext } from '../logic/suggest.js';
import { planDay } from '../logic/planner.js';
import { dayNumber, dayKey } from '../logic/dates.js';
import { dailyVerseFor } from '../data/daily.js';
import { customItem, itemFromId } from '../data/catalog.js';
import { player } from '../core/audio.js';
import { ic, itemTitle, rangeLabel, levelBadge, loading, errorBox, surahName } from './ui.js';
import { loadPassage, wordsHTML, ayahEnd, translationModes, arabicStyle, queueAudio, plannerPool } from './passage.js';

export async function render(ctx) {
  const s = getState();
  const now = new Date();
  const loc = s.settings.prayer.location;
  const tz = loc?.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const greg = new Intl.DateTimeFormat(intlLocale(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }).format(now);
  const hijri = hijriDate(now, getLang() === 'ar' ? 'ar' : getLang(), tz);

  const due = dueQueue(Object.entries(s.items).map(([id, st]) => ({ id, srs: st.srs })).filter((x) => x.srs));
  const sug = suggestNext(s.items);
  const learning = Object.entries(s.items).filter(([, st]) => st.status === 'learning').map(([id]) => itemFromId(id)).filter(Boolean);
  const pool = plannerPool();
  const plan = planDay(pool, { today: dayNumber(), seed: s.planSeed[dayKey()] || 0 });
  const prayedToday = s.prayed[dayKey()] || {};

  mount(ctx.el, html`
    <section class="hero">
      <p class="date">${greg}${hijri ? html` · <span>${hijri}</span>` : ''}</p>
      <h2 class="greet">${t('greeting')}</h2>
    </section>

    <section class="card next-prayer" id="np">
      ${loc ? '' : html`<div class="row between"><div><h3>${t('prayerTimes')}</h3><p class="muted">${t('setLocationPrompt')}</p></div>
        <a class="btn primary" href="#/times">${ic('pin')} ${t('setLocation')}</a></div>`}
    </section>

    <section class="card daily" id="daily" aria-labelledby="daily-h">${loading(t('loadingDaily'))}</section>

    ${due.length ? html`<a class="card link-card" href="#/review">
      <div class="row between"><div><h3>${t('reviewsDue')}</h3><p class="muted">${t('reviewsDueN', { count: due.length, n: fmtNum(due.length) })}</p></div>
      <span class="btn primary">${t('reviewNow')}</span></div></a>` : ''}

    <section class="card">
      <h3>${learning.length ? t('continueLearning') : t('learnNext')}</h3>
      ${learning.slice(0, 2).map((it) => html`<a class="list-item" href="#/item/${encodeURIComponent(it.id)}?tab=memorize">
        <span class="li-main"><span class="li-title">${itemTitle(it)}</span><span class="li-sub" dir="ltr">${rangeLabel(it)}</span></span>
        <span class="li-side">${progressText(it.id)}</span></a>`)}
      ${sug.next && learning.length < 2 ? html`<a class="list-item" href="#/item/${encodeURIComponent(sug.next.id)}">
        <span class="li-main"><span class="li-title">${itemTitle(sug.next)}</span><span class="li-sub">${t('suggestedBecause', { level: t(`level_${sug.next.level}`) })}</span></span>
        <span class="li-side">${levelBadge(sug.next.level)}</span></a>` : ''}
      ${!sug.next && !learning.length ? html`<p class="muted">${t('allDone')}</p>` : ''}
    </section>

    <section class="card">
      <div class="row between"><h3>${t('todaysPlan')}</h3><a class="small" href="#/pray">${t('openPlanner')}</a></div>
      ${pool.length ? html`<ul class="plan-mini">${plan.prayers.map((p) => html`<li class="${prayedToday[p.id] ? 'done' : ''}">
          <span class="pm-name">${t(`prayer_${p.id}`)}${prayedToday[p.id] ? html` ${ic('check')}` : ''}</span>
          <span class="pm-items">${[...new Set(p.rakahs.filter((r) => r.item).map((r) => r.item))].map((id) => itemTitle(itemFromId(id))).join(' · ')}</span></li>`)}</ul>`
        : html`<p class="muted">${t('planNeedsKnown')}</p><a class="btn" href="#/learn?filter=mine">${t('markWhatIKnow')}</a>`}
    </section>
  `);

  // ---- next prayer countdown ----
  let timer = null;
  if (loc) {
    const np = ctx.el.querySelector('#np');
    const draw = () => {
      const r = todayAndNext(loc.lat, loc.lon, loc.tz, settings().prayer, new Date());
      const ms = r.next.time - new Date();
      mount(np, html`<div class="row between wrap">
        <div><p class="eyebrow">${t('nextPrayer')}</p>
          <h3 class="np-name">${t(`prayer_${r.next.key}`)} <span class="np-time">${formatTime(r.next.time, loc.tz, intlLocale())}</span></h3>
          <p class="muted small">${ic('pin')} ${loc.label}</p></div>
        <div class="countdown" aria-live="off"><span class="cd" dir="ltr">${formatCountdown(ms)}</span><span class="small muted">${t('remaining')}</span></div>
      </div><a class="small" href="#/times">${t('allTimes')}</a>`);
    };
    draw();
    timer = setInterval(draw, 1000);
  }

  // ---- daily verse ----
  const dv = dailyVerseFor(now);
  const dItem = itemFromId(`p${dv.surah}:${dv.from}-${dv.to}`) || customItem(dv.surah, dv.from, dv.to);
  const dailyEl = ctx.el.querySelector('#daily');
  let passage = null;
  const drawDaily = async () => {
    try {
      passage = await loadPassage(dItem);
      if (!ctx.isCurrent()) return;
      const modes = translationModes();
      const st = itemState(dItem.id);
      mount(dailyEl, html`
        <div class="row between"><h3 id="daily-h">${ic('star')} ${t('dailyVerse')}</h3><span class="small muted" dir="ltr">${surahName(dv.surah)} ${rangeLabel(dItem)}</span></div>
        <p class="quran daily-ar" lang="ar" dir="rtl" style="${arabicStyle()}">${passage.verses.map((v) => html`${wordsHTML(v)}${ayahEnd(v.n)} `)}</p>
        ${modes.map((m) => html`<p class="translation" lang="${m}" dir="${m === 'he' ? 'rtl' : 'ltr'}">${passage.verses.map((v) => v.tr[m]).filter(Boolean).join(' ') || (m === 'he' ? t('hebrewUnavailable') : '')}</p>`)}
        <div class="reflection"><span class="eyebrow">${t('reflection')}</span><p>${L(dv.reflection)}</p><p class="small muted">${t('reflectionNote')}</p></div>
        ${passage.groups.length ? html`<details class="meaning-details" ${modes.length ? '' : 'open'}><summary>${t('simpleMeaning')} · ${t('muyassarShort')}</summary>
          ${passage.groups.map((g) => html`<p lang="ar" dir="rtl" class="meaning-text">${g.text}</p>`)}</details>` : ''}
        <div class="row wrap gap">
          <button class="btn" data-act="play">${ic('play')} ${t('listen')}</button>
          ${st ? html`<a class="btn" href="#/item/${encodeURIComponent(dItem.id)}">${st.status === 'known' ? t('inMySurahs') : t('inLearning')}</a>`
            : html`<button class="btn" data-act="learn">${ic('plus')} ${t('addToLearning')}</button>
                   <button class="btn ghost" data-act="known">${ic('check')} ${t('iKnowThis')}</button>`}
          <a class="btn ghost" href="#/item/${encodeURIComponent(dItem.id)}">${t('open')}</a>
        </div>`);
    } catch (e) {
      if (ctx.isCurrent()) mount(dailyEl, errorBox(e));
    }
  };
  drawDaily();

  const off = on(ctx.el, 'click', '[data-act]', async (e, b) => {
    const a = b.dataset.act;
    if (a === 'retry') drawDaily();
    if (a === 'play' && passage) { await queueAudio(passage); player.setOptions({ repeat: 1, gap: 'off', autoAdvance: true, rangeRepeat: 1 }); player.playIndex(0); }
    if (a === 'learn') { startLearning(dItem.id); toast(t('addedToLearning')); drawDaily(); }
    if (a === 'known') { markKnown(dItem.id); toast(t('addedToMySurahs')); drawDaily(); }
  });

  return () => { clearInterval(timer); off(); };
}

function progressText(id) {
  const st = getState().items[id];
  const n = Object.values(st?.ayahs || {}).filter((v) => v === 'memorized').length;
  return n ? html`<span class="chip learning">${t('ayahsMemorizedN', { count: n, n: fmtNum(n) })}</span>` : html`<span class="chip learning">${t('statusLearning')}</span>`;
}
