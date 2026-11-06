// Spaced repetition for memorized items (pure functions, unit-tested).
// A simplified SM-2 style schedule: interval (days) grows by an ease factor on each good review.

import { dayNumber } from './dates.js';

export const GRADES = ['again', 'hard', 'good', 'easy'];
const MAX_INTERVAL = 180;
const MIN_EASE = 1.3;

/** Fresh schedule for an item that was just memorized in the app: review tomorrow. */
export function newSchedule(today = new Date()) {
  return { interval: 1, ease: 2.3, reps: 0, lapses: 0, due: dayNumber(today) + 1, last: null };
}

/**
 * Schedule for items the user already knew before using the app. They are spread over
 * the coming week (by index) so they don't all fall due on the same day.
 */
export function knownSchedule(index = 0, today = new Date()) {
  return { interval: 7, ease: 2.5, reps: 1, lapses: 0, due: dayNumber(today) + 2 + (index % 6), last: null };
}

export function review(schedule, grade, today = new Date()) {
  if (!GRADES.includes(grade)) throw new Error(`bad grade ${grade}`);
  const s = { ...schedule };
  const t = dayNumber(today);
  switch (grade) {
    case 'again':
      s.lapses += 1;
      s.interval = 1;
      s.ease = Math.max(MIN_EASE, s.ease - 0.2);
      break;
    case 'hard':
      s.interval = Math.max(1, Math.round(s.interval * 1.2));
      s.ease = Math.max(MIN_EASE, s.ease - 0.15);
      break;
    case 'good':
      s.interval = s.reps === 0 ? Math.max(3, s.interval) : Math.max(s.interval + 1, Math.round(s.interval * s.ease));
      break;
    case 'easy':
      s.interval = Math.max(s.interval + 2, Math.round(s.interval * s.ease * 1.3));
      s.ease = s.ease + 0.15;
      break;
  }
  s.interval = Math.min(MAX_INTERVAL, s.interval);
  s.reps += 1;
  s.due = t + s.interval;
  s.last = t;
  return s;
}

export const isDue = (schedule, today = new Date()) => !!schedule && schedule.due <= dayNumber(today);
export const daysUntilDue = (schedule, today = new Date()) => (schedule ? schedule.due - dayNumber(today) : Infinity);

/** Items due today (or overdue), most overdue first. `items` = [{id, srs}] */
export function dueQueue(items, today = new Date()) {
  const t = dayNumber(today);
  return items.filter((x) => x.srs && x.srs.due <= t).sort((a, b) => a.srs.due - b.srs.due);
}
