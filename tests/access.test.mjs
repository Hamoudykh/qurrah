import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ACCESS, normalizeCode, deriveHash, checkCode, isUnlocked, unlock } from '../js/core/access.js';

test('normalizeCode keeps digits and converts Arabic-Indic / Eastern Arabic digits', () => {
  assert.equal(normalizeCode('123 456'), '123456');
  assert.equal(normalizeCode('١٢٣٤٥٦'), '123456');
  assert.equal(normalizeCode('۱۲۳-۴۵۶'), '123456');
  assert.equal(normalizeCode('abc'), '');
  assert.equal(normalizeCode(null), '');
});

test('checkCode accepts the right code (any digit style) and rejects others', async () => {
  const salt = '00112233445566778899aabbccddeeff';
  const rec = { id: 't1', digits: 6, iterations: 1000, salt, hash: await deriveHash('246810', salt, 1000) };
  assert.equal(await checkCode('246810', rec), true);
  assert.equal(await checkCode('٢٤٦٨١٠', rec), true);
  assert.equal(await checkCode('246811', rec), false);
  assert.equal(await checkCode('24681', rec), false);
  assert.equal(await checkCode('', rec), false);
});

test('the stored record is a salted hash, not a code', async () => {
  assert.match(ACCESS.id, /^k\d+$/);
  assert.match(ACCESS.salt, /^[0-9a-f]{32}$/);
  assert.match(ACCESS.hash, /^[0-9a-f]{64}$/);
  assert.ok(ACCESS.iterations >= 100000);
  assert.ok(ACCESS.digits >= 4 && ACCESS.digits <= 12);
  assert.notEqual(ACCESS.hash, '0'.repeat(64), 'run scripts/make-access.mjs to set a code');
  const src = await readFile(new URL('../js/core/access.js', import.meta.url), 'utf8');
  assert.equal(src.split('\n').filter((l) => l.startsWith('export const ACCESS')).length, 1);
});

test('unlock is remembered per device and tied to the record id', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) };
  const rec = { ...ACCESS, id: 'k7' };
  assert.equal(isUnlocked(rec), false);
  unlock(rec);
  assert.equal(isUnlocked(rec), true);
  assert.equal(isUnlocked({ ...rec, id: 'k8' }), false, 'a new code id asks again');
  globalThis.localStorage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.equal(isUnlocked(rec), false);
  assert.doesNotThrow(() => unlock(rec));
  delete globalThis.localStorage;
});
