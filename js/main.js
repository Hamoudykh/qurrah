// App shell: router, tabs, theme/language, mini player, service worker, reminders.
import { getState, subscribe, settings, update } from './core/store.js';
import { setLang, detectLang, t, getLang } from './core/i18n.js';
import { $, mount, on } from './core/dom.js';
import { player } from './core/audio.js';
import { startScheduler } from './core/notify.js';
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
};
const TAB_OF = { '': 'today', learn: 'learn', item: 'learn', review: 'me', pray: 'pray', times: 'times', qibla: 'times', me: 'me', settings: 'me', sources: 'me', welcome: '' };

let cleanup = null;
let renderToken = 0;

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
  $('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0E1513' : '#F6F2E9');
}

function translateShell() {
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel));
}

async function render() {
  const token = ++renderToken;
  const { route, params, query } = parseHash();
  if (!getState().onboarded && route !== 'welcome' && route !== 'sources') { go('#/welcome', { replace: true }); return; }
  const loader = ROUTES[route] || ROUTES[''];
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  const el = $('#view');
  const tab = TAB_OF[route] ?? 'today';
  for (const a of document.querySelectorAll('.tabs a')) {
    a.classList.toggle('active', a.dataset.tab === tab);
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  document.body.classList.toggle('no-tabs', route === 'welcome');
  const back = $('#back');
  back.hidden = !['item', 'review', 'qibla', 'settings', 'sources'].includes(route);
  try {
    const mod = await loader();
    if (token !== renderToken) return;
    const ctx = {
      el, params, query, route,
      setTitle: (s) => { $('#title').textContent = s; document.title = s === t('appName') ? s : `${s} · ${t('appName')}`; },
      isCurrent: () => token === renderToken,
    };
    ctx.setTitle(t('appName'));
    mount(el, '');
    const c = (await mod.render(ctx)) || null;
    if (token !== renderToken) { if (c) try { c(); } catch { /* ignore */ } return; } // navigated away meanwhile
    cleanup = c;
    if (!query.keepScroll) window.scrollTo(0, 0);
  } catch (e) {
    console.error(e);
    mount(el, `<div class="card error"><p>${t('errorGeneric')}</p><pre class="small">${String(e.message || e).replace(/</g, '&lt;')}</pre></div>`);
  }
}

// ---- mini player (visible whenever an ayah is loaded) ----
function renderMini() {
  const mp = $('#miniplayer');
  const c = player.current;
  if (!c) { mp.hidden = true; document.body.classList.remove('has-mini'); return; }
  mp.hidden = false;
  document.body.classList.add('has-mini');
  const reps = player.opts.repeat === Infinity ? '∞' : player.opts.repeat;
  mount(mp, `
    <button class="mini-info" data-act="open" aria-label="${t('openPassage')}">
      <span class="mini-title">${(player.meta?.title || '').replace(/</g, '&lt;')} <span class="ltr-num">${c.key}</span></span>
      <span class="mini-sub">${player.meta?.artist?.replace(/</g, '&lt;') || ''}${player.opts.repeat > 1 ? ` · ${t('repeatShort', { n: Math.min(player.rep + 1, player.opts.repeat === Infinity ? player.rep + 1 : player.opts.repeat), of: reps })}` : ''}</span>
    </button>
    <button class="icon-btn" data-act="prev" aria-label="${t('previous')}">${icon('prev', 'flip-rtl')}</button>
    <button class="icon-btn big" data-act="toggle" aria-label="${player.isPlaying ? t('pause') : t('play')}">${icon(player.isPlaying ? 'pause' : 'play')}</button>
    <button class="icon-btn" data-act="next" aria-label="${t('next')}">${icon('next', 'flip-rtl')}</button>
    <button class="icon-btn" data-act="close" aria-label="${t('close')}">${icon('close')}</button>`);
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
}

function boot() {
  const s = getState();
  if (!s.settings.lang) update((st) => { st.settings.lang = detectLang(); }, { silent: true });
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
      render();
      renderMini();
    }
  });

  $('#back').innerHTML = icon('back', 'flip-rtl');
  $('#back').addEventListener('click', () => { if (history.length > 1) history.back(); else location.hash = '#/'; });
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
