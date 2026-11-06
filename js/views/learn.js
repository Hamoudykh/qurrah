import { html, mount, on, toast } from '../core/dom.js';
import { t, fmtNum } from '../core/i18n.js';
import { getState, startLearning, markKnown } from '../core/store.js';
import { CATALOG, LEVELS, LEVEL_RULES, itemFromId, customItem } from '../data/catalog.js';
import { CHAPTERS } from '../data/meta.js';
import { suggestNext } from '../logic/suggest.js';
import { ic, itemRow, itemTitle, surahName } from './ui.js';

const FILTERS = ['all', 'easy', 'medium', 'hard', 'mine'];

export async function render(ctx) {
  ctx.setTitle(t('tabLearn'));
  let filter = FILTERS.includes(ctx.query.filter) ? ctx.query.filter : (ctx.query.level || 'all');
  let q = '';

  const draw = () => {
    const s = getState();
    const sug = suggestNext(s.items);
    const custom = Object.keys(s.items).map(itemFromId).filter((it) => it && it.custom);
    const matches = (it) => !q || itemTitle(it).toLowerCase().includes(q) || String(it.surah) === q || surahName(it.surah).toLowerCase().includes(q);
    let items;
    if (filter === 'mine') items = [...CATALOG, ...custom].filter((it) => s.items[it.id]);
    else if (filter === 'all') items = CATALOG.filter((c) => c.level !== 'foundation');
    else items = CATALOG.filter((c) => c.level === filter);
    items = items.filter(matches);
    const mineKnown = Object.values(s.items).filter((x) => x.status === 'known').length;

    mount(ctx.el, html`
      <div class="seg scroll" role="tablist" aria-label="${t('filterByLevel')}">
        ${FILTERS.map((f) => html`<button role="tab" aria-selected="${filter === f}" class="${filter === f ? 'on' : ''}" data-filter="${f}">${f === 'mine' ? t('mySurahs') : f === 'all' ? t('all') : t(`level_${f}`)}</button>`)}
      </div>
      <label class="search">${ic('search')}<input type="search" placeholder="${t('searchSurah')}" value="${q}" aria-label="${t('searchSurah')}"></label>

      ${filter === 'all' && !q ? html`<a class="card link-card foundation" href="#/item/s1">
          <div><p class="eyebrow">${t('foundation')}</p><h3>${itemTitle(CATALOG[0])}</h3><p class="muted small">${t('foundationNote')}</p></div>${ic('forward', 'flip-rtl')}</a>` : ''}

      ${LEVELS.includes(filter) ? html`<p class="muted small level-rule">${t(`levelRule_${filter}`, { words: LEVEL_RULES[filter].maxWords ?? 45, ayah: LEVEL_RULES[filter].maxAyahWords ?? 18 })}
        · ${t('levelProgress', { known: fmtNum(sug.progress[filter].known), total: fmtNum(sug.progress[filter].total) })}</p>` : ''}

      ${filter === 'mine' ? html`<p class="muted small">${t('mySurahsSummary', { n: fmtNum(mineKnown) })}</p>` : ''}

      <div class="list">
        ${items.length ? items.map((it) => itemRow(it)) : html`<p class="muted empty">${filter === 'mine' ? t('mySurahsEmpty') : t('noMatches')}</p>`}
      </div>

      <section class="card">
        <h3>${t('addCustom')}</h3>
        <p class="muted small">${t('addCustomHint')}</p>
        <form class="custom-form" data-form="custom">
          <label class="field"><span>${t('surah')}</span>
            <select name="surah">${CHAPTERS.map((c) => html`<option value="${c.id}">${c.id}. ${surahName(c.id)}</option>`)}</select></label>
          <div class="row gap">
            <label class="field"><span>${t('fromAyah')}</span><input name="from" type="number" min="1" value="1" inputmode="numeric"></label>
            <label class="field"><span>${t('toAyah')}</span><input name="to" type="number" min="1" value="7" inputmode="numeric"></label>
          </div>
          <div class="row gap wrap">
            <button class="btn" name="mode" value="learn">${ic('plus')} ${t('addToLearning')}</button>
            <button class="btn ghost" name="mode" value="known">${ic('check')} ${t('iKnowThis')}</button>
          </div>
        </form>
      </section>
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
    on(ctx.el, 'click', '[data-filter]', (e, b) => { filter = b.dataset.filter; history.replaceState(null, '', `#/learn?filter=${filter}`); draw(); }),
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
