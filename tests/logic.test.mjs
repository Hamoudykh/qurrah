import test from 'node:test';
import assert from 'node:assert/strict';

import { review, newSchedule, knownSchedule, dueQueue } from '../js/logic/srs.js';
import { planDay, PRAYERS, sunnahSuggestions } from '../js/logic/planner.js';
import { qiblaBearing, distanceToKaabaKm, angleDiff, headingFromOrientation } from '../js/logic/qibla.js';
import { computeTimes, todayAndNext, suggestMethod, ymdInZone, METHODS } from '../js/logic/prayer.js';
import { prayerIcs, dailyReminderIcs, fold } from '../js/logic/ics.js';
import { streak, longestStreak, dayKey, dayNumber, keyFromDayNumber } from '../js/logic/dates.js';
import { suggestNext } from '../js/logic/suggest.js';
import { CATALOG } from '../js/data/catalog.js';
import * as adhan from '../vendor/adhan.esm.min.js';

const D = (s) => new Date(s);

test('srs: intervals grow on good, reset on again, capped', () => {
  const t0 = D('2026-01-01T12:00:00');
  let s = newSchedule(t0);
  assert.equal(s.due, dayNumber(t0) + 1);
  s = review(s, 'good', t0);
  assert.equal(s.interval, 3);
  const i1 = s.interval;
  s = review(s, 'good', t0);
  assert.ok(s.interval > i1);
  s = review(s, 'again', t0);
  assert.equal(s.interval, 1);
  assert.equal(s.lapses, 1);
  for (let i = 0; i < 30; i++) s = review(s, 'easy', t0);
  assert.ok(s.interval <= 180);
  assert.ok(s.ease >= 1.3);
});

test('srs: known items are spread over the week; due queue sorted', () => {
  const t0 = D('2026-01-01T12:00:00');
  const dues = [0, 1, 2, 3, 4, 5].map((i) => knownSchedule(i, t0).due);
  assert.equal(new Set(dues).size, 6);
  const later = D('2026-01-20T12:00:00');
  const q = dueQueue([{ id: 'a', srs: { due: dayNumber(later) - 1 } }, { id: 'b', srs: { due: dayNumber(later) - 5 } }, { id: 'c', srs: { due: dayNumber(later) + 3 } }], later);
  assert.deepEqual(q.map((x) => x.id), ['b', 'a']);
});

test('planner: surah only in first two rak\'ahs, mushaf order, rotation across the day', () => {
  const known = [
    { id: 's112', pos: 112001, words: 15 }, { id: 's113', pos: 113001, words: 23 }, { id: 's114', pos: 114001, words: 20 },
    { id: 's103', pos: 103001, words: 14 }, { id: 's108', pos: 108001, words: 10 },
  ].map((k) => ({ ...k, lastRecited: null, due: null }));
  const today = 20500;
  const { prayers } = planDay(known, { today });
  assert.equal(prayers.length, 5);
  for (const p of prayers) {
    const spec = PRAYERS.find((x) => x.id === p.id);
    assert.equal(p.rakahs.length, spec.rakahs);
    assert.ok(p.rakahs.slice(2).every((r) => r.fatihaOnly && r.item === null));
    const [a, b] = p.rakahs;
    const pos = (id) => known.find((k) => k.id === id).pos;
    assert.ok(pos(a.item) <= pos(b.item), `mushaf order in ${p.id}`);
    assert.notEqual(a.item, b.item);
  }
  // With 5 known items and 10 slots, every item should be used at least once.
  const used = new Set(prayers.flatMap((p) => p.rakahs.map((r) => r.item).filter(Boolean)));
  assert.equal(used.size, 5);
  // Deterministic for the same day+seed; changes with the seed.
  assert.deepEqual(planDay(known, { today }).prayers, prayers);
  const shuffled = [1, 2, 3, 4, 5].some((seed) => JSON.stringify(planDay(known, { today, seed }).prayers) !== JSON.stringify(prayers));
  assert.ok(shuffled);
});

test('planner: Fajr prefers longer, Maghrib shorter', () => {
  const known = Array.from({ length: 10 }, (_, i) => ({ id: `x${i}`, pos: 100000 + i, words: 10 + i * 10, lastRecited: null, due: null }));
  let fajrWords = 0, maghribWords = 0;
  for (let day = 0; day < 30; day++) {
    const { prayers } = planDay(known, { today: 20000 + day });
    const w = (p) => p.rakahs.slice(0, 2).reduce((s, r) => s + known.find((k) => k.id === r.item).words, 0);
    fajrWords += w(prayers.find((p) => p.id === 'fajr'));
    maghribWords += w(prayers.find((p) => p.id === 'maghrib'));
  }
  assert.ok(fajrWords > maghribWords * 1.5, `${fajrWords} vs ${maghribWords}`);
});

test('planner: single known surah is repeated in both rak\'ahs; none known gives fatiha only', () => {
  const one = planDay([{ id: 's112', pos: 1, words: 15, lastRecited: null, due: null }], { today: 1 });
  assert.ok(one.prayers.every((p) => p.repeated && p.rakahs[0].item === 's112' && p.rakahs[1].item === 's112'));
  const none = planDay([], { today: 1 });
  assert.ok(none.prayers.every((p) => p.rakahs.every((r) => r.fatihaOnly)));
  const s = sunnahSuggestions(new Set(['s109', 's112']));
  assert.equal(s.find((x) => x.id === 'fajrSunnah').ready, true);
  assert.equal(s.find((x) => x.id === 'witr').ready, false);
});

test('qibla: matches the Adhan library and known directions', () => {
  const places = [[51.5085, -0.1257], [40.7128, -74.006], [31.769, 35.2163], [-33.8688, 151.2093], [35.6762, 139.6503], [21.4266, 39.8256 + 0.5]];
  for (const [lat, lon] of places) {
    const mine = qiblaBearing(lat, lon);
    const theirs = adhan.Qibla(new adhan.Coordinates(lat, lon));
    assert.ok(Math.abs(angleDiff(mine, theirs)) < 1e-9, `${lat},${lon}: ${mine} vs ${theirs}`);
  }
  // London ≈ 119° (ESE), New York ≈ 58° (NE): standard great-circle values.
  assert.ok(Math.abs(qiblaBearing(51.5085, -0.1257) - 119) < 1.5);
  assert.ok(Math.abs(qiblaBearing(40.7128, -74.006) - 58.5) < 1.5);
  assert.ok(Math.abs(distanceToKaabaKm(51.5085, -0.1257) - 4790) < 60);
});

test('qibla: heading from device orientation events', () => {
  assert.equal(headingFromOrientation({ webkitCompassHeading: 90 }).heading, 90);
  assert.equal(headingFromOrientation({ absolute: true, alpha: 90 }).heading, 270);
  assert.equal(headingFromOrientation({ type: 'deviceorientationabsolute', alpha: 0 }, 90).heading, 90);
  assert.equal(headingFromOrientation({ absolute: false, alpha: 10 }), null);
  assert.equal(angleDiff(350, 10), 20);
  assert.equal(angleDiff(10, 350), -20);
});

test('prayer: times are ordered and the next prayer rolls over to tomorrow', () => {
  const s = { method: 'MuslimWorldLeague', madhab: 'shafi', highLat: 'auto', adjust: {} };
  const t = computeTimes(31.769, 35.2163, { y: 2026, m: 11, d: 6 }, s);
  const order = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (let i = 1; i < order.length; i++) assert.ok(t[order[i]] > t[order[i - 1]], order[i]);
  // Hanafi Asr is later than standard Asr.
  const h = computeTimes(31.769, 35.2163, { y: 2026, m: 11, d: 6 }, { ...s, madhab: 'hanafi' });
  assert.ok(h.asr > t.asr);
  // Adjustments shift times by minutes.
  const adj = computeTimes(31.769, 35.2163, { y: 2026, m: 11, d: 6 }, { ...s, adjust: { isha: 5 } });
  assert.equal((adj.isha - t.isha) / 60000, 5);
  // After Isha → next is tomorrow's Fajr.
  const late = new Date(t.isha.getTime() + 60 * 60000);
  const r = todayAndNext(31.769, 35.2163, 'Asia/Jerusalem', s, late);
  assert.equal(r.next.key, 'fajr');
  assert.ok(r.next.tomorrow);
  assert.equal(r.current, 'isha');
  // Every listed method builds.
  for (const m of METHODS) assert.ok(computeTimes(51.5, -0.12, { y: 2026, m: 6, d: 21 }, { ...s, method: m }).isha);
  assert.equal(suggestMethod('SA'), 'UmmAlQura');
  assert.equal(suggestMethod('XX'), 'MuslimWorldLeague');
  assert.deepEqual(ymdInZone(new Date('2026-11-06T23:30:00Z'), 'Asia/Jerusalem'), { y: 2026, m: 11, d: 7 });
});

test('ics: valid structure, alarms and folding', () => {
  const ics = prayerIcs([{ key: 'fajr', title: 'Fajr', start: new Date('2026-11-07T02:36:00Z') }], { alarmMinutes: 10, now: new Date('2026-11-06T00:00:00Z') });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20261107T023600Z/);
  assert.match(ics, /TRIGGER:-PT10M/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
  const daily = dailyReminderIcs({ time: '08:15', title: 'Daily verse', start: new Date(2026, 10, 7) });
  assert.match(daily, /DTSTART:20261107T081500\r\n/);
  assert.match(daily, /RRULE:FREQ=DAILY/);
  const long = fold('SUMMARY:' + 'ا'.repeat(80));
  for (const line of long.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75);
});

test('dates: streaks', () => {
  const today = new Date(2026, 10, 6, 10);
  const n = dayNumber(today);
  const keys = new Set([n, n - 1, n - 2, n - 5].map(keyFromDayNumber));
  assert.equal(streak(keys, today), 3);
  // Not yet active today: yesterday's streak still counts.
  assert.equal(streak(new Set([n - 1, n - 2].map(keyFromDayNumber)), today), 2);
  assert.equal(longestStreak(keys), 3);
  assert.equal(dayKey(today), '2026-11-06');
});

test('suggest: one level at a time, shortest first', () => {
  let r = suggestNext({});
  assert.equal(r.level, 'easy');
  assert.equal(r.next.id, CATALOG.find((c) => c.level === 'easy').id);
  const items = {};
  for (const c of CATALOG.filter((c) => c.level === 'easy')) items[c.id] = { status: 'known' };
  r = suggestNext(items);
  assert.equal(r.level, 'medium');
  assert.equal(r.next.level, 'medium');
});
