import { html, mount, on, toast, celebrate } from '../core/dom.js';
import { t, fmtNum, intlLocale } from '../core/i18n.js';
import { getState, settings, markPrayed, unmarkPrayed, bumpPlanSeed, setSetting } from '../core/store.js';
import { planDay, sunnahSuggestions } from '../logic/planner.js';
import { todayAndNext, formatTime } from '../logic/prayer.js';
import { dayNumber, dayKey } from '../logic/dates.js';
import { itemFromId, CATALOG_BY_ID } from '../data/catalog.js';
import { KHUSHU_TIPS, CHECKLIST } from '../data/khushu.js';
import { FIQH_NOTES, FIQH_DISCLAIMER } from '../data/fiqh.js';
import { ic, itemTitle, rangeLabel, refsList, ctext } from './ui.js';
import { plannerPool } from './passage.js';
import { prayerIcon, medallion } from './viz.js';

const TABS = ['plan', 'recite', 'khushu'];

export async function render(ctx) {
  ctx.setTitle(t('tabPray'));
  let tab = TABS.includes(ctx.query.tab) ? ctx.query.tab : 'plan';
  const checked = new Set();

  const drawPlan = () => {
    const s = getState();
    const pool = plannerPool();
    const plan = planDay(pool, { today: dayNumber(), seed: s.planSeed[dayKey()] || 0 });
    const prayed = s.prayed[dayKey()] || {};
    const loc = s.settings.prayer.location;
    const times = loc ? todayAndNext(loc.lat, loc.lon, loc.tz, s.settings.prayer).today : null;
    const knownIds = new Set(Object.entries(s.items).filter(([, x]) => x.status === 'known').map(([id]) => id));
    const sunnah = sunnahSuggestions(knownIds);
    const itemLink = (id) => {
      const it = itemFromId(id);
      return html`<a href="#/item/${encodeURIComponent(id)}">${itemTitle(it)}</a> <span class="small muted" dir="ltr">${rangeLabel(it)}</span>`;
    };
    return html`
      <div class="row between wrap gap">
        <p class="muted small grow">${pool.length ? t('planIntro', { n: fmtNum(pool.length) }) : t('planNeedsKnown')}</p>
        <button class="btn" data-act="shuffle" ${pool.length < 2 ? 'disabled' : ''}>${ic('shuffle')} ${t('shuffle')}</button>
      </div>
      <label class="switch-row"><input type="checkbox" data-act="include-learning" ${s.settings.planner.includeLearning ? 'checked' : ''}><span>${t('includeLearning')}</span></label>

      <details class="card checklist" ${checked.size ? 'open' : ''}>
        <summary><strong>${ic('heart')} ${t('beforeYouPray')}</strong> <span class="small muted">${t('beforeYouPrayHint')}</span></summary>
        <ul>${CHECKLIST.map((c) => html`<li><label><input type="checkbox" data-check="${c.id}" ${checked.has(c.id) ? 'checked' : ''}> ${ctext(c.text)}</label></li>`)}</ul>
      </details>

      ${plan.prayers.map((p) => html`<section class="card prayer-card ${prayed[p.id] ? 'done' : ''}" id="pc-${p.id}">
        <div class="pc-head c-${p.id}">${prayerIcon(p.id)}
          <div><h3>${t(`prayer_${p.id}`)}</h3>${times ? html`<span class="pc-time" dir="ltr">${formatTime(times[p.id], loc.tz, intlLocale())}</span>` : ''}</div>
          <span class="pc-rk">${t('rakahsN', { count: p.rakahs.length, n: fmtNum(p.rakahs.length) })}</span>
        </div>
        <div class="pc-body">
          <ol class="rakahs">
            ${p.rakahs.map((r) => html`<li class="${r.item ? 'has-surah' : ''}"><span class="rk-n" aria-label="${t('rakahN', { n: fmtNum(r.n) })}">${fmtNum(r.n)}</span>
              <span class="rk-body">${t('alFatihah')}${r.item ? html` + ${itemLink(r.item)}` : html` <span class="small muted">${t('fatihaOnly')}</span>`}</span></li>`)}
          </ol>
          ${p.repeated ? html`<p class="small muted">${t('repeatedNote')}</p>` : ''}
          ${prayed[p.id] ? html`<button class="btn ok" data-unpray="${p.id}">${ic('check')} ${t('prayed')}</button>`
            : html`<button class="btn primary" data-pray="${p.id}" ${pool.length ? '' : 'disabled'}>${ic('check')} ${t('iPrayedThis')}</button>`}
        </div>
      </section>`)}

      <section class="card">
        <h3>${t('sunnahPrayers')}</h3>
        ${sunnah.map((x) => html`<div class="sunnah-row">
          <p><strong>${t(`sunnah_${x.id}`)}</strong>: ${x.items.map((id) => itemTitle(CATALOG_BY_ID[id])).join(' · ')}</p>
          <p class="small ${x.ready ? 'ok-text' : 'muted'}">${x.ready ? t('youKnowThese') : t('learnTheseToo')}</p>
        </div>`)}
        ${refsList([{ kind: 'hadith', c: 'muslim', n: '726', grade: 'sahihayn' }, { kind: 'hadith', c: 'abudawud', n: '1423', grade: 'sahih' }])}
      </section>
      <p class="small muted center">${t('planBasis')} <button class="link" data-goto="recite">${t('tab_recite')}</button></p>`;
  };

  const drawRecite = () => html`
    <p class="note">${ctext(FIQH_DISCLAIMER)}</p>
    ${FIQH_NOTES.map((n) => html`<section class="card fiqh">
      <h3>${ctext(n.title)}</h3>
      <p>${ctext(n.body)}</p>
      ${n.differ ? html`<p class="differ"><span class="eyebrow">${t('scholarsDiffer')}</span> ${ctext(n.differ)}</p>` : ''}
      ${refsList(n.refs)}
    </section>`)}`;

  const drawKhushu = () => html`
    <p class="lead">${t('khushuIntro')}</p>
    ${KHUSHU_TIPS.map((k, i) => html`<details class="card tip" ${i === 0 ? 'open' : ''} id="tip-${k.id}">
      <summary>${medallion(i + 1)}<h3>${ctext(k.title)}</h3></summary>
      <p>${ctext(k.body)}</p>
      ${k.note ? html`<p class="differ small">${ctext(k.note)}</p>` : ''}
      <p class="practice"><span class="eyebrow">${t('tryThis')}</span> ${ctext(k.practice)}</p>
      ${refsList(k.refs)}
      ${k.link ? html`<a class="small" href="${k.link}">${t('openPlanner')}</a>` : ''}
    </details>`)}
    <p class="small muted center">${t('summaryNote')}</p>`;

  const draw = () => mount(ctx.el, html`
    <div class="seg tabs3" role="tablist">
      ${TABS.map((k) => html`<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-tab="${k}">${t(`tab_${k}`)}</button>`)}
    </div>
    <div class="stack">${tab === 'plan' ? drawPlan() : tab === 'recite' ? drawRecite() : drawKhushu()}</div>`);
  draw();

  const offs = [
    on(ctx.el, 'click', '[data-tab], [data-goto]', (e, b) => { tab = b.dataset.tab || b.dataset.goto; history.replaceState(null, '', `#/pray?tab=${tab}`); draw(); window.scrollTo(0, 0); }),
    on(ctx.el, 'click', '[data-act=shuffle]', () => { bumpPlanSeed(); draw(); }),
    on(ctx.el, 'change', '[data-act=include-learning]', (e, inp) => { setSetting('planner.includeLearning', inp.checked); draw(); }),
    on(ctx.el, 'click', '[data-pray]', (e, b) => {
      const s = getState();
      const plan = planDay(plannerPool(), { today: dayNumber(), seed: s.planSeed[dayKey()] || 0 });
      const p = plan.prayers.find((x) => x.id === b.dataset.pray);
      markPrayed(p.id, p.rakahs.map((r) => r.item).filter(Boolean));
      celebrate(b);
      toast(t('prayedToast'));
      draw();
    }),
    on(ctx.el, 'click', '[data-unpray]', (e, b) => { unmarkPrayed(b.dataset.unpray); draw(); }),
    on(ctx.el, 'change', '[data-check]', (e, inp) => { if (inp.checked) checked.add(inp.dataset.check); else checked.delete(inp.dataset.check); }),
  ];
  return () => offs.forEach((f) => f());
}
