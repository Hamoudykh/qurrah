// Content safety checks: levels match the documented rule, references are well-formed,
// and no hand-written file contains Quranic (Uthmani) text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CATALOG, levelFor, itemFromId } from '../js/data/catalog.js';
import { COUNTS, CHAPTERS } from '../js/data/meta.js';
import { VIRTUES, GENERAL_VIRTUES } from '../js/data/virtues.js';
import { KHUSHU_TIPS, CHECKLIST } from '../js/data/khushu.js';
import { FIQH_NOTES } from '../js/data/fiqh.js';
import { DAILY_VERSES, dailyVerseFor } from '../js/data/daily.js';
import { COLLECTIONS, GRADES, refURL } from '../js/data/refs.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('catalog: every level matches the length rule computed from the API text', () => {
  for (const item of CATALOG) {
    assert.ok(COUNTS[item.id], `counts for ${item.id}`);
    if (item.level === 'foundation') continue;
    assert.equal(item.level, levelFor(COUNTS[item.id]), item.id);
  }
});

test('catalog: within each level, items are ordered shortest first', () => {
  for (const lv of ['easy', 'medium', 'hard']) {
    const words = CATALOG.filter((c) => c.level === lv).map((c) => COUNTS[c.id].words);
    assert.deepEqual(words, [...words].sort((a, b) => a - b), lv);
  }
});

test('catalog: passage ranges are inside their surah', () => {
  for (const item of CATALOG.filter((c) => c.type === 'passage')) {
    const ch = CHAPTERS[item.surah - 1];
    assert.ok(item.from >= 1 && item.to <= ch.verses && item.from <= item.to, item.id);
    assert.ok(item.names.en && item.names.ar && item.names.he, item.id);
  }
  assert.equal(itemFromId('p2:255-255').id, 'p2:255-255');
  assert.equal(itemFromId('p9:1-5').custom, true);
  assert.equal(itemFromId('bad'), null);
});

function* allRefs() {
  for (const [id, pts] of Object.entries(VIRTUES)) for (const p of pts) for (const r of p.refs || []) yield [id, r];
  for (const p of GENERAL_VIRTUES) for (const r of p.refs) yield ['general', r];
  for (const t of KHUSHU_TIPS) for (const r of t.refs) yield [t.id, r];
  for (const f of FIQH_NOTES) for (const r of f.refs) yield [f.id, r];
}

test('references: every hadith ref has a known collection, number and grading', () => {
  for (const [where, r] of allRefs()) {
    if (r.kind === 'hadith') {
      assert.ok(COLLECTIONS[r.c], `${where}: collection ${r.c}`);
      assert.match(r.n, /^\d+$/, `${where}: number`);
      assert.ok(GRADES[r.grade], `${where}: grade for ${r.c}:${r.n}`);
      assert.ok(refURL(r).startsWith('https://sunnah.com/'));
    } else if (r.kind === 'quran') {
      assert.match(r.key, /^\d+:\d+(-\d+)?$/);
    } else {
      assert.equal(r.kind, 'book');
      assert.ok(r.title.en && GRADES[r.grade], where);
    }
  }
});

test('virtues: every catalog item has a "why it matters" entry in en and ar', () => {
  for (const item of CATALOG) {
    assert.ok(VIRTUES[item.id]?.length, item.id);
    for (const p of VIRTUES[item.id]) assert.ok(p.text.en && p.text.ar, item.id);
  }
  for (const t of KHUSHU_TIPS) for (const k of ['title', 'body', 'practice']) assert.ok(t[k].en && t[k].ar && t[k].he, `${t.id}.${k}`);
  for (const c of CHECKLIST) assert.ok(KHUSHU_TIPS.find((t) => t.id === c.tip), c.id);
});

test('daily verses: 40 entries, valid ranges, reflections in 3 languages', () => {
  assert.equal(DAILY_VERSES.length, 40);
  assert.equal(new Set(DAILY_VERSES.map((d) => d.key)).size, 40);
  for (const d of DAILY_VERSES) {
    const ch = CHAPTERS[d.surah - 1];
    assert.ok(d.from >= 1 && d.to <= ch.verses && d.to - d.from <= 1, d.key);
    assert.ok(d.reflection.en && d.reflection.ar && d.reflection.he, d.key);
  }
  assert.ok(dailyVerseFor(new Date(2026, 0, 1)));
});

// Code points that only occur in Quranic Uthmani script (alef wasla, small high/low Quranic
// marks, rub el hizb, sajdah sign, etc.). If any appear in a hand-written source file, someone
// typed or pasted Quran text instead of loading it from the API.
const UTHMANI_ONLY = /[\u0671\u06D6-\u06ED\u08D3-\u08FF]/;

async function* sourceFiles(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!['node_modules', 'vendor', 'fonts', 'icons', '.git'].includes(e.name)) yield* sourceFiles(p); }
    else if (/\.(js|mjs|html|json|webmanifest|css)$/.test(e.name)) yield p;
  }
}

test('no Quran text is hand-written anywhere in the source', async () => {
  for await (const f of sourceFiles(root)) {
    if (f.endsWith('content.test.mjs')) continue;
    const text = await readFile(f, 'utf8');
    const m = text.match(UTHMANI_ONLY);
    assert.equal(m, null, `${f} contains Uthmani-only character U+${m?.[0].codePointAt(0).toString(16)}`);
  }
});
