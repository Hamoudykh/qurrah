import { html, raw, mount, esc } from '../core/dom.js';
import { t, fmtNum, intlLocale } from '../core/i18n.js';
import { getState } from '../core/store.js';
import { LEVELS, CATALOG, itemFromId } from '../data/catalog.js';
import { COUNTS } from '../data/meta.js';
import { chapter } from '../core/api.js';
import { suggestNext } from '../logic/suggest.js';
import { dueQueue } from '../logic/srs.js';
import { streak, longestStreak, dayNumber, keyFromDayNumber } from '../logic/dates.js';
import { ic, itemTitle, refsList, arabicName } from './ui.js';
import { ring, starPath, skyStars, constellationLayout } from './viz.js';
import { h } from '../data/refs.js';

export async function render(ctx) {
  ctx.setTitle(t('tabMe'));
  const s = getState();
  const known = Object.entries(s.items).filter(([, x]) => x.status === 'known').map(([id]) => itemFromId(id)).filter(Boolean);
  const learning = Object.entries(s.items).filter(([, x]) => x.status === 'learning').map(([id]) => itemFromId(id)).filter(Boolean);
  const ayahs = known.reduce((n, it) => n + (it.type === 'surah' ? chapter(it.surah).verses : it.to - it.from + 1), 0);
  const words = known.reduce((n, it) => n + (COUNTS[it.id]?.words || 0), 0);
  const active = new Set(Object.entries(s.activity).filter(([, a]) => (a.studied || 0) + (a.reviewed || 0) + (a.prayed || 0) > 0).map(([k]) => k));
  const cur = streak(active);
  const best = longestStreak(active);
  const sug = suggestNext(s.items);
  const due = dueQueue(Object.entries(s.items).map(([id, st]) => ({ id, srs: st.srs })).filter((x) => x.srs));
  const today = dayNumber();
  const days = Array.from({ length: 14 }, (_, i) => keyFromDayNumber(today - 13 + i));
  const dayFmt = new Intl.DateTimeFormat(intlLocale(), { weekday: 'narrow' });

  const catalog = CATALOG.filter((c) => c.level !== 'foundation');
  const knownInCatalog = catalog.filter((c) => s.items[c.id]?.status === 'known').length;

  // Constellation: one star per catalog item; size by level; known ones joined by faint lines.
  const pts = constellationLayout(catalog.length);
  const size = { easy: 9, medium: 11, hard: 13 };
  const stars = catalog.map((c, i) => ({ c, ...pts[i], st: s.items[c.id]?.status || 'new' }));
  const knownPts = stars.filter((x) => x.st === 'known');
  const lines = knownPts.length > 1 ? `<polyline class="link-line" points="${knownPts.map((x) => `${x.x.toFixed(1)},${x.y.toFixed(1)}`).join(' ')}"/>` : '';
  const svgStars = stars.map((x, i) => {
    const r = size[x.c.level];
    const k = (r * 2) / 100;
    return `<a href="#/item/${encodeURIComponent(x.c.id)}" class="st ${x.st}" style="--d:${(i % 7) * 0.45}s"><title>${esc(arabicName(x.c))}</title>
      <path d="${starPath}" transform="translate(${(x.x - r).toFixed(1)} ${(x.y - r).toFixed(1)}) scale(${k.toFixed(3)})"/></a>`;
  }).join('');

  const goals = [];
  if (due.length) goals.push(html`<li><a href="#/review"><span class="g-ic">${ic('repeat')}</span>${t('goalReview', { count: due.length, n: fmtNum(due.length) })}</a></li>`);
  for (const it of learning.slice(0, 2)) goals.push(html`<li><a href="#/item/${encodeURIComponent(it.id)}?tab=memorize"><span class="g-ic">${ic('learn')}</span>${t('goalFinish', { name: itemTitle(it) })}</a></li>`);
  if (sug.next && learning.length < 2) goals.push(html`<li><a href="#/item/${encodeURIComponent(sug.next.id)}"><span class="g-ic">${ic('plus')}</span>${t('goalStart', { name: itemTitle(sug.next) })}</a></li>`);
  const lv = sug.progress[sug.level];
  if (lv && lv.known < lv.total) goals.push(html`<li><span class="goal"><span class="g-ic">${ic('star')}</span>${t('goalLevel', { level: t(`level_${sug.level}`), n: fmtNum(lv.total - lv.known) })}</span></li>`);

  mount(ctx.el, html`
    <section class="card">
      <div class="me-head">
        ${ring(knownInCatalog / catalog.length, { size: 112, stroke: 8, cls: 'gold', inner: html`<b>${fmtNum(known.length)}</b><small>${t('surahsYouKnowShort')}</small>` })}
        <div class="stat-row">
          <div class="stat"><b>${fmtNum(ayahs)}</b><small>${t('ayahs')}</small></div>
          <div class="stat"><b>${fmtNum(words)}</b><small>${t('wordsCounted')}</small></div>
          <div class="stat"><b>${fmtNum(learning.length)}</b><small>${t('statusLearning')}</small></div>
        </div>
      </div>
    </section>

    <section class="card sky-card">
      ${skyStars(34, 3)}
      <div class="row between"><h3>${ic('sparkle')} ${t('yourSky')}</h3><span class="small muted">${t('knownOfTotal', { known: fmtNum(knownInCatalog), total: fmtNum(catalog.length) })}</span></div>
      <svg class="constellation" viewBox="0 0 320 230" role="img" aria-label="${t('yourSky')}">${raw(lines + svgStars)}</svg>
      <p class="small muted" style="margin:0 0 6px">${t('skyHint')}</p>
      <div class="legend"><span><i class="k"></i>${t('statusKnown')}</span><span><i class="l"></i>${t('statusLearning')}</span><span><i class="n"></i>${t('legendNew')}</span></div>
    </section>

    <section class="card">
      <h3>${t('byLevel')}</h3>
      ${LEVELS.map((l) => { const p = sug.progress[l]; return html`<div class="level-bar">
        <div class="row between"><span>${t(`level_${l}`)}</span><span class="small muted">${t('xOfY', { a: fmtNum(p.known), b: fmtNum(p.total) })}</span></div>
        <div class="bar"><span style="width:${Math.round((p.known / p.total) * 100)}%"></span></div></div>`; })}
    </section>

    <section class="card">
      <div class="row between"><h3>${ic('leaf')} ${t('consistency')}</h3><span class="small muted">${t('bestStreak', { count: best, n: fmtNum(best) })}</span></div>
      <div class="streak-big"><b>${fmtNum(cur)}</b><span>${cur ? t('streakDays', { count: cur }) : t('streakZero')}</span></div>
      <div class="days" role="img" aria-label="${t('last14Days')}">${days.map((k, i) => html`<span class="day ${active.has(k) ? 'on' : ''} ${i === 13 ? 'today' : ''}" title="${k}"><i></i><small>${dayFmt.format(new Date(k + 'T12:00:00'))}</small></span>`)}</div>
      <p class="small muted">${t('streakGentle')}</p>
    </section>

    <section class="card">
      <h3>${t('nextGoals')}</h3>
      ${goals.length ? html`<ol class="goals">${goals}</ol>` : html`<p class="muted">${t('allDone')}</p>`}
    </section>

    <section class="card encourage">
      <p style="margin-top:0">${t('encourageLine')}</p>
      ${refsList([h('muslim', '798'), h('bukhari', '4937')])}
    </section>

    <nav class="card list">
      <a class="list-item" href="#/review"><span class="li-main"><span class="li-title">${ic('repeat')} ${t('review')}</span></span><span class="li-side">${due.length ? html`<span class="chip warn">${fmtNum(due.length)}</span>` : ''}</span></a>
      <a class="list-item" href="#/learn?filter=mine"><span class="li-main"><span class="li-title">${ic('learn')} ${t('mySurahs')}</span></span></a>
      <a class="list-item" href="#/settings"><span class="li-main"><span class="li-title">${ic('settings')} ${t('settings')}</span></span></a>
      <a class="list-item" href="#/sources"><span class="li-main"><span class="li-title">${ic('info')} ${t('sourcesAndCredits')}</span></span></a>
    </nav>`);
}
