import { html, raw, mount, on, toast, sanitizeHtml, esc, celebrate, buzz } from '../core/dom.js';
import { t, getLang, fmtNum, isRTL, L } from '../core/i18n.js';
import { getState, settings, setSetting, startLearning, markKnown, removeItem, setAyahStatus, update, itemState } from '../core/store.js';
import { itemFromId } from '../data/catalog.js';
import { VIRTUES, GENERAL_VIRTUES } from '../data/virtues.js';
import { RECITERS, getIbnKathir, cacheAudio, TAFSIRS, getAudio, chapter } from '../core/api.js';
import { player } from '../core/audio.js';
import { daysUntilDue } from '../logic/srs.js';
import { ic, itemTitle, rangeLabel, levelBadge, refsList, ctext, loading, errorBox, ayahCount } from './ui.js';
import { medallion } from './viz.js';
import { loadPassage, ayahCards, wordsHTML, ayahEnd, translationModes, arabicStyle, sourceLine, queueAudio, playerIsFor } from './passage.js';

const HIDE_MODES = ['none', 'first', 'alternate', 'all'];
const hideFn = {
  none: null,
  first: (i) => i > 0, // keep only the first word as a hint
  alternate: (i) => i % 2 === 1,
  all: () => true,
};
const R1 = 46, R2 = 38, C1 = 2 * Math.PI * R1, C2 = 2 * Math.PI * R2;

export async function render(ctx) {
  const id = ctx.params[0];
  const item = itemFromId(id);
  if (!item) { mount(ctx.el, html`<div class="card error">${t('notFound')}</div>`); return; }
  ctx.setTitle(itemTitle(item));

  let tab = ['read', 'memorize', 'why'].includes(ctx.query.tab) ? ctx.query.tab : 'read';
  let p = null;
  let hideMode = 'none';
  const revealed = new Set();
  let range = null; // [from, to] for memorization
  let focusN = null;
  let memView = 'focus';
  let wordTimer = null;

  mount(ctx.el, html`<div id="item-head"></div><div class="seg tabs3" role="tablist" id="item-tabs"></div><div id="item-body">${loading()}</div><div id="wordbar" class="wordbar" hidden role="status"></div>`);
  const head = ctx.el.querySelector('#item-head');
  const tabsEl = ctx.el.querySelector('#item-tabs');
  const body = ctx.el.querySelector('#item-body');
  const wordbar = ctx.el.querySelector('#wordbar');

  const ch = chapter(item.surah);
  const titleAr = item.names ? item.names.ar : `سورة ${ch.nameArabic}`;
  const nAyahs = ayahCount(item);

  const drawHead = () => {
    const st = itemState(item.id);
    const saved = getState().saved[item.id];
    let status;
    if (!st) {
      status = html`<button class="btn primary" data-act="learn">${ic('plus')} ${t('startLearning')}</button>
        <button class="btn" data-act="known">${ic('check')} ${t('iKnowThis')}</button>`;
    } else if (st.status === 'learning') {
      status = html`<span class="chip learning">${t('statusLearning')}</span>
        <button class="btn" data-act="known">${ic('check')} ${t('markMemorized')}</button>
        <button class="icon-btn" data-act="remove" aria-label="${t('remove')}">${ic('trash')}</button>`;
    } else {
      const d = daysUntilDue(st.srs);
      status = html`<span class="chip ok">${ic('check')} ${t('statusKnown')}</span>
        <span class="small muted">${d <= 0 ? t('reviewDueNow') : t('nextReviewIn', { count: d, n: fmtNum(d) })}</span>
        ${d <= 0 ? html`<a class="btn small" href="#/review">${t('reviewNow')}</a>` : ''}
        <button class="icon-btn" data-act="remove" aria-label="${t('remove')}">${ic('trash')}</button>`;
    }
    const sub = getLang() === 'ar'
      ? (item.names ? `سورة ${ch.nameArabic} · ` : '')
      : `${item.names ? L(item.names) : ch.nameSimple}${!item.names && getLang() === 'en' ? ` · ${ch.meaningEn}` : ''} · `;
    mount(head, html`<header class="surah-banner">
      <div class="banner-top">${medallion(item.surah, 'on-dark lg')}${levelBadge(item.level)}</div>
      <h2 class="surah-title" lang="ar" dir="rtl">${titleAr}</h2>
      <p class="banner-sub">${sub}<span dir="ltr" class="ltr-num">${rangeLabel(item)}</span></p>
      <div class="banner-chips">
        <span class="chip">${t('ayahsN', { count: nAyahs, n: fmtNum(nAyahs) })}</span>
        <span class="chip">${t(ch.place === 'madinah' ? 'madani' : 'makki')}</span>
      </div>
    </header>
    <div class="row wrap gap status-row">${status}</div>
    <div class="toolbar">
      <div class="stepper" role="group" aria-label="${t('arabicSize')}">
        <button class="icon-btn" data-act="size-" aria-label="${t('smaller')}">${getLang() === 'ar' ? 'ا' : 'A'}−</button>
        <button class="icon-btn" data-act="size+" aria-label="${t('larger')}">${getLang() === 'ar' ? 'ا' : 'A'}+</button>
      </div>
      <button class="chip-toggle ${settings().showTranslit ? 'on' : ''}" data-act="translit" aria-pressed="${settings().showTranslit}">${t('transliteration')}</button>
      <label class="mini-select">${ic('globe')}<select data-set="translation" aria-label="${t('translation')}">
        ${['auto', 'en', 'he', 'both', 'off'].map((v) => html`<option value="${v}" ${settings().translation === v ? 'selected' : ''}>${t(`tr_${v}`)}</option>`)}
      </select></label>
      <label class="mini-select">${ic('play')}<select data-set="reciter" aria-label="${t('reciter')}">
        ${RECITERS.map((r) => html`<option value="${r.id}" ${settings().reciter === r.id ? 'selected' : ''}>${getLang() === 'ar' ? r.ar : r.name}</option>`)}
      </select></label>
      <button class="chip-toggle ${saved ? 'on' : ''}" data-act="save" aria-pressed="${!!saved}">${ic('download')} <span id="save-label">${saved ? t('savedOffline') : t('saveOffline')}</span></button>
    </div>`);
  };

  const drawTabs = () => mount(tabsEl, ['read', 'memorize', 'why'].map((k) => html`<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-tab="${k}">${t(`tab_${k}`)}</button>`).join(''));

  const drawRead = () => {
    const modes = translationModes();
    const playing = playerIsFor(item.id) && player.isPlaying;
    mount(body, html`
      <div class="row gap read-actions">
        <button class="btn primary" data-act="play-all">${ic(playing ? 'pause' : 'play')} ${playing ? t('pause') : t('playAll')}</button>
        <span class="small muted">${t('tapWordHint')}</span>
      </div>
      <div class="ayahs" style="${arabicStyle()}">
        ${p.basmala ? html`<p class="basmala quran" lang="ar" dir="rtl">${p.basmala.arabic}</p>` : ''}
        ${ayahCards(p, { showTranslit: settings().showTranslit, showMeaning: settings().showMeaning, modes, playingN: playerIsFor(item.id) ? player.current?.n : null })}
      </div>
      ${sourceLine(p)}
    `);
  };

  // ---------------- memorize ----------------
  const inRange = () => p.verses.filter((v) => v.n >= range[0] && v.n <= range[1]);
  const statusOf = (n) => itemState(item.id)?.ayahs?.[n] || '';

  const ringSVG = () => {
    const here = playerIsFor(item.id) && player.current;
    const target = player.opts.repeat;
    const repFrac = here ? (target === Infinity ? (player.rep % 10) / 10 : Math.min(1, player.rep / target)) : 0;
    const aud = here && player.el.duration ? player.el.currentTime / player.el.duration : 0;
    return `<svg class="rr" viewBox="0 0 104 104" aria-hidden="true">
      <circle class="track" cx="52" cy="52" r="${R1}" stroke-width="6" fill="none"/>
      <circle class="rep" cx="52" cy="52" r="${R1}" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="${C1.toFixed(1)}" stroke-dashoffset="${(C1 * (1 - repFrac)).toFixed(1)}"/>
      <circle class="track" cx="52" cy="52" r="${R2}" stroke-width="3" fill="none"/>
      <circle class="aud" cx="52" cy="52" r="${R2}" stroke-width="3" fill="none" stroke-dasharray="${C2.toFixed(1)}" stroke-dashoffset="${(C2 * (1 - aud)).toFixed(1)}"/></svg>`;
  };
  const counterText = () => {
    const m = settings().memorize;
    const target = m.repeat === Infinity ? '∞' : fmtNum(m.repeat);
    if (!(playerIsFor(item.id) && player.current)) return `×${target}`;
    const rep = player.opts.repeat === Infinity ? player.rep + 1 : Math.min(player.rep + 1, player.opts.repeat);
    return `${fmtNum(rep)} / ${target}`;
  };

  const settingsCard = () => {
    const m = settings().memorize;
    const opt = (key, vals, cur, label) => html`<div class="ctl"><span class="ctl-label">${label}</span><div class="seg small" role="radiogroup">
      ${vals.map((v) => html`<button role="radio" aria-checked="${cur === v}" class="${cur === v ? 'on' : ''}" data-mset="${key}" data-val="${v}">${v === Infinity ? '∞' : key === 'gap' ? t(`gap_${v}`) : key === 'rate' ? `${v}×` : fmtNum(v)}</button>`)}
    </div></div>`;
    const ayahOpts = (sel) => p.verses.map((v) => html`<option value="${v.n}" ${v.n === sel ? 'selected' : ''}>${fmtNum(v.n)}</option>`);
    return html`<details class="card mem-settings" ${memView === 'list' ? 'open' : ''}>
      <summary>${ic('settings')} ${t('repeatSettings')} <span class="small muted">×${m.repeat === Infinity ? '∞' : fmtNum(m.repeat)} · ${t(`gap_${m.gap}`)} · ${m.rate}×</span></summary>
      <div class="row gap wrap">
        <label class="field inline"><span>${t('fromAyah')}</span><select data-range="0">${ayahOpts(range[0])}</select></label>
        <label class="field inline"><span>${t('toAyah')}</span><select data-range="1">${ayahOpts(range[1])}</select></label>
      </div>
      ${opt('repeat', [1, 3, 5, 7, 10, 20, Infinity], m.repeat, t('repeatEachAyah'))}
      ${opt('rangeRepeat', [1, 2, 3, 5, Infinity], m.rangeRepeat, t('thenRepeatRange'))}
      ${opt('gap', ['off', 'short', 'echo'], m.gap, t('pauseAfter'))}
      ${opt('rate', [0.75, 1, 1.25], m.rate, t('speed'))}
      <p class="small muted">${t('echoHint')}</p>
    </details>`;
  };

  const hideCard = () => html`<section class="card">
    <div class="ctl" style="margin:0"><span class="ctl-label">${ic('eyeOff')} ${t('testYourself')}</span>
      <div class="seg small" role="radiogroup">${HIDE_MODES.map((h) => html`<button role="radio" aria-checked="${hideMode === h}" class="${hideMode === h ? 'on' : ''}" data-hide="${h}">${t(`hide_${h}`)}</button>`)}</div>
    </div>
    ${hideMode !== 'none' ? html`<p class="small muted" style="margin-bottom:0">${t('tapToReveal')} <button class="link" data-act="reveal-all">${t('revealAll')}</button> · <button class="link" data-act="hide-again">${t('hideAgain')}</button></p>` : ''}
  </section>`;

  const progressCard = () => {
    const st = itemState(item.id);
    const memorizedN = p.verses.filter((v) => statusOf(v.n) === 'memorized').length;
    return html`<section class="card center">
      <p style="margin-top:0">${t('memorizedProgress', { count: memorizedN, n: fmtNum(memorizedN), total: fmtNum(p.verses.length) })}</p>
      <div class="bar"><span style="width:${Math.round((memorizedN / p.verses.length) * 100)}%"></span></div>
      ${memorizedN === p.verses.length && st?.status !== 'known' ? html`<button class="btn gold" data-act="known">${ic('sparkle')} ${t('markWholeMemorized')}</button>` : ''}
    </section>`;
  };

  const drawFocus = () => {
    const vs = inRange();
    if (focusN == null || !vs.find((v) => v.n === focusN)) focusN = (vs.find((v) => statusOf(v.n) !== 'memorized') || vs[0]).n;
    const v = vs.find((x) => x.n === focusN);
    const modes = translationModes();
    const playingHere = playerIsFor(item.id) && player.isPlaying;
    const hide = hideFn[hideMode];
    const st = statusOf(v.n);
    mount(body, html`<div class="focus" style="${arabicStyle()}">
      <div class="ayah-dots" role="tablist" aria-label="${t('ayahStatus')}">
        ${vs.map((x) => html`<button role="tab" aria-selected="${x.n === focusN}" class="${statusOf(x.n)} ${x.n === focusN ? 'cur' : ''}" data-focus="${x.n}" aria-label="${t('ayahN', { n: x.n })}">${fmtNum(x.n)}</button>`)}
      </div>
      <article class="focus-card ${playerIsFor(item.id) && player.current?.n === v.n ? 'playing' : ''}" id="focus-card" data-n="${v.n}">
        <span class="ayah-key" dir="ltr">${v.key}</span>
        <p class="quran" lang="ar" dir="rtl">${wordsHTML(v, { hide, revealed })}${ayahEnd(v.n)}</p>
        ${settings().showTranslit && v.tr.translit ? html`<p class="translit" dir="ltr">${v.tr.translit}</p>` : ''}
        ${modes.map((m) => (v.tr[m] ? html`<p class="translation small muted" lang="${m}" dir="${m === 'he' ? 'rtl' : 'ltr'}">${v.tr[m]}</p>` : ''))}
      </article>
      ${vs.length > 1 ? html`<p class="swipe-hint">${t('swipeHint')}</p>` : ''}
      <div class="focus-controls">
        <button class="round-btn" data-act="focus-prev" aria-label="${t('previous')}" ${vs[0].n === v.n ? 'disabled' : ''}>${ic('back', 'flip-rtl')}</button>
        <button class="repeat-ring" data-act="mem-play" aria-label="${playingHere ? t('pause') : t('startRepeating')}">
          ${raw(ringSVG())}<span class="rr-center">${ic(playingHere ? 'pause' : 'play')}<small id="rr-count" dir="ltr">${counterText()}</small></span></button>
        <button class="round-btn" data-act="focus-next" aria-label="${t('next')}" ${vs.at(-1).n === v.n ? 'disabled' : ''}>${ic('forward', 'flip-rtl')}</button>
      </div>
      <div class="focus-status" role="group" aria-label="${t('ayahStatus')}">
        <button class="chip-toggle ${st === 'learning' ? 'on' : ''}" data-ast="learning" data-n="${v.n}">${t('statusLearning')}</button>
        <button class="chip-toggle ok ${st === 'memorized' ? 'on' : ''}" data-ast="memorized" data-n="${v.n}">${ic('check')} ${t('iMemorizedIt')}</button>
      </div>
      ${hideCard()}
      ${settingsCard()}
      ${progressCard()}
      <p class="center"><button class="link" data-act="mem-view" data-v="list">${t('listMode')}</button></p>
      ${sourceLine(p)}
    </div>`);
    bindSwipe();
  };

  const drawList = () => {
    const hide = hideFn[hideMode];
    mount(body, html`
      ${settingsCard()}
      <div class="row gap"><button class="btn primary" data-act="mem-play">${ic(playerIsFor(item.id) && player.isPlaying ? 'pause' : 'play')} ${playerIsFor(item.id) && player.isPlaying ? t('pause') : t('startRepeating')}</button>
        <span class="mem-counter small" id="mem-counter" aria-live="polite"></span></div>
      ${hideCard()}
      <div class="ayahs mem" style="${arabicStyle()}">
        ${inRange().map((v) => html`<article class="ayah${playerIsFor(item.id) && player.current?.n === v.n ? ' playing' : ''}" id="a${v.n}" data-n="${v.n}">
          <div class="ayah-tools"><span class="ayah-key" dir="ltr">${v.key}</span><span class="grow"></span>
            <button class="icon-btn" data-act="mem-from" data-n="${v.n}" aria-label="${t('repeatThisAyah')}" title="${t('repeatThisAyah')}">${ic('repeat')}</button></div>
          <p class="quran" lang="ar" dir="rtl">${wordsHTML(v, { hide, revealed })}${ayahEnd(v.n)}</p>
          ${settings().showTranslit && v.tr.translit ? html`<p class="translit" dir="ltr">${v.tr.translit}</p>` : ''}
          <div class="row gap ayah-status" role="group" aria-label="${t('ayahStatus')}">
            <button class="chip-toggle ${statusOf(v.n) === 'learning' ? 'on' : ''}" data-ast="learning" data-n="${v.n}">${t('statusLearning')}</button>
            <button class="chip-toggle ok ${statusOf(v.n) === 'memorized' ? 'on' : ''}" data-ast="memorized" data-n="${v.n}">${ic('check')} ${t('memorized')}</button>
          </div>
        </article>`)}
      </div>
      ${progressCard()}
      <p class="center"><button class="link" data-act="mem-view" data-v="focus">${t('focusMode')}</button></p>
      ${sourceLine(p)}`);
    updateCounter();
  };

  const drawMemorize = () => {
    if (!range) range = [p.from, p.to];
    if (memView === 'focus') drawFocus(); else drawList();
  };

  const drawWhy = () => {
    const pts = VIRTUES[item.id] || [];
    mount(body, html`
      <section class="card">
        <h3>${ic('sparkle')} ${t('whyItMatters')}</h3>
        <p class="small muted">${t('summaryNote')}</p>
        ${pts.length ? pts.map((pt) => html`<div class="virtue ${pt.none ? 'none' : ''}"><p>${ctext(pt.text)}</p>${pt.note ? html`<p class="small muted">${ctext(pt.note)}</p>` : ''}${refsList(pt.refs)}</div>`)
          : html`<div class="virtue none"><p>${t('noSpecificVirtue')}</p></div>`}
      </section>
      <section class="card">
        <h3>${ic('learn')} ${t('generalVirtues')}</h3>
        ${GENERAL_VIRTUES.map((pt) => html`<div class="virtue"><p>${ctext(pt.text)}</p>${refsList(pt.refs)}</div>`)}
      </section>
      <p class="small muted center">${t('verifyNote')} <a href="#/sources">${t('sourcesAndCredits')}</a></p>
    `);
  };

  const drawBody = () => {
    drawTabs();
    if (!p && tab !== 'why') { mount(body, loading()); return; }
    if (tab === 'read') drawRead();
    else if (tab === 'memorize') drawMemorize();
    else drawWhy();
  };

  // ---- live updates from the player ----
  const updateCounter = () => {
    const el = ctx.el.querySelector('#mem-counter');
    if (el) {
      if (!playerIsFor(item.id) || !player.current) el.textContent = '';
      else {
        const target = player.opts.repeat === Infinity ? '∞' : fmtNum(player.opts.repeat);
        el.textContent = t('memCounter', { n: fmtNum(player.current.n), rep: fmtNum(Math.min(player.rep + 1, player.opts.repeat === Infinity ? player.rep + 1 : player.opts.repeat)), of: target });
      }
    }
    const rr = ctx.el.querySelector('.repeat-ring');
    if (rr) {
      rr.querySelector('svg.rr').outerHTML = ringSVG();
      const c = rr.querySelector('#rr-count'); if (c) c.textContent = counterText();
      const playing = playerIsFor(item.id) && player.isPlaying;
      rr.querySelector('.rr-center .ic').outerHTML = String(ic(playing ? 'pause' : 'play'));
      rr.setAttribute('aria-label', playing ? t('pause') : t('startRepeating'));
    }
  };

  const highlight = () => {
    for (const a of ctx.el.querySelectorAll('.ayah.playing, .focus-card.playing')) a.classList.remove('playing');
    if (!playerIsFor(item.id) || !player.current) return;
    const el = ctx.el.querySelector(`#a${player.current.n}`) || ctx.el.querySelector(`.focus-card[data-n="${player.current.n}"]`);
    if (el) {
      el.classList.add('playing');
      if (el.classList.contains('ayah')) {
        const r = el.getBoundingClientRect();
        if (r.top < 80 || r.bottom > innerHeight - 160) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const onPlayer = (e) => {
    // In focus mode, follow the player to the ayah being recited.
    if (tab === 'memorize' && memView === 'focus' && p && playerIsFor(item.id) && player.current && player.current.n !== focusN && e.type === 'ayah') {
      focusN = player.current.n;
      drawFocus();
      return;
    }
    highlight();
    updateCounter();
    const pa = ctx.el.querySelector('button.btn[data-act=play-all], button.btn[data-act=mem-play]');
    if (pa) {
      const playing = playerIsFor(item.id) && player.isPlaying;
      pa.innerHTML = `${ic(playing ? 'pause' : 'play')} ${esc(playing ? t('pause') : (pa.dataset.act === 'play-all' ? t('playAll') : t('startRepeating')))}`;
    }
  };
  for (const ev of ['ayah', 'state', 'repeat', 'done']) player.addEventListener(ev, onPlayer);
  const onTime = () => {
    const aud = ctx.el.querySelector('.repeat-ring circle.aud');
    if (aud && playerIsFor(item.id) && player.el.duration) aud.setAttribute('stroke-dashoffset', (C2 * (1 - player.el.currentTime / player.el.duration)).toFixed(1));
  };
  player.el.addEventListener('timeupdate', onTime);

  // Full-passage queue (memorize mode may have narrowed it to a sub-range).
  const ensureQueue = async () => { if (!playerIsFor(item.id) || player.queue.length !== p.verses.length) await queueAudio(p); };
  const indexOfN = (n) => player.queue.findIndex((q) => q.n === n);

  async function startMem(fromN) {
    await queueAudio(p);
    const m = settings().memorize;
    const sub = player.queue.filter((q) => q.n >= range[0] && q.n <= range[1]);
    player.setQueue(sub, player.meta);
    player.setOptions({ repeat: m.repeat, gap: m.gap, rate: m.rate, autoAdvance: true, rangeRepeat: m.rangeRepeat, cache: settings().cacheAudio });
    player.playIndex(Math.max(0, sub.findIndex((q) => q.n === (fromN ?? range[0]))));
    if (!itemState(item.id)) { startLearning(item.id); drawHead(); }
  }

  function moveFocus(dir) {
    const vs = inRange();
    const i = vs.findIndex((v) => v.n === focusN) + dir;
    if (i < 0 || i >= vs.length) return;
    focusN = vs[i].n;
    revealed.clear();
    if (playerIsFor(item.id) && player.isPlaying) startMem(focusN);
    buzz(6);
    drawFocus();
  }

  function bindSwipe() {
    const card = ctx.el.querySelector('#focus-card');
    if (!card) return;
    let x0 = null, y0 = null;
    card.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; });
    card.addEventListener('pointerup', (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const forward = isRTL() ? dx > 0 : dx < 0;
      moveFocus(forward ? 1 : -1);
    });
  }

  const offs = [
    on(ctx.el, 'click', '[data-tab]', (e, b) => { tab = b.dataset.tab; history.replaceState(null, '', `#/item/${encodeURIComponent(item.id)}?tab=${tab}`); drawBody(); }),
    on(ctx.el, 'click', '[data-act]', async (e, b) => {
      const a = b.dataset.act;
      if (a === 'retry') { load(); return; }
      if (a === 'learn') { startLearning(item.id); celebrate(b); toast(t('addedToLearning')); drawHead(); if (tab === 'read') { tab = 'memorize'; drawBody(); } }
      if (a === 'known') { markKnown(item.id); celebrate(b); toast(t('addedToMySurahs')); drawHead(); if (tab === 'memorize') drawBody(); }
      if (a === 'remove') { if (confirm(t('confirmRemove'))) { removeItem(item.id); drawHead(); if (p) drawBody(); } }
      if (a === 'size+' || a === 'size-') {
        const v = Math.max(22, Math.min(64, settings().arabicSize + (a === 'size+' ? 3 : -3)));
        setSetting('arabicSize', v);
        for (const el of ctx.el.querySelectorAll('.ayahs, .focus')) el.style.setProperty('--qsize', `${v}px`);
      }
      if (a === 'translit') { setSetting('showTranslit', !settings().showTranslit); drawHead(); drawBody(); }
      if (a === 'save') saveOffline(b);
      if (!p) return;
      if (a === 'play-all') {
        if (playerIsFor(item.id) && player.isPlaying) { player.pause(); return; }
        await ensureQueue();
        player.setOptions({ repeat: 1, gap: 'off', rate: 1, autoAdvance: true, rangeRepeat: 1, cache: settings().cacheAudio });
        if (player.current && playerIsFor(item.id) && player.index >= 0) player.toggle(); else player.playIndex(0);
      }
      if (a === 'play-ayah') {
        await ensureQueue();
        player.setOptions({ repeat: 1, gap: 'off', rate: 1, autoAdvance: true, rangeRepeat: 1, cache: settings().cacheAudio });
        player.playIndex(indexOfN(+b.dataset.n));
      }
      if (a === 'mem-play') {
        if (playerIsFor(item.id) && player.isPlaying) { player.pause(); return; }
        startMem(memView === 'focus' ? focusN : undefined);
      }
      if (a === 'mem-from') { range = [+b.dataset.n, Math.max(+b.dataset.n, range[1])]; drawMemorize(); startMem(+b.dataset.n); }
      if (a === 'mem-view') { memView = b.dataset.v; drawMemorize(); }
      if (a === 'focus-prev') moveFocus(-1);
      if (a === 'focus-next') moveFocus(1);
      if (a === 'reveal-all') { for (const v of p.verses) v.words.forEach((_, i) => revealed.add(`${v.n}:${i}`)); drawMemorize(); }
      if (a === 'hide-again') { revealed.clear(); drawMemorize(); }
      if (a === 'ibn-kathir') toggleIbnKathir(+b.dataset.n);
    }),
    on(ctx.el, 'click', '[data-focus]', (e, b) => { focusN = +b.dataset.focus; revealed.clear(); buzz(6); drawFocus(); }),
    on(ctx.el, 'click', '[data-mset]', (e, b) => {
      const key = b.dataset.mset;
      const rawV = b.dataset.val;
      const val = rawV === 'Infinity' ? Infinity : isNaN(+rawV) ? rawV : +rawV;
      update((s) => { s.settings.memorize[key] = val; }, { silent: true });
      if (playerIsFor(item.id)) player.setOptions({ [key]: val });
      const open = ctx.el.querySelector('.mem-settings')?.open;
      drawMemorize();
      if (open) ctx.el.querySelector('.mem-settings').open = true;
    }),
    on(ctx.el, 'click', '[data-hide]', (e, b) => { hideMode = b.dataset.hide; revealed.clear(); drawMemorize(); }),
    on(ctx.el, 'click', '[data-ast]', (e, b) => {
      const n = +b.dataset.n;
      const cur = itemState(item.id)?.ayahs?.[n];
      const next = cur === b.dataset.ast ? null : b.dataset.ast;
      setAyahStatus(item.id, n, next);
      if (next === 'memorized') celebrate(b);
      drawHead();
      drawMemorize();
      // After memorizing in focus mode, gently move on to the next ayah not yet memorized.
      if (next === 'memorized' && memView === 'focus') {
        const nextV = inRange().find((v) => v.n > n && statusOf(v.n) !== 'memorized');
        if (nextV) setTimeout(() => { if (ctx.isCurrent() && tab === 'memorize') { focusN = nextV.n; revealed.clear(); drawFocus(); } }, 650);
      }
    }),
    on(ctx.el, 'change', 'select[data-range]', (e, sel) => {
      range[+sel.dataset.range] = +sel.value;
      if (range[0] > range[1]) range = [range[1], range[0]];
      drawMemorize();
    }),
    on(ctx.el, 'change', 'select[data-set]', (e, sel) => {
      const key = sel.dataset.set;
      setSetting(key, key === 'reciter' ? +sel.value : sel.value);
      if (key === 'reciter') player.stop();
      drawBody();
    }),
    on(ctx.el, 'click', '.w', (e, w) => {
      const n = +w.dataset.n, i = +w.dataset.w;
      if (w.classList.contains('hid')) { revealed.add(`${n}:${i}`); w.classList.remove('hid'); w.removeAttribute('role'); buzz(5); return; }
      const v = p?.verses.find((x) => x.n === n);
      const word = v?.words[i];
      if (!word) return;
      for (const x of ctx.el.querySelectorAll('.w.sel')) x.classList.remove('sel');
      w.classList.add('sel');
      wordbar.hidden = false;
      mount(wordbar, html`<span class="wb-ar" lang="ar" dir="rtl">${word.t}</span>${word.tl ? html`<span class="wb-tl" dir="ltr">${word.tl}</span>` : ''}${word.m ? html`<span class="wb-m" dir="ltr" lang="en">${word.m}</span>` : ''}<span class="wb-src small muted">${t('wordByWordSource')}</span>`);
      clearTimeout(wordTimer);
      wordTimer = setTimeout(() => { wordbar.hidden = true; w.classList.remove('sel'); }, 5000);
    }),
    on(ctx.el, 'keydown', '.w.hid', (e, w) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); w.click(); } }),
  ];

  async function toggleIbnKathir(n) {
    const slot = ctx.el.querySelector(`.tafsir-slot[data-n="${n}"]`);
    if (!slot) return;
    if (slot.innerHTML) { slot.innerHTML = ''; return; }
    mount(slot, loading());
    try {
      const r = await getIbnKathir(item.surah, n);
      const cover = r.verses.length > 1 ? t('coversAyahs', { from: r.verses[0], to: r.verses.at(-1) }) : '';
      mount(slot, html`<div class="tafsir" lang="en" dir="ltr"><div class="meaning-label">${TAFSIRS.ibnKathir.name}${cover ? ` · ${cover}` : ''}</div>${sanitizeHtml(r.html)}</div>`);
    } catch (e) {
      mount(slot, errorBox(e, false));
    }
  }

  async function saveOffline(btn) {
    if (!p) return;
    const label = ctx.el.querySelector('#save-label');
    btn.disabled = true;
    try {
      const q = await getAudio(settings().reciter, item.surah, p.verses);
      const res = await cacheAudio(q.map((x) => x.url), (i, n) => { label.textContent = t('savingProgress', { i: fmtNum(i), n: fmtNum(n) }); });
      update((s) => { s.saved[item.id] = { at: Date.now(), reciter: settings().reciter, audio: res.failed === 0 }; });
      toast(res.failed ? t('savedTextOnly') : t('savedOfflineToast'));
    } catch {
      toast(t('saveFailed'));
    }
    btn.disabled = false;
    drawHead();
  }

  async function load() {
    drawBody();
    try {
      p = await loadPassage(item);
      if (!ctx.isCurrent()) return;
      drawBody();
      if (ctx.query.ayah) ctx.el.querySelector(`#a${ctx.query.ayah}`)?.scrollIntoView({ block: 'center' });
    } catch (e) {
      if (ctx.isCurrent()) mount(body, errorBox(e));
    }
  }

  drawHead();
  load();

  return () => {
    offs.forEach((f) => f());
    for (const ev of ['ayah', 'state', 'repeat', 'done']) player.removeEventListener(ev, onPlayer);
    player.el.removeEventListener('timeupdate', onTime);
    clearTimeout(wordTimer);
  };
}
