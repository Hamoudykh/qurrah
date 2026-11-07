// "My people" — each person, their places, and the prayer times at each place.
import { html, on, toast, celebrate } from '../core/dom.js';
import { t, L, intlLocale } from '../core/i18n.js';
import { getState, settings, setCurrentPlace, setMe, addPerson, renamePerson, removePerson, addPlace, removePlace } from '../core/store.js';
import { todayAndNext, formatTimeBare, FARD } from '../logic/prayer.js';
import { ROLES, encodeSetup } from '../logic/people.js';
import { CITIES } from '../data/cities.js';
import { ic } from './ui.js';

const labelOf = (pl) => L(pl.label);
export const initial = (name) => (String(name).trim()[0] || '؟').toUpperCase();

export function personAvatar(p, i) {
  return html`<span class="avatar av-${i % 4}" aria-hidden="true">${initial(p.name)}</span>`;
}

/** Next prayer at a person's current place: { pl, r } or null. */
export function personNext(p, now = new Date()) {
  const pl = p.places.find((x) => x.id === p.current) || p.places[0];
  if (!pl) return null;
  return { pl, r: todayAndNext(pl.lat, pl.lon, pl.tz, settings().prayer, now) };
}

export function peopleSection(now = new Date()) {
  const s = getState();
  const people = s.people;
  const sortedCities = [...CITIES].sort((a, b) => L(a.name).localeCompare(L(b.name), intlLocale()));
  const cityOptions = sortedCities.map((c) => html`<option value="${c.id}">${L(c.name)}</option>`);
  const roleOptions = ROLES.map((r) => html`<option value="${r}">${t(`role_${r}`)}</option>`);

  return html`
    <div class="section-title"><h3>${ic('heart')} ${t('family')}</h3></div>
    ${people.length ? html`<p class="small muted" style="margin:0 4px">${t('familyHint')}</p>` : html`<section class="card center"><p class="muted" style="margin:0">${t('familyEmpty')}</p></section>`}
    ${people.map((p, i) => {
      const cur = p.places.find((x) => x.id === p.current);
      return html`<section class="card person" id="person-${p.id}">
        <div class="person-head">${personAvatar(p, i)}
          <div class="grow"><span class="row"><b class="person-name">${p.name}</b>${s.me === p.id ? html`<span class="chip gold">${t('thisIsMe')}</span>` : ''}</span>
            <small class="muted">${cur ? html`${ic('pin')} ${labelOf(cur)} · ${t(`role_${cur.role}`)}` : t('noPlacesYet')}</small></div>
        </div>
        ${p.places.map((pl) => {
          const r = todayAndNext(pl.lat, pl.lon, pl.tz, settings().prayer, now);
          const isCur = pl.id === p.current;
          return html`<div class="place ${isCur ? 'current' : ''}">
            <div class="place-head">
              <span class="place-name">${labelOf(pl)}</span><span class="chip">${t(`role_${pl.role}`)}</span>
              <span class="grow"></span>
              ${isCur ? html`<span class="chip ok">${ic('check')} ${t('currentPlace')}</span>`
                : html`<button class="btn small ghost" data-cur="${p.id}|${pl.id}">${t('setCurrent')}</button>`}
            </div>
            <div class="mini-times">${FARD.map((k) => html`<span class="mt ${r.next.key === k && !r.next.tomorrow ? 'next' : ''}"><small>${t(`prayer_${k}`)}</small><b dir="ltr">${formatTimeBare(r.today[k], pl.tz, intlLocale())}</b></span>`)}</div>
          </div>`;
        })}
      </section>`;
    })}

    <details class="card manage" ${people.length ? '' : 'open'}>
      <summary>${ic('settings')} ${t('managePeople')}</summary>
      ${people.map((p) => html`<div class="manage-person">
        <form class="row gap" data-form="rename" data-id="${p.id}">
          <input name="name" type="text" value="${p.name}" maxlength="40" aria-label="${t('personName')}" required>
          <button class="btn small">${t('save')}</button>
        </form>
        <div class="row wrap gap" style="margin:6px 0">
          ${s.me === p.id ? html`<span class="chip gold">${t('thisIsMe')}</span>` : html`<button class="btn small ghost" data-me="${p.id}">${t('setAsMe')}</button>`}
          <button class="btn small danger" data-del-person="${p.id}">${ic('trash')} ${t('removePerson')}</button>
        </div>
        <ul class="manage-places">${p.places.map((pl) => html`<li>${labelOf(pl)} <span class="chip">${t(`role_${pl.role}`)}</span>
          <button class="icon-btn" data-del-place="${p.id}|${pl.id}" aria-label="${t('removePlace')}">${ic('close')}</button></li>`)}</ul>
        <form class="row gap wrap" data-form="add-place" data-id="${p.id}">
          <select name="city" aria-label="${t('city')}" required><option value="">${t('city')}…</option>${cityOptions}</select>
          <select name="role" aria-label="${t('placeType')}">${roleOptions}</select>
          <button class="btn small primary">${ic('plus')} ${t('addPlace')}</button>
        </form>
      </div>`)}
      <form class="row gap" data-form="add-person" style="margin-top:12px">
        <input name="name" type="text" maxlength="40" placeholder="${t('personName')}" aria-label="${t('personName')}" required>
        <button class="btn small primary">${ic('plus')} ${t('addPerson')}</button>
      </form>
      ${people.some((p) => p.places.length) ? html`<button class="btn wide" style="margin-top:12px" data-act="share-setup">${ic('share')} ${t('copySetupLink')}</button>
        <p class="small muted" style="margin-bottom:0">${t('setupPrivacy')}</p>` : ''}
    </details>`;
}

/** Wire up the people section inside `root`. `redraw` re-renders the host view. */
export function bindPeople(root, redraw) {
  const offs = [
    on(root, 'click', '[data-cur]', (e, b) => {
      const [pid, plid] = b.dataset.cur.split('|');
      setCurrentPlace(pid, plid, labelOf);
      celebrate(b);
      redraw();
    }),
    on(root, 'click', '[data-me]', (e, b) => { setMe(b.dataset.me, labelOf); redraw(); }),
    on(root, 'click', '[data-del-person]', (e, b) => { if (confirm(t('confirmRemovePerson'))) { removePerson(b.dataset.delPerson); redraw(); } }),
    on(root, 'click', '[data-del-place]', (e, b) => { const [pid, plid] = b.dataset.delPlace.split('|'); removePlace(pid, plid); redraw(); }),
    on(root, 'submit', '[data-form=rename]', (e, f) => {
      e.preventDefault();
      const name = new FormData(f).get('name').trim();
      if (name) { renamePerson(f.dataset.id, name.slice(0, 40)); toast(t('saved')); redraw(); }
    }),
    on(root, 'submit', '[data-form=add-person]', (e, f) => {
      e.preventDefault();
      const name = new FormData(f).get('name').trim();
      if (name) { addPerson(name.slice(0, 40)); redraw(); }
    }),
    on(root, 'submit', '[data-form=add-place]', (e, f) => {
      e.preventDefault();
      const fd = new FormData(f);
      const c = CITIES.find((x) => String(x.id) === fd.get('city'));
      if (!c) return;
      addPlace(f.dataset.id, { cityId: c.id, label: c.name, role: fd.get('role'), lat: c.lat, lon: c.lon, tz: c.tz, country: c.country });
      redraw();
    }),
    on(root, 'click', '[data-act=share-setup]', async () => {
      const people = getState().people.filter((p) => p.places.length);
      const url = `${location.href.split('#')[0]}#/setup/${encodeSetup(people)}`;
      try {
        if (navigator.share) await navigator.share({ title: t('appName'), text: t('setupShareText'), url });
        else { await navigator.clipboard.writeText(url); toast(t('setupLinkCopied')); }
      } catch (err) {
        if (err?.name !== 'AbortError') { try { await navigator.clipboard.writeText(url); toast(t('setupLinkCopied')); } catch { /* ignore */ } }
      }
    }),
  ];
  return () => offs.forEach((f) => f());
}
