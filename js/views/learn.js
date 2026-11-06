import { html, mount, on, toast } from '../core/dom.js';
import { t, fmtNum, getLang } from '../core/i18n.js';
import { getState, startLearning, markKnown } from '../core/store.js';
import { CATALOG, LEVELS, LEVEL_RULES, itemFromId, customItem } from '../data/catalog.js';
import { CHAPTERS } from '../data/meta.js';
import { suggestNext } from '../logic/suggest.js';
import { ic, itemTitle, surahName, tile } from './ui.js';
import { ring } from './viz.js';

const FILTERS = ['all', 'easy', 'medium', 'hard', 'mine'];

export async function render(ctx) {
  ctx.setTitle(t('tabLearn'));
  let filter = FILTERS.includes(ctx.query.filter) ? ctx.query.filter : (ctx.query.level || 'all');
  let q = '';

  const draw = () => {
    const s = getState();
    const sug = suggestNext(s.items);
    const custom = Object.keys(s.items).map(itemFromId).filter((it) => it && it.custom);
    const matches = (it) => !q || itemTitle(it).toLowerCase().includes(q) || String(it.surah) === q || surahName(it.surah).toLowerCase().includes(q)
      || CHAPTERS[it.surah - 1].nameArabic.includes(q) || CHAPTERS[it.surah - 1].nameSimple.toLowerCase().includes(q);
    let items;
    if (filter === 'mine') items = [...CATALOG, ...custom].filter((it) => s.items[it.id]);
    else if (filter === 'all') items = CATALOG.filter((c) => c.level !== 'foundation');
    else items = CATALOG.filter((c) => c.level === filter);
    items = items.filter(matches);
    const knownAll = CATALOG.filter((c) => c.level !== 'foundation' && s.items[c.id]?.status === 'known').length;
    const totalAll = CATALOG.length - 1;

    mount(ctx.el, html`
      <section class="card journey">
        <div class="journey-head"><h2>${t('yourJourney')}</h2><span class="small muted">${t('knownOfTotal', { known: fmtNum(knownAll), total: fmtNum(totalAll) })}</span></div>
        <div class="levels">
          ${LEVELS.map((l) => {
            const p = sug.progress[l];
            return html`<button class="level-node lvl-${l} ${sug.level === l ? 'current' : ''} ${filter === l ? 'on' : ''}" data-filter="${l}" aria-pressed="${filter === l}">
              ${ring(p.known / p.total, { size: 66, stroke: 5, inner: html`<b>${fmtNum(p.known)}</b>` })}
              <b>${t(`level_${l}`)}</b><small>${t('xOfY', { a: fmtNum(p.known), b: fmtNum(p.total) })}</small></button>`;
          })}
        </div>
        ${LEVELS.includes(filter) ? html`<p class="small muted center" style="margin:10px 0 0">${t(`levelRule_${filter}`, { words: fmtNum(LEVEL_RULES[filter].maxWords ?? 45), ayah: fmtNum(LEVEL_RULES[filter].maxAyahWords ?? 18) })}</p>` : ''}
      </section>

      <div class="filter-row" role="tablist" aria-label="${t('filterByLevel')}">
        ${FILTERS.map((f) => html`<button role="tab" aria-selected="${filter === f}" class="chip-toggle ${filter === f ? 'on' : ''}" data-filter="${f}">${f === 'mine' ? t('mySurahs') : f === 'all' ? t('all') : t(`level_${f}`)}</button>`)}
      </div>
      <label class="search">${ic('search')}<input type="search" placeholder="${t('searchSurah')}" value="${q}" aria-label="${t('searchSurah')}"></label>

      ${filter === 'all' && !q ? html`<a class="card link-card foundation" href="#/item/s1">
          <div><p class="eyebrow">${ic('star')} ${t('foundation')}</p><h3 lang="ar">${CHAPTERS[0].nameArabic}</h3><p class="muted small">${t('foundationNote')}</p></div>
          <span class="round-btn" style="background:rgba(255,255,255,.15);color:#fff">${ic('forward', 'flip-rtl')}</span></a>` : ''}

      ${filter === 'mine' && !items.length ? html`<p class="muted empty">${t('mySurahsEmpty')}</p>` : ''}
      ${items.length ? html`<div class="tiles">${items.map((it) => tile(it, { suggested: sug.next?.id === it.id }))}</div>` : (filter !== 'mine' ? html`<p class="muted empty">${t('noMatches')}</p>` : '')}

      <details class="card custom-card">
        <summary>${ic('plus')} ${t('addCustom')}</summary>
        <p class="muted small">${t('addCustomHint')}</p>
        <form class="custom-form" data-form="custom">
          <label class="field"><span>${t('surah')}</span>
            <select name="surah">${CHAPTERS.map((c) => html`<option value="${c.id}">${c.id}. ${getLang() === 'ar' ? c.nameArabic : `${c.nameSimple} · ${c.nameArabic}`}</option>`)}</select></label>
          <div class="row gap">
            <label class="field"><span>${t('fromAyah')}</span><input name="from" type="number" min="1" value="1" inputmode="numeric"></label>
            <label class="field"><span>${t('toAyah')}</span><input name="to" type="number" min="1" value="7" inputmode="numeric"></label>
          </div>
          <div class="row gap wrap">
            <button class="btn primary" name="mode" value="learn">${ic('plus')} ${t('addToLearning')}</button>
            <button class="btn ghost" name="mode" value="known">${ic('check')} ${t('iKnowThis')}</button>
          </div>
        </form>
      </details>
      <p class="small muted center"><a href="#/sources#levels">${t('howLevelsWork')}</a></p>
    `);
    const sel = ctx.el.querySelector('select[name=surah]');
    const setMax = () => {
      const c = CHAPTERS[sel.value - 1];
      const f = ctx.el.querySelector('input[name=from]'), to = ctx.el.querySelector('input[name=to]');
      f.max = to.max = c.verses;
      if (+to.value > c.verses) to.value = c.verses;
      if (+f.value > c.verses) f.value = 1;
    };
    sel.addEventListener('change', () => { ctx.el.querySelector('input[name=to]').value = CHAPTERS[sel.value - 1].verses; setMax(); });
    setMax();
  };
  draw();

  const offs = [
    on(ctx.el, 'click', '[data-filter]', (e, b) => {
      const f = b.dataset.filter;
      filter = filter === f && LEVELS.includes(f) ? 'all' : f;
      history.replaceState(null, '', `#/learn?filter=${filter}`);
      draw();
    }),
    on(ctx.el, 'input', 'input[type=search]', (e, inp) => {
      q = inp.value.trim().toLowerCase();
      const pos = inp.selectionStart;
      draw();
      const n = ctx.el.querySelector('input[type=search]'); n.focus(); n.setSelectionRange(pos, pos);
    }),
    on(ctx.el, 'submit', '[data-form=custom]', (e, form) => {
      e.preventDefault();
      const fd = new FormData(form);
      const surah = +fd.get('surah');
      const c = CHAPTERS[surah - 1];
      let from = Math.max(1, Math.min(c.verses, +fd.get('from') || 1));
      let to = Math.max(from, Math.min(c.verses, +fd.get('to') || from));
      const whole = from === 1 && to === c.verses;
      const catalogHit = CATALOG.find((x) => (whole && x.type === 'surah' && x.surah === surah) || (x.type === 'passage' && x.surah === surah && x.from === from && x.to === to));
      const item = catalogHit || (whole ? itemFromId(`s${surah}`) : customItem(surah, from, to));
      const mode = e.submitter?.value || 'learn';
      if (mode === 'known') { markKnown(item.id); toast(t('addedToMySurahs')); } else { startLearning(item.id); toast(t('addedToLearning')); }
      location.hash = `#/item/${encodeURIComponent(item.id)}`;
    }),
  ];
  return () => offs.forEach((f) => f());
}
