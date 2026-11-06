// In-app reminder scheduler. Browsers do not let a web app wake itself up at a set time
// without a push server (and this app has none, by design). So:
//  * while the app is open (or recently backgrounded), reminders fire on time;
//  * for reliable reminders when the app is closed, use "Export to calendar" (.ics).

import { settings } from './store.js';
import { t } from './i18n.js';
import { todayAndNext, FARD } from '../logic/prayer.js';
import { dayKey } from '../logic/dates.js';

const FIRED_KEY = 'qurrah:notified';
let timer = null;

export const notificationsSupported = () => typeof Notification !== 'undefined';
export const permission = () => (notificationsSupported() ? Notification.permission : 'unsupported');

export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

export async function notify(title, body, { tag, url = './#/' } = {}) {
  if (permission() !== 'granted') return false;
  const opts = { body, tag, icon: './icons/icon-192.png', badge: './icons/badge-96.png', data: { url } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg) { await reg.showNotification(title, opts); return true; }
  } catch { /* fall through */ }
  try { new Notification(title, opts); return true; } catch { return false; }
}

function fired() {
  try { return JSON.parse(localStorage.getItem(FIRED_KEY) || '{}'); } catch { return {}; }
}
function markFired(key) {
  const f = fired();
  f[key] = Date.now();
  // keep it small
  for (const k of Object.keys(f)) if (Date.now() - f[k] > 3 * 86400000) delete f[k];
  try { localStorage.setItem(FIRED_KEY, JSON.stringify(f)); } catch { /* ignore */ }
}

function check() {
  const s = settings();
  const now = new Date();
  const today = dayKey(now);
  const done = fired();
  const loc = s.prayer.location;
  if (s.prayer.notify.enabled && loc) {
    const { today: times } = todayAndNext(loc.lat, loc.lon, loc.tz, s.prayer, now);
    const before = Number(s.prayer.notify.minutesBefore) || 0;
    for (const k of FARD) {
      if (!s.prayer.notify.prayers[k]) continue;
      const at = times[k].getTime() - before * 60000;
      const key = `${today}:${k}`;
      // Fire within a 15-minute window after the reminder time (handles throttled timers).
      if (now.getTime() >= at && now.getTime() - at < 15 * 60000 && !done[key]) {
        markFired(key);
        notify(t(`prayer_${k}`), before ? t('notifyBefore', { n: before, prayer: t(`prayer_${k}`) }) : t('notifyNow', { prayer: t(`prayer_${k}`) }), { tag: `prayer-${k}`, url: './#/times' });
      }
    }
  }
  if (s.daily.notify) {
    const [hh, mm] = (s.daily.time || '08:00').split(':').map(Number);
    const at = new Date(now); at.setHours(hh, mm, 0, 0);
    const key = `${today}:daily`;
    if (now >= at && now - at < 60 * 60000 && !done[key]) {
      markFired(key);
      notify(t('dailyVerse'), t('dailyNotifyBody'), { tag: 'daily-verse', url: './#/' });
    }
  }
}

export function startScheduler() {
  clearInterval(timer);
  timer = setInterval(check, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  setTimeout(check, 3000);
}
