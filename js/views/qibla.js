import { html, raw, mount, on } from '../core/dom.js';
import { t, fmtNum } from '../core/i18n.js';
import { settings } from '../core/store.js';
import { qiblaBearing, distanceToKaabaKm, headingFromOrientation, angleDiff, compassPoint } from '../logic/qibla.js';
import { ic } from './ui.js';

export async function render(ctx) {
  ctx.setTitle(t('qibla'));
  const loc = settings().prayer.location;
  if (!loc) {
    mount(ctx.el, html`<section class="card"><h3>${t('qibla')}</h3><p>${t('qiblaNeedsLocation')}</p><a class="btn primary" href="#/times">${ic('pin')} ${t('setLocation')}</a></section>`);
    return;
  }
  const bearing = qiblaBearing(loc.lat, loc.lon);
  const km = distanceToKaabaKm(loc.lat, loc.lon);
  let heading = null;
  let source = null;
  let accuracy = null;
  let listening = false;
  let lastBuzz = false;
  let gotEvent = false;

  const needsPermission = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
  const supported = typeof window.DeviceOrientationEvent !== 'undefined';

  mount(ctx.el, html`
    <section class="card qibla-card">
      <p class="eyebrow">${ic('pin')} ${loc.label}</p>
      <div class="compass-wrap">
        <div class="compass" id="compass" aria-hidden="true">
          <div class="rose" id="rose">
            <span class="cardinal n">N</span><span class="cardinal e">E</span><span class="cardinal s">S</span><span class="cardinal w">W</span>
            ${raw(Array.from({ length: 72 }, (_, i) => `<i class="tick${i % 6 === 0 ? ' major' : ''}" style="--a:${i * 5}deg"></i>`).join(''))}
            <div class="qibla-needle" style="--a:${bearing}deg"><span class="kaaba"></span></div>
          </div>
          <div class="phone-dir"></div>
        </div>
      </div>
      <p class="bearing"><span class="big" dir="ltr">${bearing.toFixed(1)}°</span> <span class="muted">${t('fromTrueNorth')} (${compassPoint(bearing)})</span></p>
      <p class="status" id="q-status" aria-live="polite">${supported ? t('compassStartHint') : t('compassUnsupported')}</p>
      ${supported ? html`<button class="btn primary" data-act="start">${ic('compass')} ${t('startCompass')}</button>` : ''}
      <p class="small muted">${t('distanceToKaaba', { km: fmtNum(Math.round(km)) })}</p>
    </section>

    <section class="card">
      <h3>${t('howToUse')}</h3>
      <ol class="steps">
        <li>${t('qiblaStep1')}</li>
        <li>${t('qiblaStep2')}</li>
        <li>${t('qiblaStep3', { deg: bearing.toFixed(0) })}</li>
      </ol>
      <h3>${t('calibrate')}</h3>
      <p>${t('calibrateTip')}</p>
      <p class="small note">${t('magneticNote')}</p>
      <p class="small muted">${t('qiblaMethodNote')}</p>
    </section>`);

  const rose = ctx.el.querySelector('#rose');
  const compass = ctx.el.querySelector('#compass');
  const statusEl = ctx.el.querySelector('#q-status');

  const screenAngle = () => (screen.orientation?.angle ?? window.orientation ?? 0) || 0;

  const onOrient = (e) => {
    const r = headingFromOrientation(e, screenAngle());
    if (!r) return;
    gotEvent = true;
    heading = r.heading; source = r.source; accuracy = r.accuracy;
    rose.style.transform = `rotate(${-heading}deg)`;
    const diff = angleDiff(heading, bearing);
    const aligned = Math.abs(diff) <= 4;
    compass.classList.toggle('aligned', aligned);
    if (aligned && !lastBuzz) navigator.vibrate?.(60);
    lastBuzz = aligned;
    statusEl.textContent = aligned ? t('facingQibla')
      : t(diff > 0 ? 'turnRight' : 'turnLeft', { deg: Math.round(Math.abs(diff)) })
        + (accuracy != null && accuracy > 20 ? ` · ${t('lowAccuracy')}` : '');
  };

  const start = async () => {
    if (listening) return;
    try {
      if (needsPermission) {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') { statusEl.textContent = t('compassDenied'); return; }
      }
      listening = true;
      if ('ondeviceorientationabsolute' in window) window.addEventListener('deviceorientationabsolute', onOrient);
      window.addEventListener('deviceorientation', onOrient);
      statusEl.textContent = t('compassWaiting');
      setTimeout(() => { if (!gotEvent && ctx.isCurrent()) statusEl.textContent = t('compassNoData'); }, 3500);
    } catch {
      statusEl.textContent = t('compassUnsupported');
    }
  };

  const off = on(ctx.el, 'click', '[data-act=start]', (e, b) => { start(); b.hidden = true; });
  // Android/desktop browsers that don't require a permission prompt can start immediately.
  if (supported && !needsPermission) { start(); ctx.el.querySelector('[data-act=start]')?.setAttribute('hidden', ''); }

  return () => {
    off();
    window.removeEventListener('deviceorientationabsolute', onOrient);
    window.removeEventListener('deviceorientation', onOrient);
  };
}
