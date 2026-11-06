import { html, mount, on, toast, sanitizeHtml, esc } from '../core/dom.js';
import { t, getLang, fmtNum } from '../core/i18n.js';
import { getState, settings, setSetting, startLearning, markKnown, removeItem, setAyahStatus, update, itemState } from '../core/store.js';
import { itemFromId } from '../data/catalog.js';
import { VIRTUES, GENERAL_VIRTUES } from '../data/virtues.js';
import { RECITERS, getIbnKathir, cacheAudio, TAFSIRS } from '../core/api.js';
import { player } from '../core/audio.js';
import { daysUntilDue } from '../logic/srs.js';
import { ic, itemTitle, itemSubtitle, rangeLabel, levelBadge, refsList, ctext, loading, errorBox } from './ui.js';
import { loadPassage, ayahCards, wordsHTML, ayahEnd, translationModes, arabicStyle, sourceLine, queueAudio, playerIsFor } from './passage.js';
import { getAudio } from '../core/api.js';

const HIDE_MODES = ['none', 'first', 'alternate', 'all'];
const hideFn = {
  none: null,
  first: (i) => i > 0, // keep only the first word as a hint
  alternate: (i) => i % 2 === 1,
  all: () => true,
};

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
  let wordTimer = null;

  mount(ctx.el, html`<div id="item-head"></div><div class="seg tabs3" role="tablist" id="item-tabs"></div><div id="item-body">${loading()}</div><div id="wordbar" class="wordbar" hidden role="status"></div>`);
  const head = ctx.el.querySelector('#item-head');
  const tabsEl = ctx.el.querySelector('#item-tabs');
  const body = ctx.el.querySelector('#item-body');
  const wordbar = ctx.el.querySelector('#wordbar');

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
        <button class="btn ghost" data-act="remove" aria-label="${t('remove')}">${ic('trash')}</button>`;
    } else {
      const d = daysUntilDue(st.srs);
      status = html`<span class="chip ok">${ic('check')} ${t('statusKnown')}</span>
        <span class="small muted">${d <= 0 ? t('reviewDueNow') : t('nextReviewIn', { count: d, n: fmtNum(d) })}</span>
        ${d <= 0 ? html`<a class="btn" href="#/review">${t('reviewNow')}</a>` : ''}
        <button class="btn ghost" data-act="remove" aria-label="${t('remove')}">${ic('trash')}</button>`;
    }
    mount(head, html`<header class="item-head">
      <div class="row between wrap">
        <div>
          <h2 class="item-title">${itemTitle(item)}</h2>
          <p class="muted"><span dir="ltr" class="ltr-num">${rangeLabel(item)}</span>${itemSubtitle(item) ? ` · ${itemSubtitle(item)}` : ''}</p>
        </div>
        ${levelBadge(item.level)}
      </div>
      <div class="row wrap gap status-row">${status}</div>
      <div class="toolbar row wrap gap">
        <div class="stepper" role="group" aria-label="${t('arabicSize')}">
          <button class="icon-btn" data-act="size-" aria-label="${t('smaller')}">A−</button>
          <button class="icon-btn" data-act="size+" aria-label="${t('larger')}">A+</button>
        </div>
        <button class="chip-toggle ${settings().showTranslit ? 'on' : ''}" data-act="translit" aria-pressed="${settings().showTranslit}">${t('transliteration')}</button>
        <label class="mini-select">${ic('globe')}<select data-set="translation" aria-label="${t('translation')}">
          ${['auto', 'en', 'he', 'both', 'off'].map((v) => html`<option value="${v}" ${settings().translation === v ? 'selected' : ''}>${t(`tr_${v}`)}</option>`)}
        </select></label>
        <label class="mini-select">${ic('play')}<select data-set="reciter" aria-label="${t('reciter')}">
          ${RECITERS.map((r) => html`<option value="${r.id}" ${settings().reciter === r.id ? 'selected' : ''}>${getLang() === 'ar' ? r.ar : r.name}</option>`)}
        </select></label>
        <button class="chip-toggle ${saved ? 'on' : ''}" data-act="save" aria-pressed="${!!saved}">${ic('download')} <span id="save-label">${saved ? t('savedOffline') : t('saveOffline')}</span></button>
      </div>
    </header>`);
  };

  const drawTabs = () => mount(tabsEl, ['read', 'memorize', 'why'].map((k) => html`<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-tab="${k}">${t(`tab_${k}`)}</button>`).join(''));

  const drawRead = () => {
    const modes = translationModes();
    mount(body, html`
      <div class="row gap read-actions">
        <button class="btn primary" data-act="play-all">${ic(playerIsFor(item.id) && player.isPlaying ? 'pause' : 'play')} ${playerIsFor(item.id) && player.isPlaying ? t('pause') : t('playAll')}</button>
        <span class="small muted">${t('tapWordHint')}</span>
      </div>
      <div class="ayahs" style="${arabicStyle()}">
        ${p.basmala ? html`<p class="basmala quran" lang="ar" dir="rtl">${p.basmala.arabic}</p>` : ''}
        ${ayahCards(p, { showTranslit: settings().showTranslit, showMeaning: settings().showMeaning, modes, playingN: playerIsFor(item.id) ? player.current?.n : null })}
      </div>
      ${sourceLine(p)}
    `);
  };

  const drawMemorize = () => {
    const st = itemState(item.id);
    const m = settings().memorize;
    if (!range) range = [p.from, p.to];
    const statuses = st?.ayahs || {};
    const memorizedN = p.verses.filter((v) => statuses[v.n] === 'memorized').length;
    const hide = hideFn[hideMode];
    const opt = (key, vals, cur, label) => html`<div class="ctl"><span class="ctl-label">${label}</span><div class="seg small" role="radiogroup">
      ${vals.map((v) => html`<button role="radio" aria-checked="${cur === v}" class="${cur === v ? 'on' : ''}" data-mset="${key}" data-val="${v}">${v === Infinity ? '∞' : key === 'gap' ? t(`gap_${v}`) : key === 'rate' ? `${v}×` : fmtNum(v)}</button>`)}
    </div></div>`;
    const ayahOpts = (sel) => p.verses.map((v) => html`<option value="${v.n}" ${v.n === sel ? 'selected' : ''}>${fmtNum(v.n)}</option>`);
    const playingHere = playerIsFor(item.id) && player.isPlaying;
    mount(body, html`
      <section class="card mem-controls">
        <div class="row gap wrap">
          <label class="field inline"><span>${t('fromAyah')}</span><select data-range="0">${ayahOpts(range[0])}</select></label>
          <label class="field inline"><span>${t('toAyah')}</span><select data-range="1">${ayahOpts(range[1])}</select></label>
        </div>
        ${opt('repeat', [1, 3, 5, 7, 10, 20, Infinity], m.repeat, t('repeatEachAyah'))}
        ${opt('rangeRepeat', [1, 2, 3, 5, Infinity], m.rangeRepeat, t('thenRepeatRange'))}
        ${opt('gap', ['off', 'short', 'echo'], m.gap, t('pauseAfter'))}
        ${opt('rate', [0.75, 1, 1.25], m.rate, t('speed'))}
        <div class="row gap wrap">
          <button class="btn primary" data-act="mem-play">${ic(playingHere ? 'pause' : 'play')} ${playingHere ? t('pause') : t('startRepeating')}</button>
          <span class="mem-counter small" id="mem-counter" aria-live="polite"></span>
        </div>
        <p class="small muted">${t('echoHint')}</p>
      </section>

      <section class="card">
        <div class="ctl"><span class="ctl-label">${t('testYourself')}</span>
          <div class="seg small" role="radiogroup">${HIDE_MODES.map((h) => html`<button role="radio" aria-checked="${hideMode === h}" class="${hideMode === h ? 'on' : ''}" data-hide="${h}">${t(`hide_${h}`)}</button>`)}</div>
        </div>
        ${hideMode !== 'none' ? html`<p class="small muted">${t('tapToReveal')} <button class="link" data-act="reveal-all">${t('revealAll')}</button> · <button class="link" data-act="hide-again">${t('hideAgain')}</button></p>` : ''}
      </section>

      <div class="ayahs mem" style="${arabicStyle()}">
        ${p.verses.filter((v) => v.n >= range[0] && v.n <= range[1]).map((v) => html`<article class="ayah${playerIsFor(item.id) && player.current?.n === v.n ? ' playing' : ''}" id="a${v.n}" data-n="${v.n}">
          <div class="ayah-tools"><span class="ayah-key" dir="ltr">${v.key}</span><span class="grow"></span>
            <button class="icon-btn" data-act="mem-from" data-n="${v.n}" aria-label="${t('repeatThisAyah')}" title="${t('repeatThisAyah')}">${ic('repeat')}</button></div>
          <p class="quran" lang="ar" dir="rtl">${wordsHTML(v, { hide, revealed })}${ayahEnd(v.n)}</p>
          ${settings().showTranslit && v.tr.translit ? html`<p class="translit" dir="ltr">${v.tr.translit}</p>` : ''}
          <div class="row gap ayah-status" role="group" aria-label="${t('ayahStatus')}">
            <button class="chip-toggle ${statuses[v.n] === 'learning' ? 'on' : ''}" data-ast="learning" data-n="${v.n}">${t('statusLearning')}</button>
            <button class="chip-toggle ok ${statuses[v.n] === 'memorized' ? 'on' : ''}" data-ast="memorized" data-n="${v.n}">${ic('check')} ${t('memorized')}</button>
          </div>
        </article>`)}
      </div>
      <section class="card center">
        <p>${t('memorizedProgress', { count: memorizedN, n: fmtNum(memorizedN), total: fmtNum(p.verses.length) })}</p>
        <div class="bar"><span style="width:${Math.round((memorizedN / p.verses.length) * 100)}%"></span></div>
        ${memorizedN === p.verses.length && st?.status !== 'known' ? html`<button class="btn primary" data-act="known">${ic('check')} ${t('markWholeMemorized')}</button>` : ''}
      </section>
      ${sourceLine(p)}
    `);
    updateCounter();
  };

  const drawWhy = () => {
    const pts = VIRTUES[item.id] || [];
    mount(body, html`
      <section class="card">
        <h3>${t('whyItMatters')}</h3>
        <p class="small muted">${t('summaryNote')}</p>
        ${pts.length ? pts.map((pt) => html`<div class="virtue ${pt.none ? 'none' : ''}"><p>${ctext(pt.text)}</p>${pt.note ? html`<p class="small muted">${ctext(pt.note)}</p>` : ''}${refsList(pt.refs)}</div>`)
          : html`<div class="virtue none"><p>${t('noSpecificVirtue')}</p></div>`}
      </section>
      <section class="card">
        <h3>${t('generalVirtues')}</h3>
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

  const updateCounter = () => {
    const el = ctx.el.querySelector('#mem-counter');
    if (!el) return;
    if (!playerIsFor(item.id) || !player.current) { el.textContent = ''; return; }
    const target = player.opts.repeat === Infinity ? '∞' : fmtNum(player.opts.repeat);
    el.textContent = t('memCounter', { n: fmtNum(player.current.n), rep: fmtNum(Math.min(player.rep + 1, player.opts.repeat === Infinity ? player.rep + 1 : player.opts.repeat)), of: target });
  };

  const highlight = () => {
    for (const a of ctx.el.querySelectorAll('.ayah.playing')) a.classList.remove('playing');
    if (!playerIsFor(item.id) || !player.current) return;
    const el = ctx.el.querySelector(`#a${player.current.n}`);
    if (el) {
      el.classList.add('playing');
      const r = el.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight - 140) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const onPlayer = () => {
    highlight();
    updateCounter();
    const pa = ctx.el.querySelector('[data-act=play-all], [data-act=mem-play]');
    if (pa) {
      const playing = playerIsFor(item.id) && player.isPlaying;
      pa.innerHTML = `${ic(playing ? 'pause' : 'play')} ${esc(playing ? t('pause') : (pa.dataset.act === 'play-all' ? t('playAll') : t('startRepeating')))}`;
    }
  };
  for (const ev of ['ayah', 'state', 'repeat', 'done']) player.addEventListener(ev, onPlayer);

  // Full-passage queue (memorize mode may have narrowed it to a sub-range).
  const ensureQueue = async () => { if (!playerIsFor(item.id) || player.queue.length !== p.verses.length) await queueAudio(p); };
  const indexOfN = (n) => player.queue.findIndex((q) => q.n === n);

  async function startMem(fromN) {
    await queueAudio(p);
    const m = settings().memorize;
    // Limit the queue to the chosen range by starting at range[0] and stopping after range[1].
    const sub = player.queue.filter((q) => q.n >= range[0] && q.n <= range[1]);
    player.setQueue(sub, player.meta);
    player.setOptions({ repeat: m.repeat, gap: m.gap, rate: m.rate, autoAdvance: true, rangeRepeat: m.rangeRepeat, cache: settings().cacheAudio });
    player.playIndex(Math.max(0, sub.findIndex((q) => q.n === (fromN ?? range[0]))));
    startLearningIfNew();
  }
  function startLearningIfNew() { if (!itemState(item.id)) { startLearning(item.id); drawHead(); } }

  const offs = [
    on(ctx.el, 'click', '[data-tab]', (e, b) => { tab = b.dataset.tab; history.replaceState(null, '', `#/item/${encodeURIComponent(item.id)}?tab=${tab}`); drawBody(); }),
    on(ctx.el, 'click', '[data-act]', async (e, b) => {
      const a = b.dataset.act;
      if (a === 'retry') { load(); return; }
      if (a === 'learn') { startLearning(item.id); toast(t('addedToLearning')); drawHead(); if (tab === 'read') { tab = 'memorize'; drawBody(); } }
      if (a === 'known') { markKnown(item.id); toast(t('addedToMySurahs')); drawHead(); if (tab === 'memorize') drawBody(); }
      if (a === 'remove') { if (confirm(t('confirmRemove'))) { removeItem(item.id); drawHead(); if (p) drawBody(); } }
      if (a === 'size+' || a === 'size-') {
        const v = Math.max(22, Math.min(64, settings().arabicSize + (a === 'size+' ? 3 : -3)));
        setSetting('arabicSize', v);
        for (const el of ctx.el.querySelectorAll('.ayahs')) el.style.setProperty('--qsize', `${v}px`);
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
        startMem();
      }
      if (a === 'mem-from') { range = [+b.dataset.n, Math.max(+b.dataset.n, range[1])]; drawMemorize(); startMem(+b.dataset.n); }
      if (a === 'reveal-all') { for (const v of p.verses) v.words.forEach((_, i) => revealed.add(`${v.n}:${i}`)); drawMemorize(); }
      if (a === 'hide-again') { revealed.clear(); drawMemorize(); }
      if (a === 'ibn-kathir') toggleIbnKathir(+b.dataset.n);
    }),
    on(ctx.el, 'click', '[data-mset]', (e, b) => {
      const key = b.dataset.mset;
      const raw = b.dataset.val;
      const val = raw === 'Infinity' ? Infinity : isNaN(+raw) ? raw : +raw;
      update((s) => { s.settings.memorize[key] = val; }, { silent: true });
      if (playerIsFor(item.id)) player.setOptions({ [key]: val });
      drawMemorize();
    }),
    on(ctx.el, 'click', '[data-hide]', (e, b) => { hideMode = b.dataset.hide; revealed.clear(); drawMemorize(); }),
    on(ctx.el, 'click', '[data-ast]', (e, b) => {
      const n = +b.dataset.n;
      const cur = itemState(item.id)?.ayahs?.[n];
      setAyahStatus(item.id, n, cur === b.dataset.ast ? null : b.dataset.ast);
      drawHead(); drawMemorize();
    }),
    on(ctx.el, 'change', 'select[data-range]', (e, sel) => {
      range[+sel.dataset.range] = +sel.value;
      if (range[0] > range[1]) range = [range[1], range[0]];
      drawMemorize();
    }),
    on(ctx.el, 'change', 'select[data-set]', (e, sel) => {
      const key = sel.dataset.set;
      setSetting(key, key === 'reciter' ? +sel.value : sel.value);
      if (key === 'reciter') { player.stop(); }
      drawBody();
    }),
    on(ctx.el, 'click', '.w', (e, w) => {
      const n = +w.dataset.n, i = +w.dataset.w;
      if (w.classList.contains('hid')) { revealed.add(`${n}:${i}`); w.classList.remove('hid'); w.removeAttribute('role'); return; }
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
      const q = await queueAudioList();
      const res = await cacheAudio(q.map((x) => x.url), (i, n) => { label.textContent = t('savingProgress', { i: fmtNum(i), n: fmtNum(n) }); });
      update((s) => { s.saved[item.id] = { at: Date.now(), reciter: settings().reciter, audio: res.failed === 0 }; });
      toast(res.failed ? t('savedTextOnly') : t('savedOfflineToast'));
    } catch (e) {
      toast(t('saveFailed'));
    }
    btn.disabled = false;
    drawHead();
  }
  const queueAudioList = () => getAudio(settings().reciter, item.surah, p.verses);

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
    clearTimeout(wordTimer);
  };
}
