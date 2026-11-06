import { html, mount } from '../core/dom.js';
import { t, fmtNum, intlLocale } from '../core/i18n.js';
import { getState } from '../core/store.js';
import { LEVELS, itemFromId } from '../data/catalog.js';
import { COUNTS } from '../data/meta.js';
import { chapter } from '../core/api.js';
import { suggestNext } from '../logic/suggest.js';
import { dueQueue } from '../logic/srs.js';
import { streak, longestStreak, dayNumber, keyFromDayNumber } from '../logic/dates.js';
import { ic, itemTitle, refsList } from './ui.js';
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

  const goals = [];
  if (due.length) goals.push(html`<li><a href="#/review">${t('goalReview', { count: due.length, n: fmtNum(due.length) })}</a></li>`);
  for (const it of learning.slice(0, 2)) goals.push(html`<li><a href="#/item/${encodeURIComponent(it.id)}?tab=memorize">${t('goalFinish', { name: itemTitle(it) })}</a></li>`);
  if (sug.next && learning.length < 2) goals.push(html`<li><a href="#/item/${encodeURIComponent(sug.next.id)}">${t('goalStart', { name: itemTitle(sug.next) })}</a></li>`);
  const lv = sug.progress[sug.level];
  if (lv && lv.known < lv.total) goals.push(html`<li>${t('goalLevel', { level: t(`level_${sug.level}`), n: fmtNum(lv.total - lv.known) })}</li>`);

  mount(ctx.el, html`
    <section class="card stats">
      <div class="stat-main"><span class="stat-num">${fmtNum(known.length)}</span><span class="stat-label">${t('surahsYouKnow')}</span></div>
      <div class="stat-row">
        <div><span class="stat-num sm">${fmtNum(ayahs)}</span><span class="stat-label">${t('ayahs')}</span></div>
        <div><span class="stat-num sm">${fmtNum(words)}</span><span class="stat-label">${t('wordsCounted')}</span></div>
        <div><span class="stat-num sm">${fmtNum(learning.length)}</span><span class="stat-label">${t('statusLearning')}</span></div>
      </div>
    </section>

    <section class="card">
      <h3>${t('byLevel')}</h3>
      ${LEVELS.map((l) => { const p = sug.progress[l]; return html`<div class="level-bar">
        <div class="row between"><span>${t(`level_${l}`)}</span><span class="small muted">${fmtNum(p.known)} / ${fmtNum(p.total)}</span></div>
        <div class="bar lv-${l}"><span style="width:${Math.round((p.known / p.total) * 100)}%"></span></div></div>`; })}
    </section>

    <section class="card">
      <div class="row between"><h3>${ic('leaf')} ${t('consistency')}</h3><span class="small muted">${t('bestStreak', { count: best, n: fmtNum(best) })}</span></div>
      <p>${cur ? t('streakN', { count: cur, n: fmtNum(cur) }) : t('streakZero')}</p>
      <div class="days" role="img" aria-label="${t('last14Days')}">${days.map((k) => html`<span class="day ${active.has(k) ? 'on' : ''}" title="${k}"><i></i><small>${dayFmt.format(new Date(k + 'T12:00:00'))}</small></span>`)}</div>
      <p class="small muted">${t('streakGentle')}</p>
    </section>

    <section class="card">
      <h3>${t('nextGoals')}</h3>
      ${goals.length ? html`<ol class="goals">${goals}</ol>` : html`<p class="muted">${t('allDone')}</p>`}
    </section>

    <section class="card encourage">
      <p>${t('encourageLine')}</p>
      ${refsList([h('muslim', '798'), h('bukhari', '4937')])}
    </section>

    <nav class="card list">
      <a class="list-item" href="#/review"><span class="li-main"><span class="li-title">${ic('repeat')} ${t('review')}</span></span><span class="li-side">${due.length ? html`<span class="chip warn">${fmtNum(due.length)}</span>` : ''}</span></a>
      <a class="list-item" href="#/learn?filter=mine"><span class="li-main"><span class="li-title">${ic('learn')} ${t('mySurahs')}</span></span></a>
      <a class="list-item" href="#/settings"><span class="li-main"><span class="li-title">${ic('settings')} ${t('settings')}</span></span></a>
      <a class="list-item" href="#/sources"><span class="li-main"><span class="li-title">${ic('info')} ${t('sourcesAndCredits')}</span></span></a>
    </nav>`);
}
