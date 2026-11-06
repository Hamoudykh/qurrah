import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

test('service worker precaches every app file, and every listed file exists', async () => {
  const sw = await readFile(join(root, 'sw.js'), 'utf8');
  const shellSrc = sw.slice(sw.indexOf('const SHELL = ['), sw.indexOf('];', sw.indexOf('const SHELL = [')));
  const listed = new Set([...shellSrc.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean));
  const needed = [];
  for (const dir of ['js', 'css', 'vendor', 'fonts', 'icons']) {
    for (const f of await walk(join(root, dir))) {
      const rel = relative(root, f).split('\\').join('/');
      if (/\.(js|css|woff2|png|svg)$/.test(rel)) needed.push(rel);
    }
  }
  needed.push('index.html', 'manifest.webmanifest');
  const missing = needed.filter((f) => !listed.has(f));
  assert.deepEqual(missing, [], 'files missing from sw.js SHELL');
  for (const f of listed) await access(join(root, f));
});

test('manifest is valid and references existing icons', async () => {
  const m = JSON.parse(await readFile(join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.display, 'standalone');
  assert.ok(m.icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable'));
  for (const i of m.icons) await access(join(root, i.src));
});
