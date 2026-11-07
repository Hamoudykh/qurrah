// First-run access code screen. Shown in front of every route until the code is entered once
// on this device; then the app continues to wherever the link pointed (e.g. a setup link).
import { html, mount, on, buzz, celebrate } from '../core/dom.js';
import { t, LANGS, getLang } from '../core/i18n.js';
import { setSetting } from '../core/store.js';
import { ACCESS, checkCode, normalizeCode, unlock } from '../core/access.js';
import { ic } from './ui.js';

// Wrong tries in this session. After 5, the screen waits a little before the next try.
let fails = 0;
let waitUntil = 0;

export async function render(ctx) {
  ctx.setTitle(t('appName'));
  const n = ACCESS.digits;

  mount(ctx.el, html`<div class="onb gate">
    <section class="onb-hero">
      <div class="onb-logo" aria-hidden="true"></div>
      <h2 class="onb-name">قُرّة</h2>
      <p class="onb-tag">${t('welcomeHeading')}</p>
      <div class="seg" role="radiogroup" aria-label="${t('language')}">
        ${LANGS.map((l) => html`<button type="button" role="radio" aria-checked="${getLang() === l.id}" class="${getLang() === l.id ? 'on' : ''}" data-lang="${l.id}" lang="${l.id}">${l.name}</button>`)}
      </div>
    </section>
    <form class="card gate-card" data-form="code" novalidate>
      <span class="gate-key" aria-hidden="true">${ic('key')}</span>
      <h3>${t('gateTitle')}</h3>
      <p class="muted">${t('gateText')}</p>
      <label class="gate-label" for="gate-code">${t('gateCode')}</label>
      <input id="gate-code" class="code-input" name="code" type="text" inputmode="numeric" autocomplete="one-time-code"
        enterkeyhint="go" dir="ltr" maxlength="${n + 4}" placeholder="${'•'.repeat(n)}" style="--n:${n}" required>
      <p class="gate-msg" id="gate-msg" role="alert" aria-live="assertive"></p>
      <button class="btn primary wide" id="gate-go">${t('gateEnter')}</button>
    </form>
    <p class="small muted center">${ic('heart')} ${t('gateNote')}</p>
  </div>`);

  const form = ctx.el.querySelector('form');
  const input = ctx.el.querySelector('#gate-code');
  const msg = ctx.el.querySelector('#gate-msg');
  const btn = ctx.el.querySelector('#gate-go');
  let busy = false;

  const say = (text, bad = true) => { msg.textContent = text; msg.classList.toggle('bad', bad); };

  async function attempt() {
    if (busy) return;
    const code = normalizeCode(input.value);
    if (Date.now() < waitUntil) { say(t('gateWait')); return; }
    if (code.length !== n) { say(t('gateWrong')); return; }
    busy = true; btn.disabled = true; btn.textContent = t('gateChecking');
    let ok = false;
    try { ok = await checkCode(code); } catch (e) { console.error(e); say(t('errorGeneric')); }
    if (!ctx.isCurrent()) return;
    busy = false; btn.disabled = false; btn.textContent = t('gateEnter');
    if (ok) {
      fails = 0;
      unlock();
      say('', false);
      input.classList.add('ok');
      celebrate(btn);
      buzz(12);
      setTimeout(() => ctx.onUnlock(), 450);
      return;
    }
    if (msg.textContent === t('errorGeneric')) return;
    fails++;
    if (fails >= 5) { waitUntil = Date.now() + 30_000; fails = 0; }
    say(t('gateWrong'));
    buzz(40);
    input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
    input.select();
  }

  const offs = [
    on(ctx.el, 'click', '[data-lang]', (e, b) => setSetting('lang', b.dataset.lang)),
    on(ctx.el, 'input', '#gate-code', () => {
      const v = normalizeCode(input.value).slice(0, n);
      if (input.value !== v) input.value = v;
      if (msg.textContent) say('', false);
      if (v.length === n) attempt();
    }),
    on(ctx.el, 'submit', 'form', (e) => { e.preventDefault(); attempt(); }),
  ];
  // Focus on desktop only; on phones the keyboard would cover the screen before it is read.
  if (matchMedia('(pointer: fine)').matches) setTimeout(() => { if (ctx.isCurrent()) input.focus({ preventScroll: true }); }, 350);
  return () => { offs.forEach((f) => f()); form.reset(); };
}
