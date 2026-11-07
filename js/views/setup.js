// #/setup/<code> — adds people and their places from a private link (stored only on this phone).
import { html, mount, on, toast, celebrate } from '../core/dom.js';
import { t, L } from '../core/i18n.js';
import { getState, addPeople } from '../core/store.js';
import { decodeSetup } from '../logic/people.js';
import { CITIES } from '../data/cities.js';
import { ic } from './ui.js';
import { personAvatar } from './people-ui.js';

export async function render(ctx) {
  ctx.setTitle(t('setupTitle'));
  let people;
  try {
    people = decodeSetup(ctx.params[0] || '', CITIES);
  } catch {
    mount(ctx.el, html`<section class="card error center"><p>${t('setupInvalid')}</p><a class="btn" href="#/">${t('backToToday')}</a></section>`);
    return;
  }
  let meIndex = 0;

  const draw = () => mount(ctx.el, html`
    <section class="card setup">
      <div class="ornament" aria-hidden="true">${ic('heart')}</div>
      <h2 class="display center">${t('setupTitle')}</h2>
      <p class="muted center">${t('setupIntro')}</p>
      <div class="setup-people">
        ${people.map((p, i) => html`<div class="setup-person">${personAvatar(p, i)}
          <div><b>${p.name}</b><small>${p.places.map((pl) => `${L(pl.label)} (${t(`role_${pl.role}`)})`).join(' · ')}</small></div></div>`)}
      </div>
      <h3>${t('whoUsesPhone')}</h3>
      <div class="seg small" role="radiogroup" aria-label="${t('whoUsesPhone')}">
        ${people.map((p, i) => html`<button role="radio" aria-checked="${meIndex === i}" class="${meIndex === i ? 'on' : ''}" data-mi="${i}">${p.name}</button>`)}
        <button role="radio" aria-checked="${meIndex === -1}" class="${meIndex === -1 ? 'on' : ''}" data-mi="-1">${t('nobodyHere')}</button>
      </div>
      <button class="btn primary wide" style="margin-top:16px" data-act="import">${ic('plus')} ${t('addToApp')}</button>
    </section>
    <p class="small muted center">${t('setupPrivacy')}</p>`);
  draw();

  const offs = [
    on(ctx.el, 'click', '[data-mi]', (e, b) => { meIndex = +b.dataset.mi; draw(); }),
    on(ctx.el, 'click', '[data-act=import]', (e, b) => {
      addPeople(people, { meIndex: meIndex >= 0 ? meIndex : null, labelOf: (pl) => L(pl.label) });
      celebrate(b);
      toast(t('setupDone'));
      setTimeout(() => { location.hash = getState().onboarded ? '#/times' : '#/welcome'; }, 500);
    }),
  ];
  return () => offs.forEach((f) => f());
}
