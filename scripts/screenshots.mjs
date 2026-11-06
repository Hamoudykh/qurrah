#!/usr/bin/env node
// Regenerates docs/screenshots (Arabic UI, light + dark, plus English) against the live API.
// Usage: node scripts/screenshots.mjs   (needs playwright; honors HTTPS_PROXY)
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = require('playwright');
import { mkdir, rm } from 'node:fs/promises';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'screenshots');
await rm(OUT, { recursive: true, force: true }); await mkdir(OUT, { recursive: true });
const server = spawn(process.execPath, [join(ROOT, 'scripts/serve.mjs'), '8097'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 600));
const browser = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost' } } : {});
const dn = Math.floor(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) / 86400000);
const dk = new Date().toISOString().slice(0, 10);
const state = { v: 2, onboarded: true, settings: { lang: 'ar', prayer: { location: { mode: 'city', lat: 31.769, lon: 35.2163, tz: 'Asia/Jerusalem', label: 'القدس', country: 'IL' } } },
  items: Object.fromEntries([['s112',0],['s113',1],['s114',2],['s108',3],['s103',4]].map(([id,i]) => [id, { status: 'known', ayahs: {}, srs: { interval: 7, ease: 2.5, reps: 1, lapses: 0, due: dn + 2 + i } }]).concat([['s110', { status: 'learning', ayahs: { 1: 'memorized' } }], ['s106', { status: 'known', ayahs: {}, srs: { interval: 3, ease: 2.5, reps: 1, lapses: 0, due: dn - 1 } }]])),
  activity: { [dk]: { studied: 2 } }, prayed: { [dk]: { fajr: true } } };
const errors = [];
async function shoot(theme, list) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'Asia/Jerusalem', colorScheme: theme });
  await ctx.addInitScript((s) => { if (!localStorage.getItem('qurrah:v1')) localStorage.setItem('qurrah:v1', JSON.stringify(s)); }, state);
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  for (const [name, hash, waitSel, action] of list) {
    await page.goto(`http://localhost:8097/${hash}`);
    if (waitSel) await page.waitForSelector(waitSel, { timeout: 25000 }).catch(e => errors.push(`${name}: ${e.message.split('\n')[0]}`));
    if (action) await action(page);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${name}.png` });
  }
  await ctx.close();
}
await shoot('light', [
  ['a-today', '#/', '#daily .quran .w'],
  ['b-learn', '#/learn', '.tile'],
  ['c-item-read', '#/item/s110', '.ayah .quran .w'],
  ['d-memorize', '#/item/s110?tab=memorize', '.focus-card .quran .w'],
  ['e-why', '#/item/s112?tab=why', '.virtue'],
  ['f-pray', '#/pray', '.prayer-card'],
  ['g-times', '#/times', '.timeline li'],
  ['h-me', '#/me', '.constellation'],
  ['i-khushu', '#/pray?tab=khushu', '.tip'],
  ['j-today-scrolled', '#/', '#daily .quran .w', async (p) => { await p.evaluate(() => window.scrollTo(0, 560)); }],
]);
await shoot('dark', [
  ['k-today-dark', '#/', '#daily .quran .w'],
  ['l-item-dark', '#/item/s110?tab=memorize', '.focus-card .quran .w'],
]);
// English UI (two screens)
state.settings.lang = 'en'; state.settings.langChosen = true;
await shoot('light', [['o-today-en', '#/', '#daily .quran .w'], ['p-learn-en', '#/learn', '.tile']]);
// onboarding (fresh state)
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://localhost:8097/'); await page.waitForSelector('.onb-hero'); await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/m-onb-0.png` });
await page.click('[data-go="1"]'); await page.waitForSelector('.pick'); await page.click('[data-pick="s112"]'); await page.click('[data-pick="s113"]'); await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/n-onb-1.png` });
await browser.close(); server.kill();
console.log('wrote', OUT, 'errors:', JSON.stringify([...new Set(errors)], null, 1));
