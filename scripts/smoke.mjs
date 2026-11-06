#!/usr/bin/env node
// End-to-end smoke test in a phone-sized Chromium against the LIVE Quran.com API.
// Usage: node scripts/smoke.mjs [--shots=docs/screenshots]
// Needs `playwright` resolvable. Honors HTTPS_PROXY if set.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const shotsArg = process.argv.find((a) => a.startsWith('--shots='));
const shots = shotsArg ? join(root, shotsArg.split('=')[1]) : null;
const PORT = 8093;
const BASE = `http://localhost:${PORT}/`;

const server = spawn(process.execPath, [join(root, 'scripts/serve.mjs'), String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
const browser = await chromium.launch({ proxy });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: shots ? 2 : 1, isMobile: true, hasTouch: true,
  geolocation: { latitude: 31.769, longitude: 35.2163 }, permissions: ['geolocation'], timezoneId: 'Asia/Jerusalem', locale: 'en-US',
});
const page = await context.newPage();
const errors = [];
const failed = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('requestfailed', (r) => { if (!/\.mp3/.test(r.url())) failed.push(`${r.failure()?.errorText} ${r.url()}`); });

let step = 0;
const results = [];
async function check(name, fn) {
  step++;
  try { await fn(); results.push(`ok   ${step}. ${name}`); }
  catch (e) { results.push(`FAIL ${step}. ${name}: ${e.message.split('\n')[0]}`); }
}
async function shot(name) {
  if (!shots) return;
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(shots, `${name}.png`) });
}
const go = async (hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(150); };
if (shots) await mkdir(shots, { recursive: true });

await check('welcome screen and onboarding', async () => {
  await page.goto(BASE);
  await page.waitForSelector('.welcome h2');
  await shot('01-welcome');
  for (const id of ['s112', 's113', 's114', 's108', 's103']) await page.check(`input[data-id="${id}"]`);
  await page.click('[data-act=start]');
  await page.waitForSelector('.hero .greet');
  if (await page.isVisible('#back')) throw new Error('back button visible on a tab root');
});

await check('today: daily verse loads Arabic + translation from the API', async () => {
  await page.waitForSelector('#daily .quran .w', { timeout: 20000 });
  const tr = await page.textContent('#daily .translation');
  if (!tr || tr.trim().length < 10) throw new Error('no translation');
  const ar = await page.textContent('#daily .quran');
  if (!/[؀-ۿ]/.test(ar)) throw new Error('no Arabic');
  await shot('02-today');
});

await check('learn: levels list with badges', async () => {
  await go('#/learn');
  await page.waitForSelector('.list .list-item');
  const n = await page.locator('.list .list-item').count();
  if (n < 40) throw new Error(`only ${n} items`);
  await page.click('[data-filter=easy]');
  const easy = await page.locator('.list .list-item').count();
  if (easy !== 11) throw new Error(`easy count ${easy}`);
  await shot('03-learn-easy');
});

await check('item page: Al-Ikhlas read view (Arabic, translation, al-Muyassar, source)', async () => {
  await go('#/item/s112');
  await page.waitForSelector('.ayah .quran .w', { timeout: 20000 });
  const ayahs = await page.locator('article.ayah').count();
  if (ayahs !== 4) throw new Error(`ayahs ${ayahs}`);
  if (!(await page.locator('.basmala').count())) throw new Error('no basmala header');
  const meaning = await page.locator('.meaning').count();
  if (!meaning) throw new Error('no muyassar');
  const src = await page.textContent('.source-line');
  if (!/Saheeh International/.test(src)) throw new Error('source line missing translation name');
  await page.locator('.ayah .quran .w').first().click();
  await page.waitForSelector('#wordbar:not([hidden]) .wb-m');
  await shot('04-item-read');
});

await check('audio: play ayah starts the player', async () => {
  await page.click('[data-act=play-ayah][data-n="1"]');
  await page.waitForSelector('#miniplayer:not([hidden])', { timeout: 10000 });
  await page.waitForFunction(() => document.querySelector('article.ayah.playing'), null, { timeout: 15000 });
  await page.click('#miniplayer [data-act=close]');
  if (await page.isVisible('#miniplayer')) throw new Error('mini player still visible after close');
});

await check('memorize tab: repeat controls + hide words', async () => {
  await page.click('[data-tab=memorize]');
  await page.waitForSelector('.mem-controls');
  await page.click('[data-hide=all]');
  const hidden = await page.locator('.w.hid').count();
  if (hidden < 10) throw new Error(`hidden ${hidden}`);
  await page.locator('.w.hid').first().click();
  await page.click('[data-ast=memorized][data-n="1"]');
  await shot('05-item-memorize');
});

await check('why it matters: references with sunnah.com links', async () => {
  await page.click('[data-tab=why]');
  const links = await page.locator('.refs a[href^="https://sunnah.com/"]').count();
  if (links < 3) throw new Error(`links ${links}`);
  await shot('06-item-why');
});

await check('memorize: ayah repeats N times (player loop)', async () => {
  await page.click('[data-tab=memorize]');
  await page.waitForSelector('.mem-controls');
  await page.click('[data-mset=repeat][data-val="3"]');
  await page.click('[data-mset=gap][data-val="off"]');
  await page.selectOption('select[data-range="1"]', '1');
  await page.click('[data-act=mem-play]');
  await page.waitForFunction(() => /repetition 2 of 3/.test(document.querySelector('#mem-counter')?.textContent || ''), null, { timeout: 30000 });
  await page.click('[data-act=mem-play]'); // pause
  await page.click('#miniplayer [data-act=close]');
});

await check('Ibn Kathir tafsir loads on demand', async () => {
  await page.click('[data-tab=read]');
  await page.waitForSelector('[data-act=ibn-kathir][data-n="1"]');
  await page.click('[data-act=ibn-kathir][data-n="1"]');
  await page.waitForSelector('.tafsir-slot[data-n="1"] .tafsir p', { timeout: 20000 });
});

await check('save offline caches all ayah audio', async () => {
  await page.click('[data-act=save]');
  await page.waitForFunction(() => /Saved offline/.test(document.querySelector('#save-label')?.textContent || ''), null, { timeout: 30000 });
  const n = await page.evaluate(async () => (await (await caches.open('qurrah-audio-v1')).keys()).length);
  if (n < 4) throw new Error(`audio cached ${n}`);
});

await check('custom passage: add Al-Baqarah 2:153 to learning', async () => {
  await go('#/learn');
  await page.waitForSelector('select[name=surah]');
  await page.selectOption('select[name=surah]', '2');
  await page.fill('input[name=from]', '153');
  await page.fill('input[name=to]', '153');
  await page.click('button[name=mode][value=learn]');
  await page.waitForSelector('.ayah-key', { timeout: 20000 });
  if ((await page.textContent('.ayah-key')).trim() !== '2:153') throw new Error('wrong ayah');
});

await check('review session grades a due item', async () => {
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('qurrah:v1'));
    s.items.s112.srs.due = Math.floor(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) / 86400000) - 1;
    localStorage.setItem('qurrah:v1', JSON.stringify(s));
  });
  await page.goto(`${BASE}#/review`);
  await page.reload(); // state is read from localStorage on load
  await page.waitForSelector('[data-grade=good]');
  await page.waitForSelector('#rv .quran', { timeout: 20000 });
  await page.click('[data-act=first]');
  await page.click('[data-grade=good]');
  await page.waitForSelector('text=Reviews complete');
});

await check('fallback: Tanzil source is used when Quran.com is unreachable', async () => {
  const fresh = await context.newPage();
  await fresh.route('https://api.quran.com/**', (r) => r.abort());
  await fresh.goto(`${BASE}#/item/s110`);
  await fresh.waitForSelector('.ayah .quran .w', { timeout: 25000 });
  const src = await fresh.textContent('.source-line');
  if (!/Tanzil/.test(src)) throw new Error(`source: ${src}`);
  const n = await fresh.locator('article.ayah').count();
  if (n !== 3) throw new Error(`ayahs ${n}`);
  const first = await fresh.textContent('article.ayah .quran');
  const basmala = await fresh.textContent('.basmala');
  if (first.includes(basmala.trim().slice(0, 6))) throw new Error('basmala not stripped from ayah 1');
  await fresh.close();
});

await check('passage page: Ayat al-Kursi (single long ayah)', async () => {
  await go('#/item/p2%3A255-255');
  await page.waitForSelector('.ayah .quran .w', { timeout: 20000 });
  const n = await page.locator('article.ayah').count();
  if (n !== 1) throw new Error(`ayahs ${n}`);
  const key = await page.textContent('.ayah-key');
  if (key.trim() !== '2:255') throw new Error(key);
});

await check('surah with grouped tafsir (An-Naba): group labels', async () => {
  await go('#/item/s78');
  await page.waitForSelector('.ayah .quran .w', { timeout: 25000 });
  const labels = await page.locator('.meaning-label').allTextContents();
  if (!labels.some((l) => /ayahs 21–26/.test(l))) throw new Error(`labels: ${labels.slice(0, 5).join(' | ')}`);
});

await check('prayer times: pick city offline list, method shown', async () => {
  await go('#/times');
  await page.waitForSelector('[data-act=city]');
  const val = await page.$eval('[data-act=city]', (s) => [...s.options].find((o) => o.textContent.startsWith('Jerusalem')).value);
  await page.selectOption('[data-act=city]', val);
  await page.waitForSelector('.times-list li');
  const items = await page.locator('.times-list li').count();
  if (items !== 6) throw new Error(`times ${items}`);
  const method = await page.textContent('.method-line');
  if (!/Method in use/.test(method)) throw new Error('no method line');
  await shot('07-times');
});

await check('qibla: bearing for Jerusalem ≈ 157°', async () => {
  await go('#/qibla');
  await page.waitForSelector('.bearing .big');
  const b = parseFloat(await page.textContent('.bearing .big'));
  if (Math.abs(b - 157.2) > 1) throw new Error(`bearing ${b}`);
  if ((await page.locator('.rose .tick').count()) !== 72) throw new Error('compass ticks not rendered');
  if ((await page.textContent('.qibla-card')).includes('<i class')) throw new Error('escaped markup visible');
  await shot('08-qibla');
});

await check('calendar export downloads an .ics file', async () => {
  await go('#/times');
  await page.waitForSelector('[data-act=ics]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=ics]')]);
  const path = await dl.path();
  const text = (await import('node:fs')).readFileSync(path, 'utf8');
  const events = (text.match(/BEGIN:VEVENT/g) || []).length;
  if (events !== 150) throw new Error(`events ${events}`);
});

await check('pray: plan rotates known surahs; khushu tips', async () => {
  await go('#/pray');
  await page.waitForSelector('.prayer-card');
  const cards = await page.locator('.prayer-card').count();
  if (cards !== 5) throw new Error(`cards ${cards}`);
  await shot('09-pray-plan');
  await page.click('[data-pray=fajr]');
  await page.waitForSelector('.prayer-card.done');
  await page.click('[data-tab=khushu]');
  await page.waitForSelector('.tip');
  await shot('10-khushu');
});

await check('me: progress shows 5 known', async () => {
  await go('#/me');
  await page.waitForSelector('.stat-num');
  const n = await page.textContent('.stat-main .stat-num');
  if (n.trim() !== '5') throw new Error(`known ${n}`);
  await shot('11-me');
});

await check('Arabic interface: RTL and Arabic labels', async () => {
  await go('#/settings');
  await page.click('[data-lang=ar]');
  await page.waitForFunction(() => document.documentElement.dir === 'rtl');
  await go('#/');
  await page.waitForSelector('#daily .quran .w', { timeout: 20000 });
  const tab = await page.textContent('.tabs a[data-tab=today] span:last-child');
  if (tab.trim() !== 'اليوم') throw new Error(tab);
  await shot('12-today-ar');
  await go('#/item/s112');
  await page.waitForSelector('.ayah .quran .w', { timeout: 20000 });
  await shot('13-item-ar');
});

await check('Hebrew interface: Hebrew translation shown', async () => {
  await go('#/settings');
  await page.click('[data-lang=he]');
  await page.waitForFunction(() => document.documentElement.lang === 'he');
  await go('#/item/s112');
  await page.waitForSelector('.translation[lang=he]', { timeout: 20000 });
  const he = await page.textContent('.translation[lang=he]');
  if (!/[֐-׿]/.test(he)) throw new Error('no Hebrew text');
  await shot('14-item-he');
});

await check('dark mode', async () => {
  await go('#/settings');
  await page.click('[data-lang=en]');
  await page.waitForFunction(() => document.documentElement.lang === 'en' && document.querySelector('[data-theme-set=dark]')?.textContent === 'Dark');
  await page.click('[data-theme-set=dark]');
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await go('#/item/s112');
  await page.waitForSelector('.ayah .quran .w', { timeout: 20000 });
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (bg !== 'rgb(14, 21, 19)') throw new Error(bg);
  await shot('15-item-dark');
});

await check('offline: an opened surah still loads after going offline + reload', async () => {
  await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready, null, { timeout: 10000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForSelector('.ayah .quran .w', { timeout: 20000 });
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector('.ayah .quran .w', { timeout: 20000 });
  const n = await page.locator('article.ayah').count();
  if (n !== 4) throw new Error(`ayahs offline ${n}`);
  await go('#/times');
  await page.waitForSelector('.times-list li');
  await context.setOffline(false);
});

await browser.close();
server.kill();

console.log(results.join('\n'));
const realErrors = errors.filter((e) => !/net::ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e));
if (realErrors.length) console.log('\nConsole errors:\n  ' + [...new Set(realErrors)].join('\n  '));
const realFailed = failed.filter((f) => !/ERR_INTERNET_DISCONNECTED|ERR_ABORTED/.test(f));
if (realFailed.length) console.log('\nFailed requests:\n  ' + [...new Set(realFailed)].join('\n  '));
const bad = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - bad}/${results.length} checks passed`);
process.exit(bad || realErrors.length ? 1 : 0);
