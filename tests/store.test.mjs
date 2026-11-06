// Arabic is the main language: new users and v1 users who never chose a language get Arabic.
import test from 'node:test';
import assert from 'node:assert/strict';

function fakeStorage(initial) {
  const m = new Map(Object.entries(initial || {}));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

test('new install defaults to Arabic', async () => {
  globalThis.localStorage = fakeStorage();
  const { getState } = await import('../js/core/store.js?case=new');
  assert.equal(getState().settings.lang, 'ar');
  assert.equal(getState().v, 2);
});

test('v1 user who never chose a language is switched to Arabic once', async () => {
  globalThis.localStorage = fakeStorage({ 'qurrah:v1': JSON.stringify({ v: 1, onboarded: true, settings: { lang: 'en' }, items: { s112: { status: 'known' } } }) });
  const { getState } = await import('../js/core/store.js?case=v1');
  assert.equal(getState().settings.lang, 'ar');
  assert.equal(getState().items.s112.status, 'known');
});

test('an explicit language choice is kept', async () => {
  globalThis.localStorage = fakeStorage({ 'qurrah:v1': JSON.stringify({ v: 2, onboarded: true, settings: { lang: 'he', langChosen: true } }) });
  const { getState, setSetting } = await import('../js/core/store.js?case=chosen');
  assert.equal(getState().settings.lang, 'he');
  setSetting('lang', 'en');
  assert.equal(getState().settings.langChosen, true);
  delete globalThis.localStorage;
});
