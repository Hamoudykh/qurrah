import { html, mount, on, buzz, toast } from '../core/dom.js';
import { t, LANGS, getLang, fmtNum } from '../core/i18n.js';
import { update, markKnown, setSetting, settings } from '../core/store.js';
import { CATALOG } from '../data/catalog.js';
import { chapter } from '../core/api.js';
import { suggestMethod } from '../logic/prayer.js';
import { ic, arabicName } from './ui.js';
import { pasteSetupForm, bindPasteSetup } from './people-ui.js';

export async function render(ctx) {
  ctx.setTitle(t('welcomeTitle'));
  const chosen = new Set();
  let step = Number(ctx.query.step) || 0;
  const list = CATALOG.filter((c) => c.level === 'easy' || c.level === 'medium' || c.level === 'hard');

  const dots = () => html`<div class="onb-steps" aria-hidden="true">${[0, 1, 2].map((i) => html`<i class="${i === step ? 'on' : ''}"></i>`)}</div>`;

  const step0 = () => html`<div class="onb">
    <section class="onb-hero">
      <div class="onb-logo" aria-hidden="true"></div>
      <h2 class="onb-name">قُرّة</h2>
      <p class="onb-tag">${t('welcomeHeading')}</p>
      <div class="seg" role="radiogroup" aria-label="${t('language')}">
        ${LANGS.map((l) => html`<button role="radio" aria-checked="${getLang() === l.id}" class="${getLang() === l.id ? 'on' : ''}" data-lang="${l.id}" lang="${l.id}">${l.name}</button>`)}
      </div>
    </section>
    <ul class="onb-points">
      <li><span class="q-ic emerald">${ic('learn')}</span><span>${t('welcomePoint1')}</span></li>
      <li><span class="q-ic gold">${ic('pray')}</span><span>${t('welcomePoint2')}</span></li>
      <li><span class="q-ic dusk">${ic('heart')}</span><span>${t('welcomePoint3')}</span></li>
      <li><span class="q-ic sky">${ic('wifiOff')}</span><span>${t('welcomePoint4')}</span></li>
    </ul>
    <details class="card manage paste-card">
      <summary>${ic('heart')} ${t('haveSetupLink')}</summary>
      <p class="small muted">${t('pasteSetupHint')}</p>
      ${pasteSetupForm()}
    </details>
    <div class="onb-actions"><button class="btn primary" data-go="1">${t('letsBegin')}</button></div>
    <p class="small muted center">${t('privacyNote')} <a href="#/sources">${t('sourcesAndCredits')}</a></p>
  </div>`;

  const step1 = () => html`<div class="onb">
    ${dots()}
    <h2 class="display">${t('whichDoYouKnow')}</h2>
    <p class="muted center">${t('whichDoYouKnowHint')}</p>
    <div class="pick-grid">
      ${list.map((it) => html`<button class="pick ${chosen.has(it.id) ? 'on' : ''}" data-pick="${it.id}" aria-pressed="${chosen.has(it.id)}">
        <span class="pk-name" lang="ar">${arabicName(it)}</span><small>${getLang() === 'ar' ? t(`level_${it.level}`) : (it.names?.en || chapter(it.surah).nameSimple)}</small></button>`)}
    </div>
    <div class="onb-actions">
      <button class="btn ghost" data-go="0">${t('back')}</button>
      <button class="btn primary" data-go="2" id="next1">${chosen.size ? t('nextWithN', { n: fmtNum(chosen.size) }) : t('skipForNow')}</button>
    </div>
  </div>`;

  const step2 = () => html`<div class="onb">
    ${dots()}
    <div class="ornament" aria-hidden="true">${ic('times')}</div>
    <h2 class="display">${t('stepTimesTitle')}</h2>
    <p class="muted center">${t('stepTimesHint')}</p>
    <button class="btn primary wide" data-act="gps">${ic('pin')} ${t('useMyLocation')}</button>
    <p class="small muted center">${t('gpsPrivacy')}</p>
    ${settings().prayer.location ? html`<p class="center chip ok" style="margin:8px auto;display:flex;width:max-content">${ic('check')} ${settings().prayer.location.label}</p>` : ''}
    <div class="onb-actions">
      <button class="btn ghost" data-go="1">${t('back')}</button>
      <button class="btn gold" data-act="start">${ic('sparkle')} ${t('startApp')}</button>
    </div>
  </div>`;

  const draw = () => mount(ctx.el, step === 0 ? step0() : step === 1 ? step1() : step2());
  draw();

  const finish = () => {
    [...chosen].forEach((id, i) => markKnown(id, { already: true, index: i }));
    update((s) => { s.onboarded = true; });
    location.hash = '#/';
  };

  const offs = [
    bindPasteSetup(ctx.el),
    on(ctx.el, 'click', '[data-lang]', (e, b) => { setSetting('lang', b.dataset.lang); }),
    on(ctx.el, 'click', '[data-go]', (e, b) => { step = +b.dataset.go; draw(); window.scrollTo(0, 0); }),
    on(ctx.el, 'click', '[data-pick]', (e, b) => {
      const id = b.dataset.pick;
      if (chosen.has(id)) chosen.delete(id); else chosen.add(id);
      b.classList.toggle('on', chosen.has(id));
      b.setAttribute('aria-pressed', chosen.has(id));
      buzz(6);
      ctx.el.querySelector('#next1').textContent = chosen.size ? t('nextWithN', { n: fmtNum(chosen.size) }) : t('skipForNow');
    }),
    on(ctx.el, 'click', '[data-act=gps]', (e, b) => {
      if (!navigator.geolocation) { toast(t('gpsUnavailable')); return; }
      b.disabled = true;
      navigator.geolocation.getCurrentPosition((pos) => {
        update((s) => {
          s.settings.prayer.location = { mode: 'gps', lat: +pos.coords.latitude.toFixed(4), lon: +pos.coords.longitude.toFixed(4), tz: Intl.DateTimeFormat().resolvedOptions().timeZone, label: t('myLocation') };
          s.settings.prayer.method = suggestMethod('');
        });
        if (ctx.isCurrent()) draw();
      }, () => { b.disabled = false; toast(t('gpsDenied')); }, { timeout: 15000, maximumAge: 600000 });
    }),
    on(ctx.el, 'click', '[data-act=start]', finish),
  ];
  return () => offs.forEach((f) => f());
}
