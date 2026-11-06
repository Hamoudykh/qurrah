// Local-calendar date helpers (pure). A "day key" is YYYY-MM-DD in the device's local time.

export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDayKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days since 1970-01-01 for a local date (DST-safe because it uses UTC of the y/m/d). */
export function dayNumber(d = new Date()) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

export function dayNumberFromKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function keyFromDayNumber(n) {
  const d = new Date(n * 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Current streak: consecutive days with activity, ending today (or yesterday, so a streak
 * is not "lost" before the day is over). `activeKeys` is a Set of day keys.
 */
export function streak(activeKeys, today = new Date()) {
  let n = dayNumber(today);
  if (!activeKeys.has(keyFromDayNumber(n))) n -= 1;
  let count = 0;
  while (activeKeys.has(keyFromDayNumber(n))) { count++; n--; }
  return count;
}

export function longestStreak(activeKeys) {
  const nums = [...activeKeys].map(dayNumberFromKey).sort((a, b) => a - b);
  let best = 0, cur = 0, prev = null;
  for (const n of nums) {
    cur = prev !== null && n === prev + 1 ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = n;
  }
  return best;
}
