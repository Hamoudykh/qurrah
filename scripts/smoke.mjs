#!/usr/bin/env node
// End-to-end smoke test in a phone-sized Chromium against the LIVE Quran.com API.
// Usage: QURRAH_CODE=<access code> node scripts/smoke.mjs
// Without QURRAH_CODE the code-entry checks are skipped and the access screen is bypassed.
// Needs `playwright` resolvable. Honors HTTPS_PROXY if set.
// (Screenshots for the docs are made by scripts/screenshots.mjs.)
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { encodeSetup } from '../js/logic/people.js';
import { CITIES } from '../js/data/cities.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8093;
const BASE = `http://localhost:${PORT}/`;

const server = spawn(process.execPath, [join(root, 'scripts/serve.mjs'), String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
const browser = await chromium.launch({ proxy });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
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
const go = async (hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(200); };
const dayNum = () => Math.floor(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) / 86400000);

const CODE = process.env.QURRAH_CODE || '';
const arabicDigits = (s) => [...s].map((d) => String.fromCharCode(0x660 + Number(d))).join('');
const skip = (name) => { step++; results.push(`skip ${step}. ${name} (set QURRAH_CODE)`); };

await check('first launch: access code screen, Arabic, right-to-left, no tabs', async () => {
  await page.goto(BASE);
  await page.waitForSelector('.gate #gate-code');
  const { lang, dir } = await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir }));
  if (lang !== 'ar' || dir !== 'rtl') throw new Error(`${lang}/${dir}`);
  if (await page.isVisible('.tabs')) throw new Error('tabs visible');
  if ((await page.textContent('#gate-go')).trim() !== 'دخول') throw new Error('button not Arabic');
});

await check('access code: a wrong code is refused and nothing opens', async () => {
  await page.fill('#gate-code', CODE === '000000' ? '111111' : '000000');
  await page.waitForFunction(() => document.querySelector('#gate-msg.bad')?.textContent.length > 0);
  if (await page.evaluate(() => localStorage.getItem('qurrah:access'))) throw new Error('unlocked by a wrong code');
  if (!(await page.isVisible('.gate'))) throw new Error('gate gone');
});

if (CODE) {
  await check('access code: the right code typed in Arabic digits opens the welcome screen', async () => {
    await page.fill('#gate-code', arabicDigits(CODE));
    await page.waitForSelector('[data-go="1"]', { timeout: 10000 });
    if ((await page.textContent('[data-go="1"]')).trim() !== 'لنبدأ') throw new Error('welcome button not Arabic');
  });
  await check('access code: asked only once (reload goes straight in)', async () => {
    await page.reload();
    await page.waitForSelector('[data-go="1"]');
    if (await page.locator('.gate').count()) throw new Error('asked again');
  });
} else {
  skip('access code: the right code opens the welcome screen');
  skip('access code: asked only once');
  await page.evaluate(async () => { const { ACCESS } = await import('./js/core/access.js'); localStorage.setItem('qurrah:access', ACCESS.id); });
  await page.reload();
  await page.waitForSelector('[data-go="1"]');
}

await check('onboarding: switch to English, pick 5 known surahs, finish', async () => {
  await page.click('[data-lang=en]');
  await page.waitForFunction(() => document.documentElement.lang === 'en' && document.documentElement.dir === 'ltr');
  await page.click('[data-go="1"]');
  await page.waitForSelector('.pick');
  for (const id of ['s112', 's113', 's114', 's108', 's103']) await page.click(`[data-pick="${id}"]`);
  if (!/5/.test(await page.textContent('#next1'))) throw new Error('counter');
  await page.click('[data-go="2"]');
  await page.click('[data-act=start]');
  await page.waitForSelector('#hero.sky');
  if (await page.isVisible('#back')) throw new Error('back button visible on a tab root');
});

await check('today: sky hero, quick tiles, daily verse from the API', async () => {
  await page.waitForSelector('#daily .quran .w', { timeout: 25000 });
  const tr = await page.textContent('#daily .translation');
  if (!tr || tr.trim().length < 10) throw new Error('no translation');
  if ((await page.locator('.q-tile').count()) !== 4) throw new Error('quick tiles');
  if (!(await page.locator('#daily .ayah-end svg').count())) throw new Error('ayah medallion');
});

await check('learn: journey rings, 44 tiles, level filter', async () => {
  await go('#/learn');
  await page.waitForSelector('.tiles .tile');
  const n = await page.locator('.tiles .tile').count();
  if (n !== 44) throw new Error(`tiles ${n}`);
  await page.click('.level-node[data-filter=easy]');
  const easy = await page.locator('.tiles .tile').count();
  if (easy !== 11) throw new Error(`easy count ${easy}`);
  if ((await page.locator('.tile .ring-fill').count()) !== 11) throw new Error('rings');
});

await check('surah page: banner, Arabic, translation, al-Muyassar, source, word meaning', async () => {
  await go('#/item/s112');
  await page.waitForSelector('.ayah .quran .w', { timeout: 20000 });
  if ((await page.locator('article.ayah').count()) !== 4) throw new Error('ayahs');
  if (!(await page.locator('.surah-banner .surah-title').count())) throw new Error('banner');
  if (!(await page.locator('.basmala').count())) throw new Error('no basmala header');
  if (!(await page.locator('.meaning').count())) throw new Error('no muyassar');
  if (!/Saheeh International/.test(await page.textContent('.source-line'))) throw new Error('source line');
  await page.locator('.ayah .quran .w').first().click();
  await page.waitForSelector('#wordbar:not([hidden]) .wb-m');
});

await check('audio: play ayah starts the player', async () => {
  await page.click('[data-act=play-ayah][data-n="1"]');
  await page.waitForSelector('#miniplayer:not([hidden])', { timeout: 10000 });
  await page.waitForFunction(() => document.querySelector('article.ayah.playing'), null, { timeout: 15000 });
  await page.click('#miniplayer [data-act=close]');
  if (await page.isVisible('#miniplayer')) throw new Error('mini player still visible after close');
});

await check('memorize focus mode: dots, mark memorized moves to the next ayah', async () => {
  await page.click('[data-tab=memorize]');
  await page.waitForSelector('.focus-card .quran .w');
  if ((await page.locator('.ayah-dots button').count()) !== 4) throw new Error('dots');
  await page.click('[data-ast=memorized]');
  await page.waitForFunction(() => document.querySelector('.focus-card')?.dataset.n === '2', null, { timeout: 4000 });
  if (!(await page.locator('.ayah-dots button.memorized').count())) throw new Error('dot status');
});

await check('memorize: hide words, swipe/arrows', async () => {
  await page.click('[data-hide=all]');
  if ((await page.locator('.focus-card .w.hid').count()) < 2) throw new Error('hidden');
  await page.locator('.focus-card .w.hid').first().click();
  await page.click('[data-act=focus-next]');
  await page.waitForFunction(() => document.querySelector('.focus-card')?.dataset.n === '3');
  await page.click('[data-act=focus-prev]');
  await page.waitForFunction(() => document.querySelector('.focus-card')?.dataset.n === '2');
});

await check('memorize: repeat ring counts repetitions (player loop)', async () => {
  await page.click('.mem-settings summary');
  await page.click('[data-mset=repeat][data-val="3"]');
  await page.click('[data-mset=gap][data-val="off"]');
  await page.click('.repeat-ring');
  await page.waitForFunction(() => /2 \/ 3/.test(document.querySelector('#rr-count')?.textContent || ''), null, { timeout: 30000 });
  await page.click('.repeat-ring'); // pause
  await page.click('#miniplayer [data-act=close]');
});

await check('why it matters: references with sunnah.com links', async () => {
  await page.click('[data-tab=why]');
  const links = await page.locator('.refs a[href^="https://sunnah.com/"]').count();
  if (links < 3) throw new Error(`links ${links}`);
});

await check('Ibn Kathir tafsir loads on demand', async () => {
  await page.click('[data-tab=read]');
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
  await page.click('.custom-card summary');
  await page.selectOption('select[name=surah]', '2');
  await page.fill('input[name=from]', '153');
  await page.fill('input[name=to]', '153');
  await page.click('button[name=mode][value=learn]');
  await page.waitForSelector('.ayah-key', { timeout: 20000 });
  if ((await page.textContent('.ayah-key')).trim() !== '2:153') throw new Error('wrong ayah');
});

await check('review session grades a due item', async () => {
  await page.evaluate((dn) => {
    const s = JSON.parse(localStorage.getItem('qurrah:v1'));
    s.items.s112.srs.due = dn - 1;
    localStorage.setItem('qurrah:v1', JSON.stringify(s));
  }, dayNum());
  await page.goto(`${BASE}#/review`);
  await page.reload();
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
  if (!/Tanzil/.test(await fresh.textContent('.source-line'))) throw new Error('source');
  if ((await fresh.locator('article.ayah').count()) !== 3) throw new Error('ayahs');
  const first = await fresh.textContent('article.ayah .quran');
  const basmala = await fresh.textContent('.basmala');
  if (first.includes(basmala.trim().slice(0, 6))) throw new Error('basmala not stripped from ayah 1');
  await fresh.close();
});

await check('passage page: Ayat al-Kursi (single long ayah)', async () => {
  await go('#/item/p2%3A255-255');
  await page.waitForSelector('.ayah .quran .w', { timeout: 20000 });
  if ((await page.locator('article.ayah').count()) !== 1) throw new Error('ayahs');
  if ((await page.textContent('.ayah-key')).trim() !== '2:255') throw new Error('key');
});

await check('surah with grouped tafsir (An-Naba): group labels', async () => {
  await go('#/item/s78');
  await page.waitForSelector('.ayah .quran .w', { timeout: 25000 });
  const labels = await page.locator('.meaning-label').allTextContents();
  if (!labels.some((l) => /ayahs 21–26/.test(l))) throw new Error(`labels: ${labels.slice(0, 5).join(' | ')}`);
});

await check('prayer times: pick city offline list, timeline, method shown', async () => {
  await go('#/times');
  await page.waitForSelector('[data-act=city]');
  const val = await page.$eval('[data-act=city]', (s) => [...s.options].find((o) => o.textContent.startsWith('Jerusalem')).value);
  await page.selectOption('[data-act=city]', val);
  await page.waitForSelector('.timeline li');
  if ((await page.locator('.timeline li').count()) !== 6) throw new Error('timeline');
  if (!/Method in use/.test(await page.textContent('.method-line'))) throw new Error('no method line');
  if (!(await page.locator('.times-hero.sky').count())) throw new Error('sky header');
});

await check('qibla: bearing for Jerusalem ≈ 157°', async () => {
  await go('#/qibla');
  await page.waitForSelector('.bearing .big');
  const b = parseFloat(await page.textContent('.bearing .big'));
  if (Math.abs(b - 157.2) > 1) throw new Error(`bearing ${b}`);
  if ((await page.locator('.rose .tick').count()) !== 72) throw new Error('compass ticks not rendered');
});

await check('calendar export downloads an .ics file', async () => {
  await go('#/times');
  await page.waitForSelector('[data-act=ics]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=ics]')]);
  const events = (readFileSync(await dl.path(), 'utf8').match(/BEGIN:VEVENT/g) || []).length;
  if (events !== 150) throw new Error(`events ${events}`);
});

await check('today hero shows next prayer and the five-prayer strip', async () => {
  await go('#/');
  await page.waitForSelector('#hero .np-name');
  if ((await page.locator('#hero .p-chip').count()) !== 5) throw new Error('strip');
});

await check('pray: plan cards, mark prayed, khushu tips', async () => {
  await go('#/pray');
  await page.waitForSelector('.prayer-card');
  if ((await page.locator('.prayer-card').count()) !== 5) throw new Error('cards');
  await page.click('[data-pray=fajr]');
  await page.waitForSelector('.prayer-card.done');
  await page.click('[data-tab=khushu]');
  await page.waitForSelector('.tip');
});

await check('me: ring shows 5 known; constellation has 44 stars', async () => {
  await go('#/me');
  await page.waitForSelector('.constellation');
  if ((await page.textContent('.me-head .ring-inner b')).trim() !== '5') throw new Error('known');
  if ((await page.locator('.constellation .st').count()) !== 44) throw new Error('stars');
  if ((await page.locator('.constellation .st.known').count()) !== 5) throw new Error('known stars');
});

await check('people & places: setup link adds people, each place shows its prayer times', async () => {
  const pl = (en, role) => { const c = CITIES.find((x) => x.name.en === en); return { cityId: c.id, role, lat: c.lat, lon: c.lon, tz: c.tz }; };
  const code = encodeSetup([
    { name: 'Person A', places: [pl('Haifa', 'home'), pl('Karmiel', 'study'), pl('Rosh HaAyin', 'work')] },
    { name: 'Person B', places: [pl('Tamra', 'home'), pl('Beersheba', 'study')] },
  ]);
  await page.goto(`${BASE}#/setup/${code}`);
  await page.waitForSelector('.setup-person');
  if ((await page.locator('.setup-person').count()) !== 2) throw new Error('preview');
  await page.click('[data-act=import]');
  await page.waitForSelector('.person .mini-times', { timeout: 10000 });
  if ((await page.locator('.person').count()) !== 2) throw new Error('people');
  if ((await page.locator('.person .place').count()) !== 5) throw new Error('places');
  if ((await page.locator('.person .place .mt').count()) !== 25) throw new Error('times');
  if ((await page.textContent('.times-hero .loc-chip')).trim() !== 'Haifa') throw new Error('main location not Person A home');
  await page.locator('.person').nth(1).locator('[data-cur]').click();
  await page.waitForFunction(() => document.querySelectorAll('.person')[1]?.querySelector('.place.current .place-name')?.textContent === 'Beersheba');
  await go('#/');
  await page.waitForSelector('.fam-list li');
  if ((await page.locator('.fam-list li').count()) !== 2) throw new Error('today family card');
});

if (CODE) {
  await check('setup link on a new phone: code screen first, then the setup continues', async () => {
    const pl = (en, role) => { const c = CITIES.find((x) => x.name.en === en); return { cityId: c.id, role, lat: c.lat, lon: c.lon, tz: c.tz }; };
    const code = encodeSetup([{ name: 'Person C', places: [pl('Tamra', 'home')] }]);
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, timezoneId: 'Asia/Jerusalem' });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    await p2.goto(`${BASE}#/setup/${code}`);
    await p2.waitForSelector('.gate #gate-code');
    await p2.fill('#gate-code', CODE);
    await p2.waitForSelector('.setup-person', { timeout: 10000 });
    if (!(await p2.textContent('.setup-person')).includes('Person C')) throw new Error('setup preview');
    await ctx2.close();
  });
} else skip('setup link on a new phone: code screen first');

await check('Arabic interface: RTL and Arabic labels', async () => {
  await go('#/settings');
  await page.click('[data-lang=ar]');
  await page.waitForFunction(() => document.documentElement.dir === 'rtl');
  await go('#/');
  await page.waitForSelector('#daily .quran .w', { timeout: 20000 });
  if ((await page.textContent('.tabs a[data-tab=today] span:last-child')).trim() !== 'اليوم') throw new Error('tab');
});

await check('Hebrew interface: Hebrew translation shown', async () => {
  await go('#/settings');
  await page.click('[data-lang=he]');
  await page.waitForFunction(() => document.documentElement.lang === 'he');
  await go('#/item/s112');
  await page.waitForSelector('.translation[lang=he]', { timeout: 20000 });
  if (!/[֐-׿]/.test(await page.textContent('.translation[lang=he]'))) throw new Error('no Hebrew text');
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
  if (bg !== 'rgb(10, 19, 17)') throw new Error(bg);
});

await check('offline: an opened surah still loads after going offline + reload', async () => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForSelector('.ayah .quran .w', { timeout: 20000 });
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector('.ayah .quran .w', { timeout: 20000 });
  if ((await page.locator('article.ayah').count()) !== 4) throw new Error('ayahs offline');
  await go('#/times');
  await page.waitForSelector('.timeline li');
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
