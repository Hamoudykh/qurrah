import { html, mount, on, toast, downloadFile } from '../core/dom.js';
import { t, getLang, intlLocale, fmtNum, L } from '../core/i18n.js';
import { getState, settings, update, setSetting } from '../core/store.js';
import { todayAndNext, computeTimes, ymdInZone, addDaysYmd, formatTime, formatCountdown, hijriDate, METHODS, METHOD_INFO, suggestMethod, PRAYER_KEYS, FARD } from '../logic/prayer.js';
import { prayerIcs } from '../logic/ics.js';
import { searchCity } from '../core/api.js';
import { CITIES } from '../data/cities.js';
import { requestPermission, permission, notify, notificationsSupported } from '../core/notify.js';
import { ic } from './ui.js';
import * as adhan from '../../vendor/adhan.esm.min.js';

export async function render(ctx) {
  ctx.setTitle(t('tabTimes'));
  let editing = !settings().prayer.location;
  let results = [];
  let searching = false;
  let timer = null;

  const setLocation = (loc) => {
    const firstTime = !settings().prayer.location;
    update((s) => {
      s.settings.prayer.location = loc;
      if (firstTime && loc.country && s.settings.prayer.method === 'MuslimWorldLeague') s.settings.prayer.method = suggestMethod(loc.country);
    });
    editing = false;
    results = [];
    toast(t('locationSet', { place: loc.label }));
    draw();
  };

  const highLatLabel = (ps, loc) => {
    if (ps.highLat !== 'auto') return t(`highLat_${ps.highLat}`);
    const r = adhan.HighLatitudeRule.recommended(new adhan.Coordinates(loc.lat, loc.lon));
    return `${t(r === 'seventhofthenight' ? 'highLat_seventh' : 'highLat_middle')} (${t('auto')})`;
  };

  const drawLocationEditor = () => html`<section class="card" id="loc-editor">
    <h3>${ic('pin')} ${t('chooseLocation')}</h3>
    <button class="btn primary wide" data-act="gps">${ic('pin')} ${t('useMyLocation')}</button>
    <p class="small muted">${t('gpsPrivacy')}</p>
    <form class="search-form" data-form="search">
      <label class="search">${ic('search')}<input name="q" type="search" placeholder="${t('searchCity')}" aria-label="${t('searchCity')}" autocomplete="off"></label>
      <button class="btn">${t('search')}</button>
    </form>
    ${searching ? html`<p class="small muted">${t('searching')}</p>` : ''}
    ${results.length ? html`<div class="list">${results.map((r, i) => html`<button class="list-item" data-pick="${i}"><span class="li-main"><span class="li-title">${r.label}</span><span class="li-sub" dir="ltr">${r.lat.toFixed(3)}, ${r.lon.toFixed(3)} · ${r.tz}</span></span></button>`)}</div>` : ''}
    <label class="field"><span>${t('orPickCity')}</span>
      <select data-act="city"><option value="">—</option>${[...CITIES].sort((a, b) => L(a.name).localeCompare(L(b.name), intlLocale())).map((c) => html`<option value="${c.id}">${L(c.name)} (${c.country})</option>`)}</select></label>
    <details><summary>${t('enterCoordinates')}</summary>
      <form class="stack" data-form="manual">
        <div class="row gap">
          <label class="field"><span>${t('latitude')}</span><input name="lat" type="number" step="0.0001" min="-90" max="90" required inputmode="decimal"></label>
          <label class="field"><span>${t('longitude')}</span><input name="lon" type="number" step="0.0001" min="-180" max="180" required inputmode="decimal"></label>
        </div>
        <label class="field"><span>${t('timeZone')}</span><select name="tz">${(Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [Intl.DateTimeFormat().resolvedOptions().timeZone]).map((z) => html`<option ${z === Intl.DateTimeFormat().resolvedOptions().timeZone ? 'selected' : ''}>${z}</option>`)}</select></label>
        <label class="field"><span>${t('placeName')}</span><input name="label" type="text" placeholder="${t('optional')}"></label>
        <button class="btn">${t('save')}</button>
      </form>
    </details>
    ${settings().prayer.location ? html`<button class="btn ghost" data-act="cancel-edit">${t('cancel')}</button>` : ''}
  </section>`;

  const draw = () => {
    clearInterval(timer);
    if (!ctx.isCurrent()) return; // an async handler finished after navigating away
    const ps = settings().prayer;
    const loc = ps.location;
    if (!loc || editing) {
      mount(ctx.el, html`${!loc ? html`<p class="lead">${t('timesIntro')}</p>` : ''}${drawLocationEditor()}`);
      return;
    }
    const now = new Date();
    const r = todayAndNext(loc.lat, loc.lon, loc.tz, ps, now);
    const tf = (d) => formatTime(d, loc.tz, intlLocale());
    const greg = new Intl.DateTimeFormat(intlLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: loc.tz }).format(now);
    const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const info = METHOD_INFO[ps.method];
    const notifyOn = ps.notify.enabled && permission() === 'granted';

    mount(ctx.el, html`
      <section class="card times-card">
        <div class="row between wrap">
          <div><p class="eyebrow">${ic('pin')} ${loc.label}</p><p class="small muted">${greg} · ${hijriDate(now, getLang(), loc.tz)}</p></div>
          <button class="btn ghost small" data-act="edit-loc">${t('change')}</button>
        </div>
        ${loc.tz !== deviceTz ? html`<p class="small note">${t('timesInZone', { tz: loc.tz })}</p>` : ''}
        <div class="next-big"><p class="eyebrow">${t('nextPrayer')}: ${t(`prayer_${r.next.key}`)}${r.next.tomorrow ? ` (${t('tomorrow')})` : ''}</p>
          <p class="cd big" dir="ltr" id="cd">${formatCountdown(r.next.time - now)}</p></div>
        <ul class="times-list">
          ${PRAYER_KEYS.map((k) => html`<li class="${r.current === k ? 'current' : ''} ${r.next.key === k && !r.next.tomorrow ? 'next' : ''} ${k === 'sunrise' ? 'sunrise' : ''}">
            <span>${t(`prayer_${k}`)}${k === 'sunrise' ? html` <span class="small muted">${t('sunriseNote')}</span>` : ''}</span>
            <span class="tm" dir="ltr">${tf(r.today[k])}</span></li>`)}
        </ul>
        <p class="small method-line">${ic('info')} ${t('methodInUse')}: <strong>${t(`method_${ps.method}`)}</strong> (${t('fajrAngle')} ${info.fajr}, ${t('ishaAngle')} ${info.isha}) · ${t('asr')}: <strong>${t(ps.madhab === 'hanafi' ? 'asrHanafi' : 'asrStandard')}</strong> · ${t('highLatRule')}: ${highLatLabel(ps, loc)}</p>
        <p class="small muted">${t('checkLocalMosque')}</p>
      </section>

      <a class="card link-card" href="#/qibla"><div><h3>${ic('compass')} ${t('qibla')}</h3><p class="muted small">${t('qiblaTeaser')}</p></div>${ic('forward', 'flip-rtl')}</a>

      <section class="card">
        <h3>${t('calculation')}</h3>
        <label class="field"><span>${t('method')}</span><select data-pset="method">${METHODS.map((m) => html`<option value="${m}" ${ps.method === m ? 'selected' : ''}>${t(`method_${m}`)}</option>`)}</select></label>
        <div class="ctl"><span class="ctl-label">${t('asrMethod')}</span><div class="seg small" role="radiogroup">
          <button role="radio" aria-checked="${ps.madhab === 'shafi'}" class="${ps.madhab === 'shafi' ? 'on' : ''}" data-madhab="shafi">${t('asrStandard')}</button>
          <button role="radio" aria-checked="${ps.madhab === 'hanafi'}" class="${ps.madhab === 'hanafi' ? 'on' : ''}" data-madhab="hanafi">${t('asrHanafi')}</button></div></div>
        <p class="small muted">${t('asrExplain')}</p>
        <label class="field"><span>${t('highLatRule')}</span><select data-pset="highLat">${['auto', 'middle', 'seventh', 'twilight'].map((v) => html`<option value="${v}" ${ps.highLat === v ? 'selected' : ''}>${v === 'auto' ? t('auto') : t(`highLat_${v}`)}</option>`)}</select></label>
        <details><summary>${t('adjustments')}</summary>
          <p class="small muted">${t('adjustmentsHint')}</p>
          <div class="adjust-grid">${PRAYER_KEYS.map((k) => html`<label class="field inline"><span>${t(`prayer_${k}`)}</span><input type="number" min="-30" max="30" step="1" value="${ps.adjust[k] || 0}" data-adjust="${k}" inputmode="numeric"></label>`)}</div>
        </details>
      </section>

      <section class="card">
        <h3>${ic('bell')} ${t('reminders')}</h3>
        ${notificationsSupported() ? html`
          <label class="switch-row"><input type="checkbox" data-act="notify" ${notifyOn ? 'checked' : ''}><span>${t('notifyBeforePrayers')}</span></label>
          ${notifyOn ? html`
            <label class="field inline"><span>${t('minutesBefore')}</span><select data-pset="notify.minutesBefore">${[0, 5, 10, 15, 20, 30].map((m) => html`<option value="${m}" ${+ps.notify.minutesBefore === m ? 'selected' : ''}>${fmtNum(m)}</option>`)}</select></label>
            <div class="row wrap gap">${FARD.map((k) => html`<label class="chip-check"><input type="checkbox" data-np="${k}" ${ps.notify.prayers[k] ? 'checked' : ''}> ${t(`prayer_${k}`)}</label>`)}</div>
            <button class="btn ghost small" data-act="test-notify">${t('testNotification')}</button>` : ''}
          ${permission() === 'denied' ? html`<p class="small warn-text">${t('notifyDenied')}</p>` : ''}` : html`<p class="small muted">${t('notifyUnsupported')}</p>`}
        <p class="small note">${t('notifyLimitation')}</p>
        <button class="btn" data-act="ics">${ic('calendar')} ${t('exportCalendar')}</button>
      </section>`);

    timer = setInterval(() => {
      const el = ctx.el.querySelector('#cd');
      const r2 = todayAndNext(loc.lat, loc.lon, loc.tz, settings().prayer, new Date());
      if (r2.next.key !== r.next.key) { draw(); return; }
      if (el) el.textContent = formatCountdown(r2.next.time - new Date());
    }, 1000);
  };
  draw();

  const offs = [
    on(ctx.el, 'click', '[data-act]', async (e, b) => {
      const a = b.dataset.act;
      if (a === 'edit-loc') { editing = true; draw(); }
      if (a === 'cancel-edit') { editing = false; draw(); }
      if (a === 'gps') {
        if (!navigator.geolocation) { toast(t('gpsUnavailable')); return; }
        b.disabled = true;
        navigator.geolocation.getCurrentPosition(
          (pos) => setLocation({ mode: 'gps', lat: +pos.coords.latitude.toFixed(4), lon: +pos.coords.longitude.toFixed(4), tz: Intl.DateTimeFormat().resolvedOptions().timeZone, label: t('myLocation') }),
          () => { b.disabled = false; toast(t('gpsDenied')); },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
      }
      if (a === 'test-notify') { const ok = await notify(t('appName'), t('testNotificationBody'), { tag: 'test' }); if (!ok) toast(t('notifyDenied')); }
      if (a === 'ics') exportIcs();
    }),
    on(ctx.el, 'change', '[data-act=notify]', async (e, inp) => {
      if (inp.checked) {
        const p = await requestPermission();
        setSetting('prayer.notify.enabled', p === 'granted');
        if (p !== 'granted') toast(t('notifyDenied'));
      } else setSetting('prayer.notify.enabled', false);
      draw();
    }),
    on(ctx.el, 'change', '[data-np]', (e, inp) => { update((s) => { s.settings.prayer.notify.prayers[inp.dataset.np] = inp.checked; }); }),
    on(ctx.el, 'change', '[data-act=city]', (e, sel) => {
      const c = CITIES.find((x) => String(x.id) === sel.value);
      if (c) setLocation({ mode: 'city', lat: c.lat, lon: c.lon, tz: c.tz, label: L(c.name), country: c.country });
    }),
    on(ctx.el, 'submit', '[data-form=search]', async (e, form) => {
      e.preventDefault();
      const q = new FormData(form).get('q').trim();
      if (!q) return;
      searching = true; draw();
      try { results = await searchCity(q, getLang()); if (!results.length) toast(t('noMatches')); }
      catch { toast(navigator.onLine ? t('loadFailed') : t('searchNeedsInternet')); results = []; }
      searching = false; draw();
    }),
    on(ctx.el, 'click', '[data-pick]', (e, b) => {
      const r = results[+b.dataset.pick];
      setLocation({ mode: 'city', lat: +r.lat.toFixed(4), lon: +r.lon.toFixed(4), tz: r.tz, label: r.label, country: r.country });
    }),
    on(ctx.el, 'submit', '[data-form=manual]', (e, form) => {
      e.preventDefault();
      const fd = new FormData(form);
      const lat = +fd.get('lat'), lon = +fd.get('lon');
      if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) { toast(t('invalidCoords')); return; }
      setLocation({ mode: 'manual', lat, lon, tz: fd.get('tz'), label: fd.get('label') || `${lat.toFixed(3)}, ${lon.toFixed(3)}` });
    }),
    on(ctx.el, 'change', '[data-pset]', (e, sel) => {
      const key = sel.dataset.pset;
      setSetting(`prayer.${key}`, key === 'notify.minutesBefore' ? +sel.value : sel.value);
      draw();
    }),
    on(ctx.el, 'click', '[data-madhab]', (e, b) => { setSetting('prayer.madhab', b.dataset.madhab); draw(); }),
    on(ctx.el, 'change', '[data-adjust]', (e, inp) => {
      const v = Math.max(-30, Math.min(30, Math.round(+inp.value || 0)));
      update((s) => { s.settings.prayer.adjust[inp.dataset.adjust] = v; });
      draw();
    }),
  ];

  function exportIcs() {
    const ps = settings().prayer;
    const loc = ps.location;
    const start = ymdInZone(new Date(), loc.tz);
    const events = [];
    for (let i = 0; i < 30; i++) {
      const times = computeTimes(loc.lat, loc.lon, addDaysYmd(start, i), ps);
      for (const k of FARD) if (ps.notify.prayers[k] !== false) events.push({ key: k, title: `${t(`prayer_${k}`)} · ${loc.label}`, start: times[k] });
    }
    const ics = prayerIcs(events, { alarmMinutes: +ps.notify.minutesBefore || 0, calName: t('prayerTimes') });
    downloadFile('qurrah-prayer-times.ics', ics, 'text/calendar');
    toast(t('icsExported'));
  }

  return () => { clearInterval(timer); offs.forEach((f) => f()); };
}
