// Prayer times via the Adhan library (vendored, MIT): https://github.com/batoulapps/adhan-js
// Times are calculated on the device from coordinates + the chosen method. Nothing is hardcoded.

import * as adhan from '../../vendor/adhan.esm.min.js';

export const METHODS = [
  'MuslimWorldLeague', 'UmmAlQura', 'Egyptian', 'Karachi', 'NorthAmerica', 'MoonsightingCommittee',
  'Dubai', 'Kuwait', 'Qatar', 'Singapore', 'Turkey', 'Tehran',
];

// Fajr/Isha parameters as documented in Adhan's METHODS.md — shown in the UI for transparency.
export const METHOD_INFO = {
  MuslimWorldLeague: { fajr: '18°', isha: '17°' },
  UmmAlQura: { fajr: '18.5°', isha: '90 min after Maghrib' },
  Egyptian: { fajr: '19.5°', isha: '17.5°' },
  Karachi: { fajr: '18°', isha: '18°' },
  NorthAmerica: { fajr: '15°', isha: '15°' },
  MoonsightingCommittee: { fajr: '18°', isha: '18° + seasonal' },
  Dubai: { fajr: '18.2°', isha: '18.2°' },
  Kuwait: { fajr: '18°', isha: '17.5°' },
  Qatar: { fajr: '18°', isha: '90 min after Maghrib' },
  Singapore: { fajr: '20°', isha: '18°' },
  Turkey: { fajr: '18°', isha: '17°' },
  Tehran: { fajr: '17.7°', isha: '14°' },
};

export const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const FARD = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Suggest a method for a country, only where the method is named after / documented for
 * that country (Adhan METHODS.md). Everywhere else: Muslim World League. The UI always asks
 * the user to compare with their local mosque's timetable.
 */
export function suggestMethod(countryCode) {
  const cc = (countryCode || '').toUpperCase();
  if (cc === 'SA') return 'UmmAlQura';
  if (cc === 'EG') return 'Egyptian';
  if (cc === 'PK') return 'Karachi';
  if (['US', 'CA'].includes(cc)) return 'NorthAmerica';
  if (['GB', 'IE'].includes(cc)) return 'MoonsightingCommittee';
  if (cc === 'AE') return 'Dubai';
  if (cc === 'KW') return 'Kuwait';
  if (cc === 'QA') return 'Qatar';
  if (['SG', 'MY', 'ID', 'BN'].includes(cc)) return 'Singapore';
  if (cc === 'TR') return 'Turkey';
  if (cc === 'IR') return 'Tehran';
  return 'MuslimWorldLeague';
}

export function buildParams({ method = 'MuslimWorldLeague', madhab = 'shafi', highLat = 'auto', adjust = {} }, coords) {
  const factory = adhan.CalculationMethod[method] || adhan.CalculationMethod.MuslimWorldLeague;
  const params = factory();
  params.madhab = madhab === 'hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  const rule = highLat === 'auto'
    ? adhan.HighLatitudeRule.recommended(coords)
    : ({ middle: adhan.HighLatitudeRule.MiddleOfTheNight, seventh: adhan.HighLatitudeRule.SeventhOfTheNight, twilight: adhan.HighLatitudeRule.TwilightAngle }[highLat]);
  if (rule) params.highLatitudeRule = rule;
  for (const k of PRAYER_KEYS) {
    const v = Number(adjust[k] || 0);
    if (v) params.adjustments[k] = (params.adjustments[k] || 0) + v;
  }
  return params;
}

/**
 * Compute times for the calendar date `date` (y/m/d interpreted in the location's own zone
 * by the caller: pass a Date whose local y/m/d is the wanted day in that zone).
 */
export function computeTimes(lat, lon, ymd, settings) {
  const coords = new adhan.Coordinates(lat, lon);
  const params = buildParams(settings, coords);
  const date = new Date(ymd.y, ymd.m - 1, ymd.d);
  const pt = new adhan.PrayerTimes(coords, date, params);
  const out = {};
  for (const k of PRAYER_KEYS) out[k] = pt[k];
  return out;
}

/** y/m/d of `now` as seen in IANA time zone `tz`. */
export function ymdInZone(now, tz) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const g = (t) => Number(parts.find((p) => p.type === t).value);
  return { y: g('year'), m: g('month'), d: g('day') };
}

export function addDaysYmd({ y, m, d }, n) {
  const x = new Date(Date.UTC(y, m - 1, d + n));
  return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() };
}

/** Today's times plus the next fard prayer (rolling over to tomorrow's Fajr after Isha). */
export function todayAndNext(lat, lon, tz, settings, now = new Date()) {
  const ymd = ymdInZone(now, tz);
  const today = computeTimes(lat, lon, ymd, settings);
  let next = FARD.map((k) => ({ key: k, time: today[k] })).find((x) => x.time > now);
  let tomorrow = null;
  if (!next) {
    tomorrow = computeTimes(lat, lon, addDaysYmd(ymd, 1), settings);
    next = { key: 'fajr', time: tomorrow.fajr, tomorrow: true };
  }
  // The current prayer window (the last fard time that has started).
  const started = FARD.map((k) => ({ key: k, time: today[k] })).filter((x) => x.time <= now);
  const current = started.length ? started[started.length - 1].key : null;
  return { today, next, current, ymd };
}

export function formatTime(date, tz, locale) {
  return new Intl.DateTimeFormat(locale, { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(date);
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Hijri date via Intl's Umm al-Qura calendar (an estimate; local moon-sighting may differ). */
export function hijriDate(date, locale, tz) {
  try {
    return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, { timeZone: tz, day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  } catch {
    return '';
  }
}
