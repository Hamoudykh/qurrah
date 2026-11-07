// Service worker: precaches the app shell so the app opens offline.
// Quran text/translations/tafsir and audio are cached by the app itself (Cache Storage
// "qurrah-data-v1" / "qurrah-audio-v1") when you open or save a passage.
// Bump VERSION when files change; shell files are also refreshed in the background.

const VERSION = 'v2.3.0';
const SHELL_CACHE = `qurrah-shell-${VERSION}`;

const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/app.css',
  './js/main.js',
  './js/core/access.js', './js/core/api.js', './js/core/audio.js', './js/core/dom.js', './js/core/i18n.js', './js/core/notify.js', './js/core/store.js',
  './js/logic/dates.js', './js/logic/people.js', './js/logic/ics.js', './js/logic/planner.js', './js/logic/prayer.js', './js/logic/qibla.js', './js/logic/srs.js', './js/logic/suggest.js',
  './js/data/catalog.js', './js/data/cities.js', './js/data/daily.js', './js/data/fiqh.js', './js/data/khushu.js', './js/data/meta.js', './js/data/refs.js', './js/data/virtues.js',
  './js/i18n/en.js', './js/i18n/ar.js', './js/i18n/he.js',
  './js/views/gate.js', './js/views/item.js', './js/views/learn.js', './js/views/me.js', './js/views/passage.js', './js/views/people-ui.js', './js/views/setup.js', './js/views/pray.js', './js/views/qibla.js',
  './js/views/review.js', './js/views/settings.js', './js/views/sources.js', './js/views/times.js', './js/views/today.js', './js/views/ui.js', './js/views/viz.js', './js/views/welcome.js',
  './vendor/adhan.esm.min.js',
  './fonts/amiri-quran-arabic.woff2', './fonts/amiri-quran-latin.woff2',
  './fonts/amiri-400.woff2', './fonts/amiri-700.woff2', './fonts/noto-naskh-arabic-400.woff2',
  './fonts/plex-arabic-400.woff2', './fonts/plex-arabic-500.woff2', './fonts/plex-arabic-600.woff2', './fonts/plex-arabic-700.woff2',
  './fonts/plex-arabic-latin-400.woff2', './fonts/plex-arabic-latin-600.woff2', './fonts/plex-arabic-latin-700.woff2',
  './fonts/noto-sans-hebrew-400.woff2', './fonts/noto-sans-hebrew-600.woff2', './fonts/noto-sans-hebrew-700.woff2',
  './icons/icon.svg', './icons/icon-mono.svg', './icons/icon-maskable.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/badge-96.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('qurrah-shell-') && key !== SHELL_CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // APIs/audio: handled by the app's own cache

  // Stale-while-revalidate for the app shell; navigations fall back to index.html.
  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const key = req.mode === 'navigate' ? './index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const network = fetch(req).then((res) => {
      if (res.ok && res.type === 'basic') cache.put(req.mode === 'navigate' ? './index.html' : req, res.clone());
      return res;
    }).catch(() => null);
    if (cached) { event.waitUntil(network); return cached; }
    const res = await network;
    return res || new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain' } });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './#/', self.registration.scope).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (c.url.startsWith(self.registration.scope)) { await c.focus(); c.navigate?.(target); return; }
    }
    await self.clients.openWindow(target);
  })());
});
