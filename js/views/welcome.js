import { html, mount, on } from '../core/dom.js';
import { t, LANGS, getLang, fmtNum } from '../core/i18n.js';
import { update, markKnown, setSetting } from '../core/store.js';
import { CATALOG } from '../data/catalog.js';
import { ic, itemTitle, rangeLabel, levelBadge } from './ui.js';

export async function render(ctx) {
  ctx.setTitle(t('welcomeTitle'));
  const chosen = new Set();
  const list = CATALOG.filter((c) => c.level === 'easy' || c.level === 'medium' || c.level === 'hard');

  const draw = () => mount(ctx.el, html`
    <section class="welcome">
      <div class="ornament" aria-hidden="true">${ic('star')}</div>
      <h2>${t('welcomeHeading')}</h2>
      <p class="lead">${t('welcomeLead')}</p>
      <div class="seg" role="radiogroup" aria-label="${t('language')}">
        ${LANGS.map((l) => html`<button role="radio" aria-checked="${getLang() === l.id}" class="${getLang() === l.id ? 'on' : ''}" data-lang="${l.id}" lang="${l.id}">${l.name}</button>`)}
      </div>
      <ul class="welcome-points">
        <li>${ic('learn')} ${t('welcomePoint1')}</li>
        <li>${ic('pray')} ${t('welcomePoint2')}</li>
        <li>${ic('heart')} ${t('welcomePoint3')}</li>
        <li>${ic('wifiOff')} ${t('welcomePoint4')}</li>
      </ul>
    </section>
    <section class="card">
      <h3>${t('whichDoYouKnow')}</h3>
      <p class="muted small">${t('whichDoYouKnowHint')}</p>
      <div class="check-list">
        ${list.map((it) => html`<label class="check-row">
          <input type="checkbox" data-id="${it.id}" ${chosen.has(it.id) ? 'checked' : ''}>
          <span class="li-main"><span class="li-title">${itemTitle(it)}</span><span class="li-sub" dir="ltr">${rangeLabel(it)}</span></span>
          ${levelBadge(it.level)}
        </label>`)}
      </div>
    </section>
    <div class="sticky-actions">
      <button class="btn primary wide" data-act="start">${chosen.size ? t('startWithN', { n: fmtNum(chosen.size) }) : t('startFresh')}</button>
    </div>
    <p class="small muted center">${t('privacyNote')} <a href="#/sources">${t('sourcesAndCredits')}</a></p>
  `);
  draw();

  const off1 = on(ctx.el, 'click', '[data-lang]', (e, b) => { setSetting('lang', b.dataset.lang); });
  const off2 = on(ctx.el, 'change', 'input[type=checkbox]', (e, inp) => {
    if (inp.checked) chosen.add(inp.dataset.id); else chosen.delete(inp.dataset.id);
    ctx.el.querySelector('[data-act=start]').textContent = chosen.size ? t('startWithN', { n: fmtNum(chosen.size) }) : t('startFresh');
  });
  const off3 = on(ctx.el, 'click', '[data-act=start]', () => {
    [...chosen].forEach((id, i) => markKnown(id, { already: true, index: i }));
    update((s) => { s.onboarded = true; });
    location.hash = '#/';
  });
  return () => { off1(); off2(); off3(); };
}
