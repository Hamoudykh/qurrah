#!/usr/bin/env node
// Renders the PNG app icons from the SVG sources using Playwright's Chromium.
// Usage: node scripts/build-icons.mjs   (requires `playwright` to be resolvable)
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const icons = join(root, 'icons');

const jobs = [
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512],
  ['icon-maskable.svg', 'apple-touch-icon.png', 180],
  ['icon-mono.svg', 'badge-96.png', 96, true],
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [src, out, size, mono] of jobs) {
  let svg = await readFile(join(icons, src), 'utf8');
  if (mono) svg = svg.replaceAll('#000', '#FFFFFF');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">
    <img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" style="width:${size}px;height:${size}px;display:block"></body></html>`);
  await page.waitForFunction(() => document.images[0].complete);
  await page.screenshot({ path: join(icons, out), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('wrote', out);
}
await browser.close();
