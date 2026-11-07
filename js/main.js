// App shell: router, tabs, theme/language, mini player, service worker, reminders.
import { getState, subscribe, settings, update } from './core/store.js';
import { setLang, t, getLang } from './core/i18n.js';
import { $, mount, on, esc } from './core/dom.js';
import { player } from './core/audio.js';
import { startScheduler } from './core/notify.js';
import { isUnlocked } from './core/access.js';
import { icon } from './views/ui.js';

const ROUTES = {
  '': () => import('./views/today.js'),
  welcome: () => import('./views/welcome.js'),
  learn: () => import('./views/learn.js'),
  item: () => import('./views/item.js'),
  review: () => import('./views/review.js'),
  pray: () => import('./views/pray.js'),
  times: () => import('./views/times.js'),
  qibla: () => import('./views/qibla.js'),
  me: () => import('./views/me.js'),
  settings: () => import('./views/settings.js'),
  sources: () => import('./views/sources.js'),
  setup: () => import('./views/setup.js'),
};
const TAB_OF = { '': 'today', learn: 'learn', item: 'learn', review: 'me', pray: 'pray', times: 'times', qibla: 'times', me: 'me', settings: 'me', sources: 'me', welcome: '', setup: 'times', gate: '' };
const DETAIL = new Set(['item', 'review', 'qibla', 'settings', 'sources', 'setup']);

let cleanup = null;
let renderToken = 0;
let lastRoute = null;

export function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { route: parts[0] || '', params: parts.slice(1), query: Object.fromEntries(new URLSearchParams(qs)) };
}

export function go(hash, { replace = false } = {}) {
  if (replace) history.replaceState(null, '', hash); else location.hash = hash;
  if (replace) render();
}

function applyTheme() {
  const th = settings().theme;
  if (th === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', th);
  const dark = th === 'dark' || (th === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0A1311' : '#F4EFE6');
}

function translateShell() {
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel));
}

async function render() {
  const token = ++renderToken;
  const parsed = parseHash();
  const { params, query } = parsed;
  // First run on this device: the access code screen comes before everything, and the URL is
  // kept, so a setup link continues once the code is entered.
  const locked = !isUnlocked();
  const route = locked ? 'gate' : parsed.route;
  if (!locked && !getState().onboarded && !['welcome', 'sources', 'setup'].includes(route)) { go('#/welcome', { replace: true }); return; }
  const loader = locked ? () => import('./views/gate.js') : (ROUTES[route] || ROUTES['']);
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  const el = $('#view');
  const tab = TAB_OF[route] ?? 'today';
  for (const a of document.querySelectorAll('.tabs a')) {
    a.classList.toggle('active', a.dataset.tab === tab);
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  document.body.classList.toggle('no-tabs', route === 'welcome' || route === 'gate');
  document.body.classList.toggle('is-detail', DETAIL.has(route));
  document.body.classList.toggle('is-root', !DETAIL.has(route));
  $('#back').hidden = !DETAIL.has(route);
  try {
    const mod = await loader();
    if (token !== renderToken) return;
    const ctx = {
      el, params, query, route,
      setTitle: (s) => { $('#title').textContent = s; document.title = s === t('appName') ? s : `${s} · ${t('appName')}`; },
      isCurrent: () => token === renderToken,
      onUnlock: () => render(),
    };
    ctx.setTitle(t('appName'));
    mount(el, '');
    // Gentle entrance when the route changes (not on in-page redraws).
    const routeKey = `${route}/${params.join('/')}`;
    if (routeKey !== lastRoute) {
      el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
      clearTimeout(el._enterT); el._enterT = setTimeout(() => el.classList.remove('enter'), 900);
      lastRoute = routeKey;
    }
    const c = (await mod.render(ctx)) || null;
    if (token !== renderToken) { if (c) try { c(); } catch { /* ignore */ } return; } // navigated away meanwhile
    cleanup = c;
    if (!query.keepScroll) window.scrollTo(0, 0);
  } catch (e) {
    console.error(e);
    mount(el, `<div class="card error"><p>${t('errorGeneric')}</p><pre class="small">${esc(e.message || e)}</pre></div>`);
  }
}

// ---- mini player (visible whenever an ayah is loaded) ----
function renderMini() {
  const mp = $('#miniplayer');
  const c = player.current;
  if (!c) { mp.hidden = true; document.body.classList.remove('has-mini'); return; }
  mp.hidden = false;
  document.body.classList.add('has-mini');
  const target = player.opts.repeat === Infinity ? '∞' : player.opts.repeat;
  const rep = Math.min(player.rep + 1, player.opts.repeat === Infinity ? player.rep + 1 : player.opts.repeat);
  mount(mp, `
    <button class="mini-info" data-act="open" aria-label="${esc(t('openPassage'))}">
      <span class="mini-title">${esc(player.meta?.title || '')} <span class="ltr-num">${esc(c.key)}</span></span>
      <span class="mini-sub">${esc(player.meta?.artist || '')}${player.opts.repeat > 1 ? ` · ${esc(t('repeatShort', { n: rep, of: target }))}` : ''}</span>
    </button>
    <button class="icon-btn" data-act="prev" aria-label="${esc(t('previous'))}">${icon('prev', 'flip-rtl')}</button>
    <button class="icon-btn big" data-act="toggle" aria-label="${esc(player.isPlaying ? t('pause') : t('play'))}">${icon(player.isPlaying ? 'pause' : 'play')}</button>
    <button class="icon-btn" data-act="next" aria-label="${esc(t('next'))}">${icon('next', 'flip-rtl')}</button>
    <button class="icon-btn" data-act="close" aria-label="${esc(t('close'))}">${icon('close')}</button>
    <span class="mini-progress" aria-hidden="true"><span></span></span>`);
}

function setupMini() {
  const mp = $('#miniplayer');
  on(mp, 'click', '[data-act]', (e, b) => {
    const a = b.dataset.act;
    if (a === 'toggle') player.toggle();
    else if (a === 'next') player.next();
    else if (a === 'prev') player.prev();
    else if (a === 'close') { player.stop(); player.setQueue([], {}); renderMini(); }
    else if (a === 'open' && player.meta?.href) location.hash = player.meta.href;
  });
  for (const ev of ['state', 'ayah', 'repeat', 'done']) player.addEventListener(ev, renderMini);
  player.el.addEventListener('timeupdate', () => {
    const bar = mp.querySelector('.mini-progress span');
    if (bar && player.el.duration) bar.style.width = `${(player.el.currentTime / player.el.duration) * 100}%`;
  });
}

function boot() {
  const s = getState();
  if (!s.settings.lang) update((st) => { st.settings.lang = 'ar'; }, { silent: true });
  setLang(settings().lang);
  applyTheme();
  translateShell();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

  let lastLang = getLang();
  let lastTheme = settings().theme;
  subscribe(() => {
    if (settings().theme !== lastTheme) { lastTheme = settings().theme; applyTheme(); }
    if (settings().lang !== lastLang) {
      lastLang = settings().lang;
      setLang(lastLang);
      translateShell();
      lastRoute = null;
      render();
      renderMini();
    }
  });

  $('#back').innerHTML = icon('back', 'flip-rtl');
  $('#back').addEventListener('click', () => { if (history.length > 1) history.back(); else location.hash = '#/'; });
  $('#gear').innerHTML = icon('settings');
  for (const a of document.querySelectorAll('.tabs a')) a.querySelector('.ic-slot').innerHTML = icon(a.dataset.icon);

  window.addEventListener('hashchange', render);
  setupMini();
  render();
  startScheduler();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW registration failed', e));
  }
}

boot();
