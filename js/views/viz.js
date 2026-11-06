// Visual building blocks drawn as inline SVG (no images to download):
// progress rings, 8-point star medallions, prayer icons, the time-of-day sky, constellation.
import { raw } from '../core/dom.js';
import { fmtNum } from '../core/i18n.js';
import { mulberry32 } from '../logic/planner.js';

const STAR8 = 'M50 4l13.5 13.5H82.5V36.5L96 50 82.5 63.5V82.5H63.5L50 96 36.5 82.5H17.5V63.5L4 50 17.5 36.5V17.5H36.5z';

/** Circular progress ring. frac in [0,1]. Content (number/icon) goes in `inner`. */
export function ring(frac, { size = 56, stroke = 5, cls = '', inner = '' } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, frac || 0));
  return raw(`<span class="ring ${cls}" style="--size:${size}px">
    <svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" fill="none"/>
      <circle class="ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" fill="none"
        stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - f)).toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})" stroke-linecap="round"/>
    </svg><span class="ring-inner">${inner}</span></span>`);
}

/** Numbered 8-point star medallion (surah / ayah numbers). */
export function medallion(n, cls = '') {
  return raw(`<span class="medal ${cls}"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="${STAR8}"/></svg><b>${fmtNum(n)}</b></span>`);
}

export const starPath = STAR8;

// ---- prayer icons (24×24, stroke) ----
const PI = {
  fajr: '<path d="M3 18h18M7.5 18a4.5 4.5 0 0 1 9 0"/><path d="M6 8.5h.01M17.5 7h.01M12 5h.01M9 11.5h.01M15 11h.01" stroke-width="2.4"/>',
  sunrise: '<path d="M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0M12 5v3M5.2 9.8l1.6 1.6M18.8 9.8l-1.6 1.6M2.5 14h2M19.5 14h2"/>',
  dhuhr: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  asr: '<circle cx="14" cy="10" r="3.6"/><path d="M14 3.2v1.6M20.8 10h-1.6M18.8 5.2l-1.1 1.1M18.8 14.8l-1.1-1.1M3 19.5h18M5 16.5h7"/>',
  maghrib: '<path d="M3 15h18M7 15a5 5 0 0 1 10 0M5 19h14M12 7v2.5M9.5 4.5 12 7l2.5-2.5"/>',
  isha: '<path d="M15.5 4.5a7.5 7.5 0 1 0 4.5 12.2A6 6 0 0 1 15.5 4.5z"/><path d="M19 4.5v3M17.5 6h3" stroke-width="1.5"/>',
};
export const prayerIcon = (k, cls = '') => raw(`<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${PI[k] || PI.dhuhr}</svg>`);

// ---- sky ----
/**
 * Which part of the day it is, for the sky colours.
 * With prayer times: night | fajr | morning | dhuhr | asr | maghrib. Without: by clock.
 */
export function skyPeriod(times, now = new Date()) {
  if (times) {
    if (now < times.fajr) return 'night';
    if (now < times.sunrise) return 'fajr';
    if (now < times.dhuhr) return 'morning';
    if (now < times.asr) return 'dhuhr';
    if (now < times.maghrib) return 'asr';
    if (now < times.isha) return 'maghrib';
    return 'night';
  }
  const h = now.getHours() + now.getMinutes() / 60;
  if (h < 4.5) return 'night';
  if (h < 6) return 'fajr';
  if (h < 12) return 'morning';
  if (h < 15) return 'dhuhr';
  if (h < 17.5) return 'asr';
  if (h < 19) return 'maghrib';
  return 'night';
}

/** Sun (day) or moon (night) position along the hero arc: {x, y, body}. */
export function celestial(times, now = new Date()) {
  let frac, body;
  if (times && now >= times.sunrise && now < times.maghrib) {
    frac = (now - times.sunrise) / (times.maghrib - times.sunrise);
    body = 'sun';
  } else if (times) {
    // Night: from maghrib to next sunrise (approximate with a 24h wrap).
    const start = now >= times.maghrib ? times.maghrib : new Date(times.maghrib.getTime() - 86400000);
    const end = now >= times.maghrib ? new Date(times.sunrise.getTime() + 86400000) : times.sunrise;
    frac = (now - start) / (end - start);
    body = 'moon';
  } else {
    const h = now.getHours() + now.getMinutes() / 60;
    body = h >= 6 && h < 18 ? 'sun' : 'moon';
    frac = body === 'sun' ? (h - 6) / 12 : ((h + 6) % 24) / 12;
  }
  frac = Math.max(0.03, Math.min(0.97, frac));
  // Arc from right (start) to left in RTL is just a mirror; we keep east on the right for both.
  const angle = Math.PI * (1 - frac);
  return { x: 50 + 44 * Math.cos(angle), y: 92 - 78 * Math.sin(angle), body };
}

export function skyArc(times, now) {
  const c = celestial(times, now);
  const glow = c.body === 'sun'
    ? `<circle cx="${c.x}" cy="${c.y}" r="9" class="sun-glow"/><circle cx="${c.x}" cy="${c.y}" r="4.6" class="sun"/>`
    : `<circle cx="${c.x}" cy="${c.y}" r="7" class="moon-glow"/><path class="moon" d="M${c.x + 1.6} ${c.y - 4.2}a4.4 4.4 0 1 0 2.8 7.4 3.6 3.6 0 0 1-2.8-7.4z"/>`;
  return raw(`<svg class="sky-arc" viewBox="0 0 100 96" preserveAspectRatio="none" aria-hidden="true">
    <path d="M6 92 A44 78 0 0 1 94 92" class="arc-path"/>${glow}</svg>`);
}

/** Deterministic twinkling stars for the night sky. */
export function skyStars(count = 26, seed = 7) {
  const rnd = mulberry32(seed);
  let s = '';
  for (let i = 0; i < count; i++) {
    const x = (rnd() * 100).toFixed(1), y = (rnd() * 70).toFixed(1), r = (0.5 + rnd() * 1.1).toFixed(2), d = (rnd() * 4).toFixed(2);
    s += `<i style="left:${x}%;top:${y}%;--r:${r}px;--d:${d}s"></i>`;
  }
  return raw(`<span class="stars" aria-hidden="true">${s}</span>`);
}

// ---- constellation of surahs (Me screen) ----
/** Positions for n stars in a 320×230 box, spread out (seeded), shortest items near the centre-bottom. */
export function constellationLayout(n, seed = 11) {
  const rnd = mulberry32(seed);
  const pts = [];
  const W = 320, H = 230, PAD = 16;
  let tries = 0;
  while (pts.length < n && tries < 20000) {
    tries++;
    const x = PAD + rnd() * (W - 2 * PAD), y = PAD + rnd() * (H - 2 * PAD);
    const minD = tries < 15000 ? 30 : 18;
    if (pts.every((p) => (p.x - x) ** 2 + (p.y - y) ** 2 > minD * minD)) pts.push({ x, y });
  }
  // Order: an easy-to-follow path through the sky (sort by angle around the centre).
  pts.sort((a, b) => Math.atan2(a.y - H / 2, a.x - W / 2) - Math.atan2(b.y - H / 2, b.x - W / 2));
  return pts;
}
