// "What to learn next" — one level at a time (pure).
import { CATALOG, LEVELS } from '../data/catalog.js';

/** Fraction of a level that must be known before suggesting the next level. */
export const ADVANCE_AT = 0.8;

/**
 * @param {Record<string,{status:string}>} items  user item states
 * @returns {{level:string, next:object|null, learning:object[], progress:Record<string,{known:number,total:number}>}}
 */
export function suggestNext(items) {
  const progress = {};
  for (const lv of LEVELS) {
    const all = CATALOG.filter((c) => c.level === lv);
    progress[lv] = { known: all.filter((c) => items[c.id]?.status === 'known').length, total: all.length };
  }
  const learning = CATALOG.filter((c) => items[c.id]?.status === 'learning');
  let level = LEVELS[LEVELS.length - 1];
  for (const lv of LEVELS) {
    if (progress[lv].known / progress[lv].total < ADVANCE_AT) { level = lv; break; }
  }
  // First not-yet-known item in the current level (catalog order = shortest first);
  // if the level is nearly done, finish it before moving on.
  const startIdx = LEVELS.indexOf(level);
  let next = null;
  for (const lv of LEVELS.slice(startIdx)) {
    next = CATALOG.find((c) => c.level === lv && !items[c.id]);
    if (next) break;
  }
  if (!next) next = CATALOG.find((c) => c.level !== 'foundation' && !items[c.id]) || null;
  return { level, next, learning, progress };
}
