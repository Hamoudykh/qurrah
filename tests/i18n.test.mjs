import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import en from '../js/i18n/en.js';
import ar from '../js/i18n/ar.js';
import he from '../js/i18n/he.js';
import { METHODS } from '../js/logic/prayer.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function jsFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await jsFiles(p)));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

// Keys built dynamically in templates, expanded to their possible values.
const DYNAMIC = {
  gap_: ['off', 'short', 'echo'],
  grade_: ['again', 'hard', 'good', 'easy'],
  hide_: ['none', 'first', 'alternate', 'all'],
  highLat_: ['middle', 'seventh', 'twilight'],
  level_: ['easy', 'medium', 'hard'],
  levelRule_: ['easy', 'medium', 'hard'],
  method_: METHODS,
  prayer_: ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'],
  sunnah_: ['fajrSunnah', 'witr'],
  tab_: ['read', 'memorize', 'why', 'plan', 'recite', 'khushu'],
  theme_: ['system', 'light', 'dark'],
  tr_: ['auto', 'en', 'he', 'both', 'off'],
  role_: ['home', 'study', 'work', 'other'],
};

test('every UI key used in code exists in English', async () => {
  const used = new Set();
  for (const f of await jsFiles(join(root, 'js'))) {
    const src = await readFile(f, 'utf8');
    for (const m of src.matchAll(/\bt\(['`]([A-Za-z0-9_]+)(\$\{)?/g)) {
      if (m[2]) for (const v of DYNAMIC[m[1]] || []) used.add(m[1] + v);
      else used.add(m[1]);
    }
  }
  const html = await readFile(join(root, 'index.html'), 'utf8');
  for (const m of html.matchAll(/data-i18n(?:-label)?="([A-Za-z]+)"/g)) used.add(m[1]);
  const missing = [...used].filter((k) => !(k in en));
  assert.deepEqual(missing, []);
});

const PLURAL_RE = /_(zero|one|two|few|many|other)$/;
// A key is a plural form only if its base key exists (so e.g. 'role_other' is an ordinary key).
const PLURAL = { test: (k) => PLURAL_RE.test(k) && k.replace(PLURAL_RE, '') in en };

test('Arabic and Hebrew have exactly the English keys (plus plural forms)', () => {
  for (const [name, d] of [['ar', ar], ['he', he]]) {
    const missing = Object.keys(en).filter((k) => !PLURAL.test(k) && !(k in d));
    const extra = Object.keys(d).filter((k) => !(k in en) && !(PLURAL.test(k) && k.replace(PLURAL_RE, '') in en));
    assert.deepEqual({ missing, extra }, { missing: [], extra: [] }, name);
  }
});

test('placeholders match across languages', () => {
  const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
  for (const k of Object.keys(en)) {
    if (PLURAL.test(k)) continue;
    assert.equal(ph(ar[k]), ph(en[k]), `ar.${k}`);
    assert.equal(ph(he[k]), ph(en[k]), `he.${k}`);
  }
  // Plural forms may drop {n} (e.g. "one ayah") but must not introduce new placeholders.
  for (const d of [en, ar, he]) {
    for (const k of Object.keys(d).filter((x) => PLURAL.test(x))) {
      const base = en[k.replace(PLURAL_RE, '')];
      assert.ok(base, k);
      for (const p of ph(d[k]).split(',').filter(Boolean)) assert.ok(ph(base).split(',').includes(p), `${k}: {${p}}`);
    }
  }
});

test('plural selection picks the right form', async () => {
  const g = globalThis;
  g.document = { documentElement: {} };
  const { setLang, t } = await import('../js/core/i18n.js');
  setLang('en');
  assert.equal(t('ayahsN', { count: 1, n: '1' }), '1 ayah');
  assert.equal(t('ayahsN', { count: 4, n: '4' }), '4 ayahs');
  setLang('ar');
  assert.equal(t('ayahsN', { count: 1, n: '1' }), 'آية واحدة');
  assert.equal(t('ayahsN', { count: 2, n: '2' }), 'آيتان');
  assert.equal(t('ayahsN', { count: 5, n: '5' }), '5 آيات');
  assert.equal(t('ayahsN', { count: 11, n: '11' }), '11 آية');
  setLang('he');
  assert.equal(t('bestStreak', { count: 2, n: '2' }), 'הכי טוב: יומיים');
  assert.equal(t('bestStreak', { count: 7, n: '7' }), 'הכי טוב: 7 ימים');
  delete g.document;
});
