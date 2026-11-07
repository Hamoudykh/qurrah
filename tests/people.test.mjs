import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeSetup, decodeSetup, withIds, extractSetupCode } from '../js/logic/people.js';
import { CITIES } from '../js/data/cities.js';

const city = (en) => CITIES.find((c) => c.name.en === en);

test('setup link round-trips people and places (cities by id, custom by coordinates)', () => {
  const haifa = city('Haifa'), tamra = city('Tamra');
  assert.ok(haifa && tamra && city('Karmiel') && city('Rosh HaAyin') && city('Beersheba'));
  const people = [
    { name: 'أ', places: [{ cityId: haifa.id, role: 'home', lat: haifa.lat, lon: haifa.lon, tz: haifa.tz }, { label: 'Custom', role: 'work', lat: 32.1, lon: 34.95, tz: 'Asia/Jerusalem' }] },
    { name: 'ב', places: [{ cityId: tamra.id, role: 'study', lat: tamra.lat, lon: tamra.lon, tz: tamra.tz }] },
  ];
  const code = encodeSetup(people);
  assert.match(code, /^[A-Za-z0-9_-]+$/);
  const back = decodeSetup(code, CITIES);
  assert.equal(back.length, 2);
  assert.equal(back[0].name, 'أ');
  assert.deepEqual(back[0].places[0].label, haifa.name);
  assert.equal(back[0].places[1].label, 'Custom');
  assert.equal(back[1].places[0].role, 'study');
  const ided = withIds(back);
  assert.ok(ided[0].id && ided[0].places[0].id);
  assert.equal(ided[0].current, ided[0].places[0].id); // home first
});

test('setup link rejects malformed or hostile input', () => {
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  assert.throws(() => decodeSetup('not valid!', CITIES));
  assert.throws(() => decodeSetup(enc({ v: 2, p: [] }), CITIES));
  assert.throws(() => decodeSetup(enc({ v: 1, p: [{ n: 'x', pl: [{ c: 999999999, r: 'h' }] }] }), CITIES));
  assert.throws(() => decodeSetup(enc({ v: 1, p: [{ n: 'x', pl: [{ a: 99, o: 0, z: 'Asia/Jerusalem' }] }] }), CITIES));
  assert.throws(() => decodeSetup(enc({ v: 1, p: [{ n: 'x', pl: [{ a: 1, o: 1, z: 'bad zone;' }] }] }), CITIES));
  const cleaned = decodeSetup(enc({ v: 1, p: [{ n: '<b>Hi</b>', pl: [{ a: 1, o: 1, z: 'Asia/Jerusalem', r: 'zz' }] }] }), CITIES);
  assert.equal(cleaned[0].name, 'bHi/b');
  assert.equal(cleaned[0].places[0].role, 'other');
});

test('a setup code is found in a pasted link, a whole message, or on its own', () => {
  const c = city('Tamra');
  const code = encodeSetup([{ name: 'X', places: [{ cityId: c.id, role: 'home', lat: c.lat, lon: c.lon, tz: c.tz }] }]);
  const url = `https://example.github.io/qurrah/#/setup/${code}`;
  assert.equal(extractSetupCode(url), code);
  assert.equal(extractSetupCode(`افتح هذا الرابط لإضافة الأشخاص ${url} شكرًا`), code);
  assert.equal(extractSetupCode(`  ${code}\n`), code);
  assert.equal(decodeSetup(extractSetupCode(url), CITIES)[0].name, 'X');
  assert.equal(extractSetupCode('hello there'), null);
  assert.equal(extractSetupCode(''), null);
  assert.equal(extractSetupCode(null), null);
});
