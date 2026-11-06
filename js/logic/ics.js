// Minimal iCalendar (RFC 5545) builder for reminder export (pure).
// Calendar alarms are the reliable way to get reminders when a web app is closed.

const pad = (n) => String(n).padStart(2, '0');
export function utcStamp(d) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
const escText = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Fold lines longer than 75 octets (UTF-8 safe). */
export function fold(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out = [];
  let cur = '';
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ''; }
    cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

function wrap(events, name) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Qurrah//Salah Companion//EN', 'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH', `X-WR-CALNAME:${escText(name)}`, ...events, 'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/**
 * @param {Array<{key:string,title:string,start:Date}>} items  prayer events
 * @param {number} alarmMinutes  minutes before (0 = at the time)
 */
export function prayerIcs(items, { alarmMinutes = 10, calName = 'Prayer times', now = new Date() } = {}) {
  const stamp = utcStamp(now);
  const events = items.flatMap((it) => [
    'BEGIN:VEVENT',
    `UID:${it.key}-${utcStamp(it.start)}@qurrah.local`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${utcStamp(it.start)}`,
    `DTEND:${utcStamp(new Date(it.start.getTime() + 15 * 60000))}`,
    `SUMMARY:${escText(it.title)}`,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escText(it.title)}`,
    `TRIGGER:-PT${Math.max(0, alarmMinutes)}M`, 'END:VALARM',
    'END:VEVENT',
  ]);
  return wrap(events, calName);
}

/** A daily repeating reminder at local HH:MM (floating time = the device's own time zone). */
export function dailyReminderIcs({ time = '08:00', title, description = '', start = new Date(), now = new Date() }) {
  const [hh, mm] = time.split(':').map(Number);
  const ds = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T${pad(hh)}${pad(mm)}00`;
  const events = [
    'BEGIN:VEVENT', `UID:daily-verse-${ds}@qurrah.local`, `DTSTAMP:${utcStamp(now)}`, `DTSTART:${ds}`,
    'DURATION:PT10M', 'RRULE:FREQ=DAILY', `SUMMARY:${escText(title)}`, `DESCRIPTION:${escText(description)}`,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escText(title)}`, 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT',
  ];
  return wrap(events, title);
}
