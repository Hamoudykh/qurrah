// "My people": several people, each with a few places (home / study / work), so everyone can
// see prayer times where each person is. Stored only on the device. A private setup link
// (#/setup/<code>) can add the same people on another phone; the part after '#' is never
// sent to any server.

export const ROLES = ['home', 'study', 'work', 'other'];
const ROLE_CODE = { home: 'h', study: 's', work: 'w', other: 'o' };
const CODE_ROLE = { h: 'home', s: 'study', w: 'work', o: 'other' };
const MAX_PEOPLE = 8, MAX_PLACES = 6, MAX_NAME = 40;

let seq = 0;
export const newId = (p) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---- base64url (UTF-8 safe, works in browsers and Node) ----
function toB64url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Compact code for people. Places from the city list are stored by id; others by coordinates. */
export function encodeSetup(people) {
  const p = people.map((x) => ({
    n: x.name,
    pl: x.places.map((pl) => (pl.cityId
      ? { c: pl.cityId, r: ROLE_CODE[pl.role] || 'o' }
      : { n: typeof pl.label === 'string' ? pl.label : pl.label?.en, a: +pl.lat.toFixed(4), o: +pl.lon.toFixed(4), z: pl.tz, r: ROLE_CODE[pl.role] || 'o' })),
  }));
  return toB64url(JSON.stringify({ v: 1, p }));
}

const cleanName = (s) => String(s ?? '').replace(/[\u0000-\u001F\u007F<>]/g, '').trim().slice(0, MAX_NAME);
const validTz = (z) => typeof z === 'string' && /^[A-Za-z_]+(\/[A-Za-z0-9_+\-]+){1,2}$/.test(z);

/**
 * Decode and strictly validate a setup code (untrusted input).
 * @param {string} code
 * @param {Array} cities  the built-in city list (to resolve ids)
 * @returns {Array<{name, places:[{cityId?, label, role, lat, lon, tz, country?}]}>}
 */
export function decodeSetup(code, cities) {
  if (typeof code !== 'string' || code.length > 4000 || !/^[A-Za-z0-9_-]+$/.test(code)) throw new Error('bad code');
  const data = JSON.parse(fromB64url(code));
  if (data?.v !== 1 || !Array.isArray(data.p) || !data.p.length || data.p.length > MAX_PEOPLE) throw new Error('bad data');
  const byId = new Map(cities.map((c) => [c.id, c]));
  return data.p.map((x) => {
    const name = cleanName(x?.n);
    if (!name || !Array.isArray(x.pl) || !x.pl.length || x.pl.length > MAX_PLACES) throw new Error('bad person');
    const places = x.pl.map((pl) => {
      const role = CODE_ROLE[pl?.r] || 'other';
      if (pl?.c != null) {
        const c = byId.get(Number(pl.c));
        if (!c) throw new Error('unknown city');
        return { cityId: c.id, label: c.name, role, lat: c.lat, lon: c.lon, tz: c.tz, country: c.country };
      }
      const lat = Number(pl?.a), lon = Number(pl?.o);
      if (!(Math.abs(lat) <= 90 && Math.abs(lon) <= 180) || !validTz(pl?.z)) throw new Error('bad place');
      return { label: cleanName(pl.n) || `${lat.toFixed(2)}, ${lon.toFixed(2)}`, role, lat, lon, tz: pl.z };
    });
    return { name, places };
  });
}

/** Give imported people/places ids and a default current place (home first). */
export function withIds(people) {
  return people.map((p) => {
    const places = p.places.map((pl) => ({ id: newId('pl'), ...pl }));
    const home = places.find((pl) => pl.role === 'home') || places[0];
    return { id: newId('p'), name: p.name, places, current: home.id };
  });
}

/** Turn a place into the app's prayer location object. */
export function placeToLocation(pl, labelText) {
  return { mode: 'city', lat: pl.lat, lon: pl.lon, tz: pl.tz, label: labelText, country: pl.country || '' };
}
