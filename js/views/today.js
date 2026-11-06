import { html, mount, on, toast, celebrate } from '../core/dom.js';
import { t, L, getLang, intlLocale, fmtNum } from '../core/i18n.js';
import { getState, settings, startLearning, markKnown, itemState } from '../core/store.js';
import { todayAndNext, formatTime, formatCountdown, hijriDate, FARD } from '../logic/prayer.js';
import { qiblaBearing } from '../logic/qibla.js';
import { dueQueue } from '../logic/srs.js';
import { suggestNext } from '../logic/suggest.js';
import { planDay } from '../logic/planner.js';
import { dayNumber, dayKey } from '../logic/dates.js';
import { dailyVerseFor } from '../data/daily.js';
import { customItem, itemFromId } from '../data/catalog.js';
import { chapter } from '../core/api.js';
import { player } from '../core/audio.js';
import { ic, itemTitle, rangeLabel, errorBox, surahName } from './ui.js';
import { ring, prayerIcon, skyPeriod, skyArc, skyStars } from './viz.js';
import { loadPassage, wordsHTML, ayahEnd, translationModes, queueAudio, plannerPool } from './passage.js';

export async function render(ctx) {
  const s = getState();
  const loc = s.settings.prayer.location;
  const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tz = loc?.tz || deviceTz;

  const due = dueQueue(Object.entries(s.items).map(([id, st]) => ({ id, srs: st.srs })).filter((x) => x.srs));
  const sug = suggestNext(s.items);
  const learning = Object.entries(s.items).filter(([, st]) => st.status === 'learning').map(([id]) => itemFromId(id)).filter(Boolean);
  const pool = plannerPool();
  const plan = planDay(pool, { today: dayNumber(), seed: s.planSeed[dayKey()] || 0 });
  const prayedToday = s.prayed[dayKey()] || {};

  // ---- hero ----
  const heroHTML = () => {
    const now = new Date();
    const r = loc ? todayAndNext(loc.lat, loc.lon, loc.tz, settings().prayer, now) : null;
    const period = skyPeriod(r?.today, now);
    const greg = new Intl.DateTimeFormat(intlLocale(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }).format(now);
    const hijri = hijriDate(now, getLang() === 'ar' ? 'ar' : getLang(), tz);
    const tf = (d) => formatTime(d, tz, intlLocale());
    return { period, r, inner: html`
      ${skyStars()}
      ${skyArc(r?.today, now)}
      <div class="hero-top">
        <div><p class="greg">${t('greeting')}</p><p class="hijri">${hijri || greg}</p>${hijri ? html`<p class="greg">${greg}</p>` : ''}</div>
        ${loc ? html`<a class="loc-chip" href="#/times">${ic('pin')} ${loc.label}</a>` : ''}
      </div>
      <div class="hero-main">
        ${r ? html`<p class="hero-label">${r.next.tomorrow ? t('nextPrayerTomorrow') : t('nextPrayer')}</p>
            <h2 class="np-name">${t(`prayer_${r.next.key}`)}</h2>
            <p class="np-meta"><span dir="ltr">${tf(r.next.time)}</span><span class="np-cd" id="cd" dir="auto">${t('inTime', { time: formatCountdown(r.next.time - now) })}</span></p>`
          : html`<p class="hero-label">${t('prayerTimes')}</p><h2 class="np-name">${t('setYourPlace')}</h2>
            <div class="hero-cta"><a class="btn light" href="#/times">${ic('pin')} ${t('setLocation')}</a></div>`}
      </div>
      ${r ? html`<nav class="prayer-strip" aria-label="${t('prayerTimes')}">${FARD.map((k) => {
        const cls = [r.next.key === k && !r.next.tomorrow ? 'next' : '', r.today[k] < now && !(r.next.key === k) ? 'past' : '', prayedToday[k] ? 'prayed' : ''].join(' ');
        return html`<a class="p-chip ${cls}" href="#/pray">${prayerIcon(k)}<b>${t(`prayer_${k}`)}</b><small dir="ltr">${tf(r.today[k])}</small></a>`;
      })}</nav>` : ''}` };
  };

  // ---- quick tiles ----
  const cont = learning[0];
  const contFrac = cont ? Object.values(getState().items[cont.id]?.ayahs || {}).filter((v) => v === 'memorized').length / Math.max(1, cont.type === 'surah' ? chapter(cont.surah).verses : cont.to - cont.from + 1) : 0;
  const qibla = loc ? Math.round(qiblaBearing(loc.lat, loc.lon)) : null;

  const h = heroHTML();
  mount(ctx.el, html`
    <section class="sky sky-${h.period}" id="hero">${h.inner}</section>

    <div class="quick">
      ${cont ? html`<a class="q-tile" href="#/item/${encodeURIComponent(cont.id)}?tab=memorize">
          <span class="q-text"><b>${t('continueLearning')}</b><small>${itemTitle(cont)}</small></span>${ring(contFrac, { size: 44, stroke: 4 })}</a>`
        : sug.next ? html`<a class="q-tile" href="#/item/${encodeURIComponent(sug.next.id)}">
          <span class="q-ic emerald">${ic('plus')}</span><span class="q-text"><b>${t('learnNext')}</b><small>${itemTitle(sug.next)}</small></span></a>`
        : html`<a class="q-tile" href="#/learn"><span class="q-ic emerald">${ic('learn')}</span><span class="q-text"><b>${t('tabLearn')}</b><small>${t('mySurahs')}</small></span></a>`}
      <a class="q-tile" href="#/review">
        <span class="q-ic gold">${ic('repeat')}</span><span class="q-text"><b>${t('review')}</b><small>${due.length ? t('reviewsDueShort', { count: due.length, n: fmtNum(due.length) }) : t('nothingDue')}</small></span>
        ${due.length ? html`<span class="q-count">${fmtNum(due.length)}</span>` : ''}</a>
      <a class="q-tile" href="#/qibla"><span class="q-ic sky">${ic('compass')}</span><span class="q-text"><b>${t('qibla')}</b><small>${qibla != null ? html`<span dir="ltr">${fmtNum(qibla)}°</span>` : t('qiblaTeaserShort')}</small></span></a>
      <a class="q-tile" href="#/pray?tab=khushu"><span class="q-ic dusk">${ic('heart')}</span><span class="q-text"><b>${t('tab_khushu')}</b><small>${t('beforeYouPrayHint')}</small></span></a>
    </div>

    <section class="card verse-card" id="daily" aria-labelledby="daily-h"><div class="skeleton" aria-label="${t('loadingDaily')}"><i></i><i></i><i></i></div></section>

    <div class="section-title"><h3>${t('todaysPlan')}</h3><a class="small" href="#/pray">${t('openPlanner')}</a></div>
    <section class="card">
      ${pool.length ? html`<ul class="plan-list">${plan.prayers.map((p) => {
          const names = [...new Set(p.rakahs.filter((r) => r.item).map((r) => r.item))].map((id) => itemTitle(itemFromId(id))).join(' · ');
          return html`<li class="${prayedToday[p.id] ? 'done' : ''}"><span class="p-ic c-${p.id}">${prayerIcon(p.id)}</span>
            <span class="pl-main"><b>${t(`prayer_${p.id}`)}</b><small>${names}</small></span>
            ${prayedToday[p.id] ? html`<span class="done-check">${ic('check')}</span>` : ''}</li>`;
        })}</ul>`
        : html`<p class="muted">${t('planNeedsKnown')}</p><a class="btn" href="#/learn?filter=mine">${t('markWhatIKnow')}</a>`}
    </section>
  `);

  // Live countdown; full hero refresh each minute (sky colour and sun position move).
  let lastNext = h.r?.next.key;
  let tick = 0;
  const timer = setInterval(() => {
    const hero = ctx.el.querySelector('#hero');
    if (!hero) return;
    tick++;
    if (loc) {
      const r = todayAndNext(loc.lat, loc.lon, loc.tz, settings().prayer, new Date());
      if (r.next.key !== lastNext || tick % 60 === 0) {
        const nh = heroHTML();
        hero.className = `sky sky-${nh.period}`;
        mount(hero, nh.inner);
        lastNext = r.next.key;
        return;
      }
      const cd = hero.querySelector('#cd');
      if (cd) cd.textContent = t('inTime', { time: formatCountdown(r.next.time - new Date()) });
    } else if (tick % 60 === 0) {
      const nh = heroHTML();
      hero.className = `sky sky-${nh.period}`;
      mount(hero, nh.inner);
    }
  }, 1000);

  // ---- daily verse ----
  const dv = dailyVerseFor(new Date());
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
        <div class="verse-head"><span class="pill" id="daily-h">${ic('star')} ${t('dailyVerse')}</span>
          <span class="verse-ref">${surahName(dv.surah)} · <span dir="ltr">${rangeLabel(dItem)}</span></span></div>
        <p class="quran" lang="ar" dir="rtl">${passage.verses.map((v) => html`${wordsHTML(v)}${ayahEnd(v.n)} `)}</p>
        ${modes.map((m) => html`<p class="translation" lang="${m}" dir="${m === 'he' ? 'rtl' : 'ltr'}">${passage.verses.map((v) => v.tr[m]).filter(Boolean).join(' ') || (m === 'he' ? t('hebrewUnavailable') : '')}</p>`)}
        <div class="reflection"><span class="eyebrow">${ic('leaf')} ${t('reflection')}</span><p>${L(dv.reflection)}</p><p class="small muted">${t('reflectionNote')}</p></div>
        ${passage.groups.length ? html`<details class="meaning-details" ${modes.length ? '' : 'open'}><summary>${t('simpleMeaning')} · ${t('muyassarShort')}</summary>
          ${passage.groups.map((g) => html`<p lang="ar" dir="rtl" class="meaning-text">${g.text}</p>`)}</details>` : ''}
        <div class="verse-actions">
          <div class="act-label"><button class="round-btn main" data-act="play" aria-label="${t('listen')}">${ic('play')}</button>${t('listen')}</div>
          <div class="act-label"><button class="round-btn" data-act="share" aria-label="${t('share')}">${ic('share')}</button>${t('share')}</div>
          ${st ? html`<div class="act-label"><a class="round-btn" href="#/item/${encodeURIComponent(dItem.id)}" aria-label="${t('open')}">${ic('check')}</a>${st.status === 'known' ? t('inMySurahs') : t('inLearning')}</div>`
            : html`<div class="act-label"><button class="round-btn" data-act="learn" aria-label="${t('addToLearning')}">${ic('plus')}</button>${t('addToLearningShort')}</div>
                   <div class="act-label"><button class="round-btn" data-act="known" aria-label="${t('iKnowThis')}">${ic('check')}</button>${t('knownShort')}</div>`}
        </div>`);
    } catch (e) {
      if (ctx.isCurrent()) mount(dailyEl, errorBox(e));
    }
  };
  drawDaily();

  async function share() {
    if (!passage) return;
    const ref = `${surahName(dv.surah)} ${rangeLabel(dItem)}`;
    const ar = passage.verses.map((v) => v.arabic).join(' ');
    const tr = translationModes().map((m) => passage.verses.map((v) => v.tr[m]).join(' ')).filter(Boolean).join('\n');
    const url = location.href.split('#')[0];
    const text = `${ar}\n﴿${ref}﴾${tr ? `\n\n${tr}` : ''}\n\n${t('appName')} — ${url}`;
    try {
      if (navigator.share) await navigator.share({ title: t('dailyVerse'), text });
      else { await navigator.clipboard.writeText(text); toast(t('copied')); }
    } catch (e) {
      if (e?.name !== 'AbortError') { try { await navigator.clipboard.writeText(text); toast(t('copied')); } catch { /* ignore */ } }
    }
  }

  const off = on(ctx.el, 'click', '[data-act]', async (e, b) => {
    const a = b.dataset.act;
    if (a === 'retry') drawDaily();
    if (a === 'play' && passage) { await queueAudio(passage); player.setOptions({ repeat: 1, gap: 'off', autoAdvance: true, rangeRepeat: 1 }); player.playIndex(0); }
    if (a === 'share') share();
    if (a === 'learn') { startLearning(dItem.id); celebrate(b); toast(t('addedToLearning')); drawDaily(); }
    if (a === 'known') { markKnown(dItem.id); celebrate(b); toast(t('addedToMySurahs')); drawDaily(); }
  });

  return () => { clearInterval(timer); off(); };
}
